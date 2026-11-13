import React, { useState, useRef } from 'react';
import { ShoppingBag, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export type Category = 'Все' | 'Платья из льна' | 'Столовое белье' | 'Платки' | 'Шторы';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

export interface Product {
  id: string;
  title: string;
  category: Exclude<Category, 'Все'>;
  price: number;
  size: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  media?: MediaItem[];
}

interface ProductCardProps {
  item: Product;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function ProductCard({ item, isAdmin, onDelete }: ProductCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Собираем единый массив медиафайлов (поддерживает и новые галереи, и старые одиночные карточки)
  const mediaList: MediaItem[] =
    item.media && item.media.length > 0
      ? item.media
      : item.imageUrl
      ? [
          {
            url: item.imageUrl,
            type:
              item.mediaType === 'video' ||
              item.imageUrl.includes('/video/upload/') ||
              /\.(mp4|mov|webm|m4v)$/i.test(item.imageUrl)
                ? 'video'
                : 'image',
          },
        ]
      : [];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E6E1D8] shadow-sm flex flex-col group">
      <div className="relative aspect-[4/5] bg-[#F0ECE3]">
        {/* Горизонтальный свайп-контейнер */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {mediaList.map((media, idx) => (
            <div key={idx} className="w-full h-full shrink-0 snap-center">
              {media.type === 'video' ? (
                <video
                  src={media.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={media.url}
                  alt={`${item.title} — фото ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* Бейдж наличия */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#3E4A3F] text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none">
          В наличии • {item.size}
        </span>

        {/* Кнопка удаления для мастера */}
        {isAdmin && (
          <button
            onClick={() => onDelete(item.id)}
            className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-md active:scale-90 transition z-10"
            title="Снять с наличия"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* Стрелки навигации для ПК (если больше 1 файла) */}
        {mediaList.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button
                type="button"
                onClick={() => scrollToSlide(activeIndex - 1)}
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#2C332D] p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {activeIndex < mediaList.length - 1 && (
              <button
                type="button"
                onClick={() => scrollToSlide(activeIndex + 1)}
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#2C332D] p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronRight size={18} />
              </button>
            )}

            {/* Точки-индикаторы внизу */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
              {mediaList.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeIndex ? 'w-4 bg-white shadow-xs' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
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
