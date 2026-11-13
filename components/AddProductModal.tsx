import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Category, Product, MediaItem } from './ProductCard';
import { useMediaUpload } from './useMediaUpload';
import { MediaGalleryEditor } from './MediaGalleryEditor';

interface AddProductModalProps {
  isOpen: boolean;
  adminPin: string;
  editingProduct?: Product | null;
  onClose: () => void;
  onSuccess: (updatedList: Product[]) => void;
}

export function AddProductModal({
  isOpen,
  adminPin,
  editingProduct,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<Category, 'Все'>>('Платья из льна');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('M (46)');
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);

  const { selectedFiles, uploadProgress, addFiles, removeFile, resetFiles, uploadAll } = useMediaUpload();

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      setTitle(editingProduct.title);
      setCategory(editingProduct.category);
      setPrice(String(editingProduct.price));
      setSize(editingProduct.size);

      const initialMedia: MediaItem[] =
        editingProduct.media && editingProduct.media.length > 0
          ? editingProduct.media
          : editingProduct.imageUrl
          ? [{ url: editingProduct.imageUrl, type: editingProduct.mediaType || 'image' }]
          : [];
      setExistingMedia(initialMedia);
    } else {
      setTitle('');
      setCategory('Платья из льна');
      setPrice('');
      setSize('M (46)');
      setExistingMedia([]);
    }
    resetFiles();
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  const totalMediaCount = existingMedia.length + selectedFiles.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || totalMediaCount === 0) return;

    setIsSubmitting(true);
    let step = '1. Загрузка новых медиа';

    try {
      const newlyUploaded = selectedFiles.length > 0 ? await uploadAll() : [];
      const finalMedia = [...existingMedia, ...newlyUploaded];
      const firstMedia = finalMedia.at(0)!;

      step = '2. Сохранение в GitHub';
      const productPayload: Product = {
        id: editingProduct ? editingProduct.id : Date.now().toString(),
        title,
        category,
        price: Number(price),
        size,
        imageUrl: firstMedia.url,
        mediaType: firstMedia.type,
        media: finalMedia,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingProduct ? 'edit' : 'add',
          pin: adminPin,
          product: productPayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Ошибка GitHub API (${res.status}): ${err.error || 'Не удалось сохранить'}`);
      }

      const updatedList = await res.json();
      onSuccess(updatedList);
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
          <h3 className="text-lg font-semibold">
            {editingProduct ? 'Редактировать изделие' : 'Новая позиция в наличии'}
          </h3>
          <button onClick={() => !isSubmitting && onClose()} className="text-sm text-[#6B756C] px-2 py-1">
            Закрыть
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <MediaGalleryEditor
            existingMedia={existingMedia}
            selectedFiles={selectedFiles}
            onAddFiles={addFiles}
            onRemoveExisting={(idx) => setExistingMedia((prev) => prev.filter((_, i) => i !== idx))}
            onRemoveNew={removeFile}
          />

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
            disabled={isSubmitting || totalMediaCount === 0}
            className="w-full bg-[#3E4A3F] disabled:opacity-60 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 mt-2 shadow-md active:scale-98 transition"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} /> {uploadProgress || 'Сохраняем...'}
              </>
            ) : (
              <>
                <Check size={18} /> {editingProduct ? 'Сохранить изменения' : 'Опубликовать в каталог'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
