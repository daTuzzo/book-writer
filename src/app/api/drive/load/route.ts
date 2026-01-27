import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: "Не сте автентикирани" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "Липсва fileId" }, { status: 400 });
  }

  try {
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

    // Get file metadata
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "id,name,mimeType",
    });

    const mimeType = fileMetadata.data.mimeType;

    if (mimeType === "application/vnd.google-apps.document") {
      // Export Google Doc as plain text
      const response = await drive.files.export({
        fileId,
        mimeType: "text/plain",
      });

      return NextResponse.json({
        content: response.data,
        fileName: fileMetadata.data.name,
        mimeType,
      });
    } else if (mimeType === "application/json") {
      // Download JSON file
      const response = await drive.files.get({
        fileId,
        alt: "media",
      });

      return NextResponse.json({
        content: response.data,
        fileName: fileMetadata.data.name,
        mimeType,
      });
    } else {
      return NextResponse.json(
        { error: "Неподдържан тип файл" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error loading from Drive:", error);
    return NextResponse.json(
      { error: "Грешка при зареждането от Google Drive" },
      { status: 500 }
    );
  }
}
