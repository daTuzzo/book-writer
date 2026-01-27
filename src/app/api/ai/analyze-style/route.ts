import { NextRequest, NextResponse } from "next/server";
import { generateContent, MODELS, ThinkingLevel } from "@/lib/ai/gemini-client";
import { STYLE_ANALYSIS_AGENT_PROMPT } from "@/lib/ai/prompts/system-prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sampleText } = body;

    if (!sampleText || sampleText.length < 500) {
      return NextResponse.json(
        { error: "Необходим е текст от поне 500 символа за анализ" },
        { status: 400 }
      );
    }

    const prompt = `Анализирай следния текст и извлечи стиловите характеристики на автора.

## ТЕКСТ ЗА АНАЛИЗ
${sampleText}

## ИЗХОДЕН ФОРМАТ
Върни анализа като JSON обект със следната структура:
{
  "sentenceLength": "short" | "medium" | "long" | "varied",
  "paragraphLength": "short" | "medium" | "long",
  "dialogueStyle": "описание на стила на диалозите",
  "descriptionDensity": "sparse" | "moderate" | "rich",
  "emotionalTone": "описание на емоционалния тон",
  "pacingStyle": "описание на темпото",
  "samplePhrases": ["характерни фрази или изрази"],
  "vocabulary": ["предпочитани думи"],
  "avoidWords": ["думи, които авторът избягва"],
  "writingPatterns": ["характерни писателски похвати"],
  "tone": "общ тон на писането",
  "narrativeVoice": "описание на наративния глас"
}

Анализирай внимателно и върни само валиден JSON.`;

    const result = await generateContent(prompt, STYLE_ANALYSIS_AGENT_PROMPT, {
      model: MODELS.PRO,
      thinkingLevel: ThinkingLevel.HIGH,
      temperature: 0.3,
      maxOutputTokens: 4096,
    });

    // Try to parse the JSON from the response
    let analysisResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = result.text.match(/```json\n?([\s\S]*?)\n?```/) || 
                        result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        analysisResult = JSON.parse(jsonStr);
      } else {
        analysisResult = JSON.parse(result.text);
      }
    } catch (parseError) {
      console.error("Failed to parse style analysis:", parseError);
      // Return a default structure if parsing fails
      analysisResult = {
        sentenceLength: "varied",
        paragraphLength: "medium",
        dialogueStyle: "Не може да се определи",
        descriptionDensity: "moderate",
        emotionalTone: "Неутрален",
        pacingStyle: "Умерено",
        samplePhrases: [],
        vocabulary: [],
        avoidWords: [],
        writingPatterns: [],
        tone: "Не може да се определи",
        narrativeVoice: "Не може да се определи",
        rawAnalysis: result.text,
      };
    }

    return NextResponse.json({
      analysis: analysisResult,
      tokensUsed: result.tokensUsed,
      model: MODELS.PRO,
    });
  } catch (error) {
    console.error("Style analysis error:", error);
    return NextResponse.json(
      { error: "Грешка при анализа на стила" },
      { status: 500 }
    );
  }
}
