import { NextRequest, NextResponse } from "next/server";
import { generateWithHistory, MODELS, ThinkingLevel } from "@/lib/ai/gemini-client";

const CHAT_SYSTEM_PROMPT = `You are a helpful AI writing assistant for a Bulgarian fiction writing application.

Your role is to:
1. Discuss story ideas, plot developments, and character arcs with the author
2. Provide suggestions and feedback on the writing
3. Help brainstorm solutions to narrative problems
4. Answer questions about the story and its elements
5. Assist with world-building and character development

IMPORTANT RULES:
- Always respond in Bulgarian (български език)
- Be supportive and constructive in your feedback
- Respect the author's creative vision
- Reference the MasterJSON context when discussing story elements
- Use @ mentions (like @Глава1, @Персонаж) when referencing specific elements
- Provide specific, actionable suggestions rather than vague advice

When the author asks you to write something, write high-quality Bulgarian prose that matches the established style.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, masterJson, chapterContext, selectedChapters } = body;

    // Build context for the conversation
    let contextPrompt = "";

    if (masterJson) {
      contextPrompt += `## КОНТЕКСТ НА ПРОЕКТА\n`;
      contextPrompt += `Заглавие: ${masterJson.projectMetadata?.title || "Без заглавие"}\n`;
      contextPrompt += `Жанр: ${masterJson.projectMetadata?.genre || "Не е определен"}\n\n`;

      // Add characters summary
      const characters = Object.values(masterJson.characters?.permanent || {});
      if (characters.length > 0) {
        contextPrompt += `### Персонажи\n`;
        characters.forEach((char: any) => {
          contextPrompt += `- ${char.name}: ${char.physicalDescription || "Без описание"}\n`;
        });
        contextPrompt += "\n";
      }

      // Add locations summary
      const locations = Object.values(masterJson.locations?.permanent || {});
      if (locations.length > 0) {
        contextPrompt += `### Локации\n`;
        locations.forEach((loc: any) => {
          contextPrompt += `- ${loc.name}: ${loc.description || "Без описание"}\n`;
        });
        contextPrompt += "\n";
      }
    }

    if (chapterContext) {
      contextPrompt += `## ТЕКУЩА ГЛАВА\n`;
      contextPrompt += `Глава ${chapterContext.number}: ${chapterContext.title}\n`;
      contextPrompt += `Резюме: ${chapterContext.summary || "Няма резюме"}\n\n`;
    }

    if (selectedChapters && selectedChapters.length > 0) {
      contextPrompt += `## ИЗБРАНИ ГЛАВИ ЗА КОНТЕКСТ\n`;
      selectedChapters.forEach((chapter: any) => {
        contextPrompt += `### Глава ${chapter.number}: ${chapter.title}\n`;
        if (chapter.content) {
          contextPrompt += `${chapter.content.substring(0, 2000)}${chapter.content.length > 2000 ? "..." : ""}\n`;
        }
        contextPrompt += "\n";
      });
    }

    // Format messages for the API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      content: msg.content,
    }));

    // Add context to the first user message
    if (formattedMessages.length > 0 && contextPrompt) {
      const firstUserIndex = formattedMessages.findIndex((m: any) => m.role === "user");
      if (firstUserIndex >= 0) {
        formattedMessages[firstUserIndex].content = 
          `${contextPrompt}\n\n---\n\n${formattedMessages[firstUserIndex].content}`;
      }
    }

    const result = await generateWithHistory(
      formattedMessages,
      CHAT_SYSTEM_PROMPT,
      {
        model: MODELS.FLASH,
        thinkingLevel: ThinkingLevel.MEDIUM,
        temperature: 0.8,
        maxOutputTokens: 4096,
      }
    );

    return NextResponse.json({
      content: result.text,
      tokensUsed: result.tokensUsed,
      model: MODELS.FLASH,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Грешка при комуникацията с AI" },
      { status: 500 }
    );
  }
}
