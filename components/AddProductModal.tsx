import React, { useState } from 'react';
import { Camera, Check, Loader2, X, Plus } from 'lucide-react';
import { Category, Product } from './ProductCard';
import { useMediaUpload } from './useMediaUpload';

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

  const { selectedFiles, uploadProgress, addFiles, removeFile, resetFiles, uploadAll } = useMediaUpload();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || selectedFiles.length === 0) return;

    setIsSubmitting(true);
    let step = '1. Загрузка медиа';

    try {
      const uploadedMedia = await uploadAll();
      const firstMedia = uploadedMedia.at(0)!;

      step = '2. Сохранение в GitHub';
      const newItem: Product = {
        id: Date.now().toString(),
        title,
        category,
        price: Number(price),
        size,
        imageUrl: firstMedia.url,
        mediaType: firstMedia.type,
        media: uploadedMedia,
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
      resetFiles();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
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
          <button onClick={() => !isSubmitting && onClose()} className="text-sm text-[#6B756C] px-2 py-1">
            Закрыть
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedFiles.length === 0 ? (
            <label className="block border-2 border-dashed border-[#C7C0B3] rounded-2xl p-4 text-center cursor-pointer bg-white hover:bg-[#F5F2EB] transition">
              <div className="py-6 flex flex-col items-center text-[#5C665D]">
                <Camera size={32} className="mb-2 text-[#5D6D5E]" />
                <span className="text-sm font-medium">Выбрать фото или видео (можно несколько)</span>
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {selectedFiles.map((item, idx) => (
                <div key={idx} className="relative w-24 h-32 shrink-0 rounded-xl overflow-hidden border border-[#DCD6CA] bg-white">
                  {item.isVideo ? (
                    <video src={item.previewUrl} muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
                  >
                    <X size={12} />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-white/90 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      Обложка
                    </span>
                  )}
                </div>
              ))}

              <label className="w-24 h-32 shrink-0 rounded-xl border-2 border-dashed border-[#C7C0B3] bg-white flex flex-col items-center justify-center text-[#5C665D] cursor-pointer hover:bg-[#F5F2EB] transition">
                <Plus size={22} />
                <span className="text-[11px] mt-1">Еще</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}

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
            disabled={isSubmitting || selectedFiles.length === 0}
            className="w-full bg-[#3E4A3F] disabled:opacity-60 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 mt-2 shadow-md active:scale-98 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} /> {uploadProgress || 'Загружаем...'}
              </>
            ) : (
              <>
                <Check size={18} /> Опубликовать в каталог
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
