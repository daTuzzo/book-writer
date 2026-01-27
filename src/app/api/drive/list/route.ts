import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.accessToken) {
    return NextResponse.json({ error: "Не сте автентикирани" }, { status: 401 });
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

    // List files created by the app (Писател)
    const response = await drive.files.list({
      q: "name contains 'Писател' or mimeType='application/json'",
      fields: "files(id, name, mimeType, modifiedTime, size)",
      orderBy: "modifiedTime desc",
      pageSize: 50,
    });

    return NextResponse.json({
      files: response.data.files || [],
    });
  } catch (error) {
    console.error("Error listing Drive files:", error);
    return NextResponse.json(
      { error: "Грешка при извличане на файлове от Google Drive" },
      { status: 500 }
    );
  }
}
