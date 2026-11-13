import React from 'react';
import { Camera, X, Plus } from 'lucide-react';
import { MediaItem } from './ProductCard';
import { SelectedMedia } from './useMediaUpload';

interface MediaGalleryEditorProps {
  existingMedia: MediaItem[];
  selectedFiles: SelectedMedia[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
}

export function MediaGalleryEditor({
  existingMedia,
  selectedFiles,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}: MediaGalleryEditorProps) {
  const totalCount = existingMedia.length + selectedFiles.length;

  if (totalCount === 0) {
    return (
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
            onAddFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>
    );
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
      {existingMedia.map((item, idx) => (
        <div
          key={`old-${idx}`}
          className="relative w-24 h-32 shrink-0 rounded-xl overflow-hidden border border-[#DCD6CA] bg-white"
        >
          {item.type === 'video' ? (
            <video src={item.url} muted playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={item.url} alt="" className="w-full h-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onRemoveExisting(idx)}
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

      {selectedFiles.map((item, idx) => (
        <div
          key={`new-${idx}`}
          className="relative w-24 h-32 shrink-0 rounded-xl overflow-hidden border border-[#DCD6CA] bg-white"
        >
          {item.isVideo ? (
            <video src={item.previewUrl} muted playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onRemoveNew(idx)}
            className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
          >
            <X size={12} />
          </button>
          {existingMedia.length === 0 && idx === 0 && (
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
            onAddFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>
    </div>
  );
}
