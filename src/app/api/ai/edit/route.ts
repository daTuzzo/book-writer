import { NextRequest, NextResponse } from "next/server";
import { generateContent, MODELS, ThinkingLevel } from "@/lib/ai/gemini-client";
import { EDITOR_AGENT_PROMPT, GRAMMAR_AGENT_PROMPT } from "@/lib/ai/prompts/system-prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, context, type, content, targetStyle, styleGuide } = body;
    
    // Support both old format (type, content) and new format (action, text)
    const editType = action || type;
    const editContent = text || content;

    let prompt = "";
    let systemPrompt = EDITOR_AGENT_PROMPT;
    let useFlash = false;

    // Add context if provided
    let contextStr = "";
    if (context) {
      if (context.chapterTitle) contextStr += `Глава: ${context.chapterTitle}\n`;
      if (context.chapterSummary) contextStr += `Резюме: ${context.chapterSummary}\n`;
    }

    switch (editType) {
      case "shorten":
        prompt = `${contextStr ? `## Контекст\n${contextStr}\n` : ""}Съкрати следния текст, като запазиш ключовата информация и стила на писане. Намали дължината с около 30-40%.\n\nТекст:\n${editContent}\n\nСъкратена версия:`;
        useFlash = true;
        break;

      case "expand":
        prompt = `${contextStr ? `## Контекст\n${contextStr}\n` : ""}Разшири следния текст, като добавиш повече детайли, описания и сензорни елементи. Удвой приблизително дължината, без да повтаряш информация.\n\nТекст:\n${editContent}\n\nРазширена версия:`;
        break;

      case "restyle":
        prompt = `${contextStr ? `## Контекст\n${contextStr}\n` : ""}Пренапиши следния текст в ${targetStyle || "различен"} стил, запазвайки същото значение и действие.\n\nТекст:\n${editContent}\n\nПренаписана версия:`;
        break;

      case "simplify":
        prompt = `${contextStr ? `## Контекст\n${contextStr}\n` : ""}Опрости езика в следния текст, като го направиш по-достъпен за четене, без да губиш важни детайли.\n\nТекст:\n${editContent}\n\nОпростена версия:`;
        useFlash = true;
        break;

      case "enhance":
        prompt = `${contextStr ? `## Контекст\n${contextStr}\n` : ""}Подобри следния текст, като добавиш литературни похвати - метафори, сравнения, по-богат език, където е подходящо.\n\nТекст:\n${editContent}\n\nПодобрена версия:`;
        break;

      case "grammar":
        prompt = `Провери и поправи граматиката, правописа и пунктуацията в следния текст на български език. Запази стила и гласа на автора.\n\nТекст:\n${editContent}\n\nКоригирана версия:`;
        systemPrompt = GRAMMAR_AGENT_PROMPT;
        useFlash = true;
        break;

      case "rewrite":
        prompt = `${contextStr ? `## Контекст\n${contextStr}\n` : ""}Пренапиши напълно следния текст, запазвайки основната идея и действие, но с изцяло нов подход и изразни средства.\n\nТекст:\n${editContent}\n\nПренаписана версия:`;
        break;

      default:
        prompt = `${contextStr ? `## Контекст\n${contextStr}\n` : ""}Редактирай следния текст:\n\n${editContent}\n\nРедактирана версия:`;
    }

    // Add style guide context if provided
    if (styleGuide || context?.masterJson?.styleGuide) {
      const sg = styleGuide || context?.masterJson?.styleGuide;
      prompt = `## Стилов указател\nТон: ${sg.tone || "Не е определен"}\nPOV: ${sg.pov || "third-limited"}\n\n${prompt}`;
    }

    const result = await generateContent(prompt, systemPrompt, {
      model: useFlash ? MODELS.FLASH : MODELS.PRO,
      thinkingLevel: useFlash ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
      temperature: 0.7,
      maxOutputTokens: 8192,
    });

    return NextResponse.json({
      result: result.text,
      content: result.text,
      tokensUsed: result.tokensUsed,
      model: useFlash ? MODELS.FLASH : MODELS.PRO,
    });
  } catch (error) {
    console.error("Edit error:", error);
    return NextResponse.json(
      { error: "Грешка при редактирането на съдържание" },
      { status: 500 }
    );
  }
}
