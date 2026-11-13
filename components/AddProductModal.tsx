import React, { useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { Category, Product } from './ProductCard';

interface AddProductModalProps {
  isOpen: boolean;
  adminPin: string;
  onClose: () => void;
  onSuccess: (updatedList: Product[]) => void;
}

export function AddProductModal({ isOpen, adminPin, onClose, onSuccess }: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<Category, 'Все'>>('Платья из льна');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('M (46)');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.item(0);
    if (selected) {
      setFile(selected);
      setIsVideo(selected.type.startsWith('video/'));
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !file) return;

    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум — 100 МБ.`);
      return;
    }

    setIsSubmitting(true);
    let step = '1. Прямая загрузка в Vercel Blob';
    try {
      const rawExt = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
      const cleanExt = rawExt.replace(/[^a-z0-9]/g, '') || (isVideo ? 'mp4' : 'jpg');
      const safeFileName = `jamido-${Date.now()}.${cleanExt}`;

      const newBlob = await upload(safeFileName, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        multipart: true,
      });

      step = '2. Сохранение в GitHub';
      const newItem: Product = {
        id: Date.now().toString(),
        title,
        category,
        price: Number(price),
        size,
        imageUrl: newBlob.url,
        mediaType: isVideo ? 'video' : 'image',
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', pin: adminPin, product: newItem }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Ошибка GitHub API (${res.status}): ${err.error || 'Не удалось сохранить'}`);
      }

      const updatedList = await res.json();
      onSuccess(updatedList);

      setTitle('');
      setPrice('');
      setFile(null);
      setPreviewUrl('');
      setIsVideo(false);
      onClose();
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : String(error);

      if (message.includes('retrieve the client token')) {
        try {
          const diagRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'blob.generate-client-token',
              payload: { pathname: 'test.jpg', multipart: false },
            }),
          });
          const diagData = await diagRes.json().catch(() => ({}));
          if (diagData.error) {
            message = diagData.error;
          }
        } catch {}
      }

      alert(`Сбой на этапе [${step}]: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF8F5] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Новая позиция в наличии</h3>
          <button
            onClick={() => !isSubmitting && onClose()}
            className="text-sm text-[#6B756C] px-2 py-1"
          >
            Закрыть
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block border-2 border-dashed border-[#C7C0B3] rounded-2xl p-4 text-center cursor-pointer bg-white hover:bg-[#F5F2EB] transition">
            {previewUrl ? (
              isVideo ? (
                <video
                  src={previewUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-48 w-full object-cover rounded-xl mx-auto"
                />
              ) : (
                <img src={previewUrl} alt="Превью" className="h-48 w-full object-cover rounded-xl mx-auto" />
              )
            ) : (
              <div className="py-6 flex flex-col items-center text-[#5C665D]">
                <Camera size={32} className="mb-2 text-[#5D6D5E]" />
                <span className="text-sm font-medium">Выбрать фото или видео (до 100 МБ)</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              required
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          <div>
            <label className="block text-xs font-medium mb-1">Название изделия</label>
            <input
              type="text"
              required
              placeholder="Например: Платье «Васильки»"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCD6CA] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<Category, 'Все'>)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#DCD6CA] text-sm"
              >
                <option value="Платья из льна">Платья из льна</option>
                <option value="Столовое белье">Столовое белье</option>
                <option value="Платки">Платки</option>
                <option value="Шторы">Шторы</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Цена (BYN)</label>
              <input
                type="number"
                required
                placeholder="300"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCD6CA] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Размер в наличии</label>
            <input
              type="text"
              required
              placeholder="M (46) или 150х200 см"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCD6CA] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#3E4A3F] disabled:opacity-60 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 mt-2 shadow-md active:scale-98 transition"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin" size={18} /> Загружаем...</>
            ) : (
              <><Check size={18} /> Опубликовать в каталог</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
