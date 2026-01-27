import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: "Не сте автентикирани" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, projectName, content, fileId, format = "docs" } = body;

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      access_token: token.accessToken as string,
      refresh_token: token.refreshToken as string,
      expiry_date: token.expiresAt ? (token.expiresAt as number) * 1000 : undefined,
    });

    const drive = google.drive({ version: "v3", auth });
    const docs = google.docs({ version: "v1", auth });

    let savedFileId = fileId;

    if (format === "docs") {
      if (fileId) {
        // Update existing Google Doc
        await docs.documents.batchUpdate({
          documentId: fileId,
          requestBody: {
            requests: [
              {
                deleteContentRange: {
                  range: {
                    startIndex: 1,
                    endIndex: 999999,
                  },
                },
              },
              {
                insertText: {
                  location: { index: 1 },
                  text: content,
                },
              },
            ],
          },
        });
      } else {
        // Create new Google Doc
        const docResponse = await docs.documents.create({
          requestBody: {
            title: `${projectName} - Писател`,
          },
        });

        savedFileId = docResponse.data.documentId;

        // Insert content
        if (content) {
          await docs.documents.batchUpdate({
            documentId: savedFileId!,
            requestBody: {
              requests: [
                {
                  insertText: {
                    location: { index: 1 },
                    text: content,
                  },
                },
              ],
            },
          });
        }
      }
    } else {
      // Save as JSON backup
      const fileName = `${projectName}_backup_${new Date().toISOString().split("T")[0]}.json`;
      
      if (fileId) {
        // Update existing file
        await drive.files.update({
          fileId,
          media: {
            mimeType: "application/json",
            body: JSON.stringify(body.projectData, null, 2),
          },
        });
        savedFileId = fileId;
      } else {
        // Create new file
        const response = await drive.files.create({
          requestBody: {
            name: fileName,
            mimeType: "application/json",
          },
          media: {
            mimeType: "application/json",
            body: JSON.stringify(body.projectData, null, 2),
          },
        });
        savedFileId = response.data.id;
      }
    }

    return NextResponse.json({
      success: true,
      fileId: savedFileId,
      message: "Проектът е запазен успешно",
    });
  } catch (error) {
    console.error("Error saving to Drive:", error);
    return NextResponse.json(
      { error: "Грешка при запазването в Google Drive" },
      { status: 500 }
    );
  }
}
