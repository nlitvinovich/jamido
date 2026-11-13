import { NextResponse } from 'next/server';

const OWNER = process.env.GITHUB_OWNER?.trim();
const REPO = process.env.GITHUB_REPO?.trim();
const TOKEN = process.env.GITHUB_TOKEN?.trim();
const ADMIN_PIN = process.env.ADMIN_PIN?.trim();
const FILE_PATH = 'data/products.json';

const GITHUB_API_URL = `https://github.com{OWNER}/${REPO}/contents/${FILE_PATH}`;

async function getFileFromGitHub() {
  if (!OWNER || !REPO || !TOKEN) {
    throw new Error('Не заданы GITHUB_OWNER, GITHUB_REPO или GITHUB_TOKEN в Vercel');
  }

  const res = await fetch(GITHUB_API_URL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
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

  const res = await fetch(GITHUB_API_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
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
    const message = error instanceof Error ? error.message : 'Ошибка загрузки каталога';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, pin, product, id } = body;

    if (!ADMIN_PIN || pin !== ADMIN_PIN) {
      return NextResponse.json({ error: 'Неверный PIN-код мастера' }, { status: 401 });
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
    const message = error instanceof Error ? error.message : 'Ошибка обновления каталога';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
