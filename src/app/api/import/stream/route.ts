import { NextRequest } from "next/server";
import { analyzeBookOptimized } from "@/lib/ai/book-analyzer";
import mammoth from "mammoth";

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
    throw new Error("PDF файловете временно не се поддържат. Моля, конвертирайте към DOCX или TXT.");
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Streaming import endpoint that provides real-time progress updates.
 * Uses Server-Sent Events (SSE) to stream progress to the client.
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
          sendEvent("error", { error: "Не е качен файл" });
          controller.close();
          return;
        }

        // Check file size (15MB limit for streaming - can handle larger)
        if (file.size > 15 * 1024 * 1024) {
          sendEvent("error", { error: "Файлът е твърде голям. Максимум 15MB." });
          controller.close();
          return;
        }

        sendEvent("progress", { message: "Извличане на текст от файла...", percent: 5 });

        // Extract text from file
        const buffer = Buffer.from(await file.arrayBuffer());
        let text: string;

        try {
          text = await extractTextFromFile(buffer, file.type);
        } catch (error) {
          sendEvent("error", {
            error: `Грешка при четене на файла: ${error instanceof Error ? error.message : "Unknown"}`
          });
          controller.close();
          return;
        }

        if (!text || text.trim().length < 100) {
          sendEvent("error", { error: "Файлът е празен или съдържа твърде малко текст" });
          controller.close();
          return;
        }

        // Truncate if too long
        const maxChars = 800000;
        if (text.length > maxChars) {
          text = text.substring(0, maxChars);
          sendEvent("progress", {
            message: `Текстът беше съкратен до ${maxChars.toLocaleString()} символа`,
            percent: 10
          });
        }

        sendEvent("progress", {
          message: `Анализиране на ${text.length.toLocaleString()} символа текст...`,
          percent: 15
        });

        let lastPercent = 15;

        // Run optimized analysis with progress callbacks
        const analysis = await analyzeBookOptimized(text, (progressMessage) => {
          // Map progress messages to percentages
          if (progressMessage.includes("Splitting")) {
            lastPercent = 20;
          } else if (progressMessage.includes("Split into")) {
            lastPercent = 25;
          } else if (progressMessage.includes("Processing batch")) {
            const match = progressMessage.match(/batch (\d+)\/(\d+)/);
            if (match) {
              const current = parseInt(match[1]);
              const total = parseInt(match[2]);
              lastPercent = 25 + Math.floor((current / total) * 60); // 25-85%
            }
          } else if (progressMessage.includes("Analyzing chunk")) {
            lastPercent = Math.min(lastPercent + 5, 80);
          } else if (progressMessage.includes("Merging")) {
            lastPercent = 85;
          } else if (progressMessage.includes("style")) {
            lastPercent = 90;
          } else if (progressMessage.includes("complete")) {
            lastPercent = 100;
          }

          sendEvent("progress", { message: progressMessage, percent: lastPercent });
        });

        sendEvent("progress", { message: "Завършване...", percent: 98 });

        // Send final result
        sendEvent("complete", {
          success: true,
          analysis,
          originalTextLength: text.length,
        });

        controller.close();
      } catch (error) {
        console.error("Streaming import error:", error);
        sendEvent("error", {
          error: "Грешка при импортиране на книгата. Моля, опитайте отново."
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
