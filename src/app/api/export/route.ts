import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from "docx";
import type { Project } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { project, format } = await req.json() as { project: Project; format: string };

    if (!project || !project.name) {
      return NextResponse.json(
        { error: "Невалиден проект" },
        { status: 400 }
      );
    }

    const chapters = project.plan?.chapters || [];
    const filename = project.name.replace(/[^a-zA-Z0-9а-яА-Я\s]/g, "").trim() || "book";

    if (format === "docx") {
      // Create Word document
      const children: Paragraph[] = [];

      // Title page
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.name,
              bold: true,
              size: 56, // 28pt
            }),
          ],
          alignment: "center",
          spacing: { after: 400 },
        })
      );

      if (project.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.description,
                italics: true,
                size: 24,
              }),
            ],
            alignment: "center",
            spacing: { after: 800 },
          })
        );
      }

      // Page break after title
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );

      // Table of contents header
      if (chapters.length > 0) {
        children.push(
          new Paragraph({
            text: "Съдържание",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 },
          })
        );

        chapters.forEach((ch) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Глава ${ch.chapterNumber}: ${ch.title}`,
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        });

        children.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }

      // Chapters
      chapters.forEach((ch, index) => {
        // Chapter heading
        children.push(
          new Paragraph({
            text: `Глава ${ch.chapterNumber}: ${ch.title}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: index > 0 ? 400 : 0, after: 300 },
          })
        );

        // Chapter content - split by paragraphs
        const content = ch.content || "";
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

        paragraphs.forEach((para) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: para.trim(),
                  size: 24, // 12pt
                }),
              ],
              spacing: { after: 200 },
            })
          );
        });

        // Page break between chapters
        if (index < chapters.length - 1) {
          children.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const uint8Array = new Uint8Array(buffer);

      return new NextResponse(uint8Array, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.docx"`,
        },
      });
    }

    if (format === "md" || format === "markdown") {
      // Markdown export
      let md = `# ${project.name}\n\n`;

      if (project.description) {
        md += `*${project.description}*\n\n---\n\n`;
      }

      chapters.forEach((ch) => {
        md += `## Глава ${ch.chapterNumber}: ${ch.title}\n\n`;
        md += `${ch.content || ""}\n\n`;
      });

      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.md"`,
        },
      });
    }

    // Default: plain text
    let text = `${project.name}\n${"=".repeat(project.name.length)}\n\n`;

    if (project.description) {
      text += `${project.description}\n\n---\n\n`;
    }

    chapters.forEach((ch) => {
      text += `\nГлава ${ch.chapterNumber}: ${ch.title}\n`;
      text += `${"-".repeat(40)}\n\n`;
      text += `${ch.content || ""}\n\n`;
    });

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.txt"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Грешка при експортиране на книгата" },
      { status: 500 }
    );
  }
}
