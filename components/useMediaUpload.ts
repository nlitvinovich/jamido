import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { MediaItem } from './ProductCard';

export interface SelectedMedia {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

export function useMediaUpload() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedMedia[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newItems: SelectedMedia[] = [];
    const maxSizeBytes = 100 * 1024 * 1024;

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList.item(i);
      if (!f) continue;

      if (f.size > maxSizeBytes) {
        alert(`Файл «${f.name}» больше 100 МБ и был пропущен.`);
        continue;
      }

      newItems.push({
        file: f,
        previewUrl: URL.createObjectURL(f),
        isVideo: f.type.startsWith('video/'),
      });
    }

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetFiles = () => {
    setSelectedFiles([]);
    setUploadProgress('');
  };

  const uploadAll = async (): Promise<MediaItem[]> => {
    const uploadedMedia: MediaItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      setUploadProgress(`Загрузка ${i + 1} из ${selectedFiles.length}...`);

      const rawExt = item.file.name.split('.').pop()?.toLowerCase() || (item.isVideo ? 'mp4' : 'jpg');
      const cleanExt = rawExt.replace(/[^a-z0-9]/g, '') || (item.isVideo ? 'mp4' : 'jpg');
      const safeFileName = `jamido-${Date.now()}-${i}.${cleanExt}`;

      const blob = await upload(safeFileName, item.file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        multipart: true,
      });

      uploadedMedia.push({
        url: blob.url,
        type: item.isVideo ? 'video' : 'image',
      });
    }

    return uploadedMedia;
  };

  return { selectedFiles, uploadProgress, addFiles, removeFile, resetFiles, uploadAll };
}
