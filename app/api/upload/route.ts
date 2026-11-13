import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Токен BLOB_READ_WRITE_TOKEN не найден на сервере.' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/x-m4v',
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // Лимит до 100 МБ
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Ошибка генерации токена Blob: ${message}` },
      { status: 400 }
    );
  }
}
