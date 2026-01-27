import { NextRequest, NextResponse } from "next/server";
import { generateContent, MODELS, ThinkingLevel } from "@/lib/ai/gemini-client";
import { CONTINUITY_AGENT_PROMPT } from "@/lib/ai/prompts/system-prompts";

interface ContinuityIssue {
  type: "character" | "location" | "plot" | "timeline" | "logic";
  severity: "error" | "warning" | "suggestion";
  description: string;
  location?: string;
  suggestion?: string;
}

interface ContinuityResponse {
  isConsistent: boolean;
  issues: ContinuityIssue[];
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, masterJson, previousChapters, chapterInfo } = body;

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Текстът е твърде кратък за анализ" },
        { status: 400 }
      );
    }

    // Build the analysis prompt
    let prompt = `Анализирай следния текст за проблеми с континюитета и логически грешки.

## ТЕКСТ ЗА АНАЛИЗ:
${content}

`;

    if (masterJson) {
      prompt += `## MASTERJAN (БАЗОВИ ДАННИ):
### Персонажи:
${JSON.stringify(masterJson.characters?.permanent || {}, null, 2)}

### Локации:
${JSON.stringify(masterJson.locations?.permanent || {}, null, 2)}

### Сюжетни елементи:
${JSON.stringify(masterJson.plotElements || {}, null, 2)}

### Правила за континюитет:
${JSON.stringify(masterJson.continuityRules || [], null, 2)}

`;
    }

    if (previousChapters && previousChapters.length > 0) {
      prompt += `## ПРЕДИШНИ ГЛАВИ (резюме):
`;
      previousChapters.forEach((ch: any) => {
        prompt += `Глава ${ch.number}: ${ch.title}
${ch.summary || ch.content?.substring(0, 500) || "Без съдържание"}

`;
      });
    }

    if (chapterInfo) {
      prompt += `## ТЕКУЩА ГЛАВА:
Номер: ${chapterInfo.number}
Заглавие: ${chapterInfo.title}
Очаквани събития: ${chapterInfo.keyEvents?.join(", ") || "Не са определени"}

`;
    }

    prompt += `## ЗАДАЧА:
Провери текста за:
1. Несъответствия с описаните персонажи (външен вид, характер, поведение)
2. Грешки в описанието на локации
3. Противоречия с установени сюжетни факти
4. Проблеми с времевата линия (анахронизми)
5. Логически грешки и нереалистични моменти

ФОРМАТ НА ОТГОВОРА: Върни САМО валиден JSON:
{
  "isConsistent": true/false,
  "issues": [
    {
      "type": "character|location|plot|timeline|logic",
      "severity": "error|warning|suggestion",
      "description": "Описание на проблема на български",
      "location": "Къде в текста (ако е приложимо)",
      "suggestion": "Как да се поправи"
    }
  ],
  "summary": "Кратко обобщение на анализа на български"
}

Ако текстът е консистентен, върни isConsistent: true с празен масив issues.`;

    const { text: responseText } = await generateContent(
      prompt,
      CONTINUITY_AGENT_PROMPT,
      {
        model: MODELS.FLASH,
        thinkingLevel: ThinkingLevel.MEDIUM,
        temperature: 0.3,
        maxOutputTokens: 4096,
      }
    );

    // Parse the response
    let analysis: ContinuityResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse continuity response:", responseText);
      return NextResponse.json({
        isConsistent: true,
        issues: [],
        summary: "Не успях да анализирам текста. Моля, опитайте отново.",
      });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Continuity check error:", error);
    return NextResponse.json(
      { error: "Грешка при проверка на континюитета" },
      { status: 500 }
    );
  }
}
