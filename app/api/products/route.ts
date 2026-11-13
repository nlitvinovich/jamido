import { NextResponse } from 'next/server';

const OWNER = process.env.GITHUB_OWNER?.trim();
const REPO = process.env.GITHUB_REPO?.trim();
const TOKEN = process.env.GITHUB_TOKEN?.trim();
const ADMIN_PIN = process.env.ADMIN_PIN?.trim();

function getGitHubUrl() {
  return [
    'https://github.com',
    'repos',
    OWNER,
    REPO,
    'contents',
    'data',
    'products.json',
  ].join('/');
}

async function getFileFromGitHub() {
  if (!OWNER || !REPO || !TOKEN) {
    throw new Error('Не заданы GITHUB_OWNER, GITHUB_REPO или GITHUB_TOKEN в Vercel');
  }

  const url = `${getGitHubUrl()}?ref=main&t=${Date.now()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Jamido-PWA-App',
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return { products: [], sha: undefined };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.content || !data.sha) {
    return { products: [], sha: data.sha };
  }

  const content = Buffer.from(data.content, 'base64').toString('utf-8').trim();
  return {
    products: content ? JSON.parse(content) : [],
    sha: data.sha,
  };
}

async function updateFileInGitHub(products: unknown[], sha: string | undefined, message: string) {
  const contentBase64 = Buffer.from(JSON.stringify(products, null, 2), 'utf-8').toString('base64');

  const payload: Record<string, unknown> = {
    message,
    content: contentBase64,
    branch: 'main',
  };

  if (sha) {
    payload.sha = sha;
  }

  const res = await fetch(getGitHubUrl(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Jamido-PWA-App',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT (${res.status}): ${text}`);
  }
}

export async function GET() {
  try {
    const { products } = await getFileFromGitHub();
    return NextResponse.json(products);
  } catch (error) {
    const err = error as { message?: string; cause?: { code?: string; message?: string } };
    const details = err?.cause?.code || err?.cause?.message || err?.message || 'Ошибка загрузки';
    return NextResponse.json({ error: details }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, pin, product, id } = body;
    const cleanInputPin = String(pin || '').trim();

    if (!ADMIN_PIN) {
      return NextResponse.json(
        { error: 'Переменная ADMIN_PIN не найдена на сервере Vercel!' },
        { status: 500 }
      );
    }

    if (cleanInputPin !== ADMIN_PIN) {
      return NextResponse.json(
        { error: `Неверный PIN-код (на сервере ожидается пароль длиной ${ADMIN_PIN.length} симв.)` },
        { status: 401 }
      );
    }

    if (action === 'verify') {
      return NextResponse.json({ ok: true });
    }

    const { products, sha } = await getFileFromGitHub();

    if (action === 'add') {
      const updatedProducts = [product, ...products];
      await updateFileInGitHub(updatedProducts, sha, `Добавлено изделие: ${product.title}`);
      return NextResponse.json(updatedProducts);
    }

    if (action === 'delete') {
      const updatedProducts = products.filter((item: { id: string }) => item.id !== id);
      await updateFileInGitHub(updatedProducts, sha, `Удалено изделие (ID: ${id})`);
      return NextResponse.json(updatedProducts);
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (error) {
    const err = error as { message?: string; cause?: { code?: string; message?: string } };
    const details = err?.cause?.code || err?.cause?.message || err?.message || 'Ошибка обновления';
    return NextResponse.json({ error: details }, { status: 500 });
  }
}
