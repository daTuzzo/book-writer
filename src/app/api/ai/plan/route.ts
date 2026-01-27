import { NextRequest, NextResponse } from "next/server";
import { generateContent, MODELS, ThinkingLevel } from "@/lib/ai/gemini-client";
import { PLAN_GENERATION_AGENT_PROMPT } from "@/lib/ai/prompts/system-prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectName,
      description,
      genre,
      style,
      complexity,
      targetWordCount,
      numberOfChapters,
      structure,
      existingPlan,
      additionalInstructions,
    } = body;

    const chaptersCount = numberOfChapters || 10;
    const wordCount = targetWordCount || 80000;
    const planStructure = structure || "three-act";

    let prompt = `Създай подробен план за книга на български език.

## ИНФОРМАЦИЯ ЗА ПРОЕКТА
- Заглавие: ${projectName}
- Описание: ${description || "Не е предоставено"}
- Жанр: ${genre || "Не е определен"}
- Стил: ${style || "Не е определен"}
- Сложност: ${complexity || "moderate"}
- Целеви брой думи: ${wordCount.toLocaleString()}
- Брой глави: ${chaptersCount}
- Структура: ${planStructure}

`;

    if (existingPlan) {
      prompt += `## СЪЩЕСТВУВАЩ ПЛАН (за редакция)
${JSON.stringify(existingPlan, null, 2)}

Подобри и разшири този план според инструкциите.

`;
    }

    if (additionalInstructions) {
      prompt += `## ДОПЪЛНИТЕЛНИ ИНСТРУКЦИИ
${additionalInstructions}

`;
    }

    prompt += `## ИЗХОДЕН ФОРМАТ
Върни плана като JSON обект със следната структура:
{
  "title": "Заглавие на книгата",
  "totalChapters": ${chaptersCount},
  "estimatedWordCount": ${wordCount},
  "structure": "${planStructure}",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Заглавие на главата (на български)",
      "summary": "Подробно резюме на главата (на български)",
      "keyEvents": ["Събитие 1", "Събитие 2"],
      "charactersInvolved": ["Персонаж 1", "Персонаж 2"],
      "locationsUsed": ["Локация 1"],
      "emotionalArc": "Описание на емоционалната дъга",
      "plotProgressions": ["Развитие на сюжета"],
      "targetWordCount": ${Math.round(wordCount / chaptersCount)},
      "actualWordCount": 0,
      "status": "planned",
      "sections": [],
      "content": ""
    }
  ],
  "acts": [
    {
      "actNumber": 1,
      "title": "Акт 1: Експозиция",
      "chapters": [1, 2, 3],
      "purpose": "Въведение в света и героите"
    }
  ]
}

Създай детайлен и завладяващ план с интересни обрати и развитие на персонажите. Всички текстове трябва да са на български език.`;

    const result = await generateContent(prompt, PLAN_GENERATION_AGENT_PROMPT, {
      model: MODELS.PRO,
      thinkingLevel: ThinkingLevel.HIGH,
      temperature: 0.7,
      maxOutputTokens: 16384,
    });

    // Try to parse the JSON from the response
    let planResult;
    try {
      const jsonMatch = result.text.match(/```json\n?([\s\S]*?)\n?```/) || 
                        result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        planResult = JSON.parse(jsonStr);
      } else {
        planResult = JSON.parse(result.text);
      }
    } catch (parseError) {
      console.error("Failed to parse plan:", parseError);
      return NextResponse.json(
        { error: "Грешка при парсване на плана. Моля, опитайте отново.", rawText: result.text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plan: planResult,
      tokensUsed: result.tokensUsed,
      model: MODELS.PRO,
    });
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Грешка при генерирането на план" },
      { status: 500 }
    );
  }
}
