import React from 'react';
import { ShoppingBag, Trash2 } from 'lucide-react';

export type Category = 'Все' | 'Платья из льна' | 'Столовое белье' | 'Платки' | 'Шторы';

export interface Product {
  id: string;
  title: string;
  category: Exclude<Category, 'Все'>;
  price: number;
  size: string;
  imageUrl: string;
}

interface ProductCardProps {
  item: Product;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function ProductCard({ item, isAdmin, onDelete }: ProductCardProps) {
  // Оптимизация ссылки Cloudinary на лету (WebP + ширина 800px)
  const getOptimizedImage = (url: string) => {
    if (!url.includes('://cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E6E1D8] shadow-sm flex flex-col">
      <div className="relative aspect-[4/5] bg-[#F0ECE3]">
        <img
          src={getOptimizedImage(item.imageUrl)}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#3E4A3F] text-xs font-medium px-2.5 py-1 rounded-full">
          В наличии • {item.size}
        </span>

        {isAdmin && (
          <button
            onClick={() => onDelete(item.id)}
            className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-md active:scale-90 transition"
            title="Снять с наличия"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-[#7D877E] mb-1">{item.category}</p>
          <h2 className="text-base font-medium leading-snug">{item.title}</h2>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F0ECE3] flex items-center justify-between">
          <span className="text-lg font-semibold">{item.price.toFixed(2)} Br</span>
          <a
            href={`https://t.me! Хочу забрать из наличия: ${item.title} (${item.size})`}
            target="_blank"
            rel="noreferrer"
            className="bg-[#3E4A3F] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 active:scale-95 transition"
          >
            <ShoppingBag size={15} />
            Забрать
          </a>
        </div>
      </div>
    </div>
  );
}
