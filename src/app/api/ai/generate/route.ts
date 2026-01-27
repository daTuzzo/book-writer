import { NextRequest, NextResponse } from "next/server";
import { generateContent, MODELS, ThinkingLevel } from "@/lib/ai/gemini-client";
import { WRITING_AGENT_PROMPT } from "@/lib/ai/prompts/system-prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      chapter,
      chapterContext,
      masterJson,
      previousChapters,
      existingContent,
      currentContent,
      instructions,
      styleGuide,
    } = body;
    
    // Support both old format (chapterContext) and new format (chapter)
    const chapterData = chapter || chapterContext;

    // Build the prompt based on generation type
    let prompt = "";

    // Add MasterJSON context
    if (masterJson) {
      prompt += `## КОНТЕКСТ НА ИСТОРИЯТА (MasterJSON)\n${JSON.stringify(masterJson, null, 2)}\n\n`;
    }

    // Add previous chapters for context
    if (previousChapters && previousChapters.length > 0) {
      prompt += `## ПРЕДИШНИ ГЛАВИ\n`;
      for (const chapter of previousChapters) {
        prompt += `### Глава ${chapter.number}: ${chapter.title}\n${chapter.content}\n\n`;
      }
    }

    // Add current chapter context
    if (chapterData) {
      prompt += `## ТЕКУЩА ГЛАВА\n`;
      prompt += `Номер: ${chapterData.number || chapterData.chapterNumber}\n`;
      prompt += `Заглавие: ${chapterData.title}\n`;
      prompt += `Резюме: ${chapterData.summary}\n`;
      prompt += `Ключови събития: ${chapterData.keyEvents?.join(", ") || "Не са определени"}\n`;
      prompt += `Емоционална дъга: ${chapterData.emotionalArc || "Не е определена"}\n`;
      prompt += `Целеви брой думи: ${chapterData.targetWordCount || "Не е определен"}\n\n`;
    }

    // Add current content if continuing
    const contentToUse = existingContent || currentContent;
    if (contentToUse) {
      prompt += `## НАПИСАНО ДОСЕГА\n${contentToUse}\n\n`;
    }

    // Add generation instructions
    prompt += `## ЗАДАЧА\n`;
    switch (type) {
      case "full-chapter":
      case "full":
        prompt += `Напиши цялата глава на български език. Следвай плана и контекста внимателно. Целта е ${chapterData?.targetWordCount || 8000} думи.\n`;
        break;
      case "continue":
        prompt += `Продължи писането от където е спряло. Поддържай същия стил и тон. Напиши поне 500-1000 думи.\n`;
        break;
      case "paragraph":
        prompt += `Напиши един параграф (100-200 думи), който продължава историята естествено.\n`;
        break;
      case "section":
        prompt += `Напиши следващата секция от главата (500-1000 думи).\n`;
        break;
      default:
        prompt += `Напиши съдържание за тази глава.\n`;
    }

    if (instructions) {
      prompt += `\nДопълнителни инструкции: ${instructions}\n`;
    }

    // Build system prompt with style guide
    let systemPrompt = WRITING_AGENT_PROMPT;
    if (styleGuide) {
      systemPrompt += `\n\n## СТИЛОВ УКАЗАТЕЛ\n`;
      systemPrompt += `Тон: ${styleGuide.tone || "Не е определен"}\n`;
      systemPrompt += `POV: ${styleGuide.pov || "third-limited"}\n`;
      systemPrompt += `Време: ${styleGuide.tense === "present" ? "Сегашно" : "Минало"}\n`;
      if (styleGuide.vocabulary?.length > 0) {
        systemPrompt += `Предпочитани думи: ${styleGuide.vocabulary.join(", ")}\n`;
      }
      if (styleGuide.avoidWords?.length > 0) {
        systemPrompt += `Избягвай: ${styleGuide.avoidWords.join(", ")}\n`;
      }
    }

    const result = await generateContent(prompt, systemPrompt, {
      model: MODELS.PRO,
      thinkingLevel: ThinkingLevel.HIGH,
      temperature: 0.8,
      maxOutputTokens: 16384,
    });

    return NextResponse.json({
      content: result.text,
      tokensUsed: result.tokensUsed,
      model: MODELS.PRO,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Грешка при генерирането на съдържание" },
      { status: 500 }
    );
  }
}
