import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не получен сервером' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: 'Не заданы ключи Cloudinary в Vercel' }, { status: 500 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;

    const body = new URLSearchParams();
    body.append('file', base64Data);
    body.append('upload_preset', uploadPreset);

    const res = await fetch(`https://cloudinary.com{cloudName}/auto/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'JamidoApp/1.0',
      },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: `Cloudinary (${cloudName}): ${data?.error?.message || res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (error: unknown) {
    const err = error as { message?: string; cause?: { code?: string; message?: string } };
    const details = err?.cause?.code || err?.cause?.message || err?.message || 'Неизвестный сбой';
    return NextResponse.json(
      { error: `${details} (Cloud: ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME})` },
      { status: 500 }
    );
  }
}
