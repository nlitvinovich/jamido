'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Lock, Unlock, Loader2 } from 'lucide-react';
import { Category, Product, ProductCard } from '../components/ProductCard';
import { AddProductModal } from '../components/AddProductModal';

export default function JamidoApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Все');

  const [adminPin, setAdminPin] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const categories: Category[] = ['Все', 'Платья из льна', 'Столовое белье', 'Платки', 'Шторы'];

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!adminPin || !confirm('Снять изделие с наличия?')) return;

    const previous = [...products];
    setProducts(products.filter((item) => item.id !== id));

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', pin: adminPin, id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Ошибка удаления');
      setProducts(previous);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pinInput.trim();
    if (!enteredPin) return;

    setIsVerifyingPin(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin: enteredPin }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'Неверный PIN-код');
        return;
      }

      setAdminPin(enteredPin);
      setPinInput('');
      setIsPinModalOpen(false);
    } catch {
      alert('Ошибка связи с сервером при проверке пароля');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const filteredProducts =
    selectedCategory === 'Все'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C332D] pb-20">
      <header className="sticky top-0 z-20 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6E1D8] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-[0.25em] font-semibold uppercase">JAMIDO</h1>
          <p className="text-[11px] text-[#6B756C]">Изделия в наличии • Минск</p>
        </div>

        <button
          onClick={() => (adminPin ? setAdminPin(null) : setIsPinModalOpen(true))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            adminPin ? 'bg-[#3E4A3F] text-white' : 'bg-[#EBE6DD] text-[#5C665D]'
          }`}
        >
          {adminPin ? <Unlock size={14} /> : <Lock size={14} />}
          {adminPin ? 'Выйти' : 'Мастеру'}
        </button>
      </header>

      {adminPin && (
        <div className="bg-[#3E4A3F] text-white px-4 py-3 flex items-center justify-between">
          <span className="text-sm">Режим редактирования каталога</span>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white text-[#3E4A3F] px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 shadow-sm active:scale-95 transition"
          >
            <Plus size={16} /> Добавить
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm transition ${
              selectedCategory === cat
                ? 'bg-[#5D6D5E] text-white font-medium'
                : 'bg-white text-[#5C665D] border border-[#E6E1D8]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-[#5D6D5E]">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 px-4 text-[#6B756C]">
          <p className="text-base mb-1">В этой категории пока нет готовых изделий</p>
          <p className="text-xs">Вы можете заказать пошив по индивидуальным меркам на jamido.by</p>
        </div>
      ) : (
        <main className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-1">
          {filteredProducts.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              isAdmin={Boolean(adminPin)}
              onDelete={handleDelete}
            />
          ))}
        </main>
      )}

      <footer className="mt-10 px-4 text-center text-xs text-[#6B756C] space-y-1">
        <p className="flex items-center justify-center gap-1 font-medium text-[#3E4A3F]">
          <MapPin size={14} /> Минск, ул. Кальварийская 21 к4 (Пн-Пт 12:00–19:00)
        </p>
        <p>Мастерская Анастасии Яминской • Натуральный лен</p>
      </footer>

      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handlePinSubmit} className="bg-[#FAF8F5] w-full max-w-xs rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-center">Вход для мастера</h3>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Введите PIN-код"
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCD6CA] text-center text-lg tracking-widest"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isVerifyingPin}
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#6B756C] bg-[#EBE6DD]"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isVerifyingPin}
                className="flex-1 py-2.5 rounded-xl text-sm text-white bg-[#3E4A3F] font-medium flex items-center justify-center gap-1"
              >
                {isVerifyingPin ? <Loader2 className="animate-spin" size={16} /> : 'Войти'}
              </button>
            </div>
          </form>
        </div>
      )}

      {adminPin && (
        <AddProductModal
          isOpen={isAddModalOpen}
          adminPin={adminPin}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(updatedList) => setProducts(updatedList)}
        />
      )}
    </div>
  );
}
