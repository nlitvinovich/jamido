import { NextResponse } from 'next/server';

const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;
const TOKEN = process.env.GITHUB_TOKEN!;
const ADMIN_PIN = process.env.ADMIN_PIN!;
const FILE_PATH = 'data/products.json';

const GITHUB_API_URL = `https://github.com{OWNER}/${REPO}/contents/${FILE_PATH}`;

// Вспомогательная функция для получения текущего файла и его SHA из GitHub
async function getFileFromGitHub() {
  const res = await fetch(GITHUB_API_URL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Не удалось получить файл из GitHub');
  }

  const data = await res.json();
  // Декодируем Base64 с поддержкой кириллицы (UTF-8)
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return {
    products: JSON.parse(content),
    sha: data.sha,
  };
}

// Вспомогательная функция для сохранения обновленного JSON в GitHub
async function updateFileInGitHub(products: any[], sha: string, message: string) {
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
      sha,
    }),
  });

  if (!res.ok) {
    throw new Error('Ошибка при записи коммита в GitHub');
  }
}

// GET: Получить актуальный список товаров
export async function GET() {
  try {
    const { products } = await getFileFromGitHub();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка загрузки каталога' }, { status: 500 });
  }
}

// POST: Добавить новинку или удалить товар
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, pin, product, id } = body;

    // Проверка PIN-кода мастера
    if (pin !== ADMIN_PIN) {
      return NextResponse.json({ error: 'Неверный PIN-код мастера' }, { status: 401 });
    }

    const { products, sha } = await getFileFromGitHub();

    if (action === 'add') {
      const updatedProducts = [product, ...products];
      await updateFileInGitHub(updatedProducts, sha, `Добавлено изделие: ${product.title}`);
      return NextResponse.json(updatedProducts);
    }

    if (action === 'delete') {
      const updatedProducts = products.filter((item: any) => item.id !== id);
      await updateFileInGitHub(updatedProducts, sha, `Удалено изделие (ID: ${id})`);
      return NextResponse.json(updatedProducts);
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка обновления каталога' }, { status: 500 });
  }
}
