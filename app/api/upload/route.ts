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

    // Пересылаем файл с сервера Vercel напрямую в Cloudinary
    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('upload_preset', uploadPreset);

    const res = await fetch(`https://cloudinary.com{cloudName}/auto/upload`, {
      method: 'POST',
      body: cloudinaryForm,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || `Ошибка Cloudinary (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Сбой при загрузке на сервер';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
