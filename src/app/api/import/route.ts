import { NextRequest, NextResponse } from "next/server";
import { generateContent, MODELS, ThinkingLevel } from "@/lib/ai/gemini-client";
import { analyzeBookOptimized, needsChunkedProcessing } from "@/lib/ai/book-analyzer";
import mammoth from "mammoth";

// Used only for small books that don't need chunking
const BOOK_IMPORT_PROMPT = `You are a book analysis expert specializing in Bulgarian literature. Your task is to analyze the provided book text and extract structured information.

ANALYSIS REQUIREMENTS:
1. Identify chapters - look for patterns like "Глава", "ГЛАВА", Roman numerals (I, II, III), numbers (1, 2, 3), or clear section breaks
2. Extract all character names mentioned and create brief descriptions based on context
3. Extract all location names and describe them based on context
4. Analyze the writing style (tone, POV, tense, description density)

OUTPUT FORMAT: You MUST return valid JSON with this exact structure:
{
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Chapter title or generated title",
      "content": "Full chapter text",
      "summary": "Brief summary in Bulgarian"
    }
  ],
  "characters": [
    {
      "name": "Character name",
      "description": "Brief description in Bulgarian",
      "traits": ["trait1", "trait2"]
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "description": "Description in Bulgarian",
      "type": "city|village|building|nature|other"
    }
  ],
  "styleAnalysis": {
    "tone": "description of tone in Bulgarian",
    "pov": "first|third-limited|third-omniscient",
    "tense": "past|present",
    "descriptionDensity": "sparse|moderate|rich",
    "dialogueStyle": "description in Bulgarian"
  }
}

IMPORTANT:
- All descriptions and summaries must be in Bulgarian
- If no clear chapters exist, split by logical sections or every ~2000 words
- Include ALL text in chapters - don't skip any content
- Be thorough with character and location extraction`;

async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === "application/pdf") {
    // PDF support temporarily disabled - complex library issues
    throw new Error("PDF файловете временно не се поддържат. Моля, конвертирайте към DOCX или TXT.");
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Не е качен файл" },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Файлът е твърде голям. Максимум 10MB." },
        { status: 400 }
      );
    }

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;

    try {
      text = await extractTextFromFile(buffer, file.type);
    } catch (error) {
      return NextResponse.json(
        { error: `Грешка при четене на файла: ${error instanceof Error ? error.message : "Unknown"}` },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: "Файлът е празен или съдържа твърде малко текст" },
        { status: 400 }
      );
    }

    // Truncate if too long (Gemini context limit)
    const maxChars = 800000; // Increased limit for chunked processing (~200k tokens)
    if (text.length > maxChars) {
      text = text.substring(0, maxChars);
    }

    let analysis;

    // Use optimized chunked processing for large books (>40k tokens)
    if (needsChunkedProcessing(text)) {
      console.log(`Using optimized chunked analysis for ${text.length} chars`);
      try {
        analysis = await analyzeBookOptimized(text, (progress) => {
          console.log(`Import progress: ${progress}`);
        });
      } catch (error) {
        console.error("Chunked analysis error:", error);
        return NextResponse.json(
          { error: "Грешка при анализ на книгата. Моля, опитайте отново." },
          { status: 500 }
        );
      }
    } else {
      // Small book - use original single-call approach with Flash model for speed
      console.log(`Using fast single-pass analysis for ${text.length} chars`);
      const prompt = `Analyze this Bulgarian book text and extract chapters, characters, locations, and style information.

BOOK TEXT:
${text}

Remember to return ONLY valid JSON in the specified format.`;

      const { text: responseText } = await generateContent(
        prompt,
        BOOK_IMPORT_PROMPT,
        {
          model: MODELS.FLASH, // Use Flash instead of Pro for speed!
          thinkingLevel: ThinkingLevel.LOW, // Minimal thinking for extraction
          temperature: 0.3,
          maxOutputTokens: 32768,
        }
      );

      // Parse JSON from response
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        analysis = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("Failed to parse AI response:", responseText);
        return NextResponse.json(
          { error: "Грешка при анализ на книгата. Моля, опитайте отново." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      originalTextLength: text.length,
      usedChunkedProcessing: needsChunkedProcessing(text),
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Грешка при импортиране на книгата" },
      { status: 500 }
    );
  }
}
