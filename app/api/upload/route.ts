import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Токен BLOB_READ_WRITE_TOKEN не найден на сервере. Проверьте Settings -> Environment Variables и сделайте Redeploy.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не передан на сервер' }, { status: 400 });
    }

    // Безопасное имя файла без кириллицы и пробелов
    const ext = file.name.split('.').pop() || 'jpg';
    const safeFileName = `jamido-${Date.now()}.${ext}`;

    const blob = await put(safeFileName, file, {
      access: 'public',
      token,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Ошибка Blob: ${message}` }, { status: 500 });
  }
}
