import { NextResponse } from 'next/server';

const OWNER = process.env.GITHUB_OWNER?.trim();
const REPO = process.env.GITHUB_REPO?.trim();
const TOKEN = process.env.GITHUB_TOKEN?.trim();
const ADMIN_PIN = process.env.ADMIN_PIN?.trim();
const FILE_PATH = 'data/products.json';

function getGitHubUrl() {
  return `https://github.com{OWNER}/${REPO}/contents/${FILE_PATH}`;
}

async function getFileFromGitHub() {
  if (!OWNER || !REPO || !TOKEN) {
    throw new Error('Не заданы GITHUB_OWNER, GITHUB_REPO или GITHUB_TOKEN в Vercel');
  }

  const res = await fetch(getGitHubUrl(), {
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
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub GET (${res.status}): ${err.message || 'Ошибка чтения файла'}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8').trim();
  return {
    products: content ? JSON.parse(content) : [],
    sha: data.sha,
  };
}

async function updateFileInGitHub(products: unknown[], sha: string | undefined, message: string) {
  const contentBase64 = Buffer.from(JSON.stringify(products, null, 2), 'utf-8').toString('base64');

  const res = await fetch(getGitHubUrl(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Jamido-PWA-App',
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub PUT (${res.status}): ${err.message || 'Ошибка записи коммита'}`);
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
        { error: 'Переменная ADMIN_PIN не найдена на сервере Vercel! Проверьте Settings -> Environment Variables и сделайте Redeploy.' },
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
