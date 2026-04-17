import { useState, useEffect } from "react";
import { photoDB } from "@/lib/db";
import type { Photo } from "@/types";

const API_URL = "https://jsonplaceholder.typicode.com/photos";

export default function Home() {
  const [fotosuratlar, setFotosuratlar] = useState<Photo[]>([]);
  const [sevimliylar, setSevimliylar] = useState<Set<number>>(new Set());
  const [qidiruv, setQidiruv] = useState("");
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [syncNatija, setSyncNatija] = useState<string | null>(null);

  useEffect(() => {
    ishgaTushir();
  }, []);

  // ─── 1. ISHGA TUSHIRISH ──────────────────────────────────────────────────

  async function ishgaTushir() {
    await photoDB.init(); // DB ni ochish

    if (await photoDB.hasPhotos()) {
      await dbdanOl(); // DB da ma'lumot bor → DB dan o'qi
    } else {
      await apidanYukla(); // DB bo'sh → API dan yukla va DB ga saqlash
    }

    const ids = await photoDB.getFavoriteIds();
    setSevimliylar(ids);

    setYuklanmoqda(false);
  }

  // ─── 2. API DAN YUKLASH VA DB GA SAQLASH ────────────────────────────────

  async function apidanYukla() {
    const javob = await fetch(API_URL);
    const data: Photo[] = await javob.json();
    await photoDB.savePhotos(data); // IndexedDB ga yozish
    await dbdanOl();
  }

  // ─── 3. DB DAN BARCHA MA'LUMOTNI OLISH ──────────────────────────────────

  async function dbdanOl() {
    const photos = await photoDB.getAllPhotos(); // IndexedDB dan o'qish
    setFotosuratlar(photos);
  }

  // ─── 4. QIDIRUV ──────────────────────────────────────────────────────────

  async function qidirish(soq: string) {
    setQidiruv(soq);
    if (!soq.trim()) {
      await dbdanOl(); // bo'sh → hammasini ko'rsat
      return;
    }
    const natijalar = await photoDB.searchByTitle(soq);
    setFotosuratlar(natijalar);
  }

  // ─── 5. SEVIMLIGA QO'SHISH / OLIB TASHLASH ──────────────────────────────

  async function sevimliyToggle(fotoId: number) {
    if (sevimliylar.has(fotoId)) {
      await photoDB.removeFavorite(fotoId);
      setSevimliylar(prev => {
        const yangi = new Set(prev);
        yangi.delete(fotoId);
        return yangi;
      });
    } else {
      await photoDB.addFavorite(fotoId);
      setSevimliylar(prev => new Set(Array.from(prev).concat(fotoId)));
    }
  }

  // ─── 6. FOTOSURATNI O'CHIRISH ────────────────────────────────────────────

  async function fotoOchirish(id: number) {
    await photoDB.deletePhoto(id);
    setFotosuratlar(prev => prev.filter(p => p.id !== id));
  }

  // ─── 7. BARCHA DB NI O'CHIRISH ───────────────────────────────────────────

  async function hammasiniOchirish() {
    if (!confirm("Barcha ma'lumotlarni o'chirishni tasdiqlaysizmi?")) return;
    await photoDB.deleteDatabase();
    window.location.reload();
  }

  // ─── 8. BACKEND BILAN SYNC ───────────────────────────────────────────────
  // Bu yerda backend dan yangi ma'lumotlar olib, DB ni 3 xil usulda yangilash
  // ko'rsatilgan. Real loyihada faqat bittasini tanlaysiz.

  async function deltaSync() {
    setSyncNatija("Yuklanmoqda...");
    const javob = await fetch(API_URL);
    const backendData: Photo[] = await javob.json();

    // Delta sync: qo'shilgan / yangilangan / o'chirilganlarni aniqlaydi
    const natija = await photoDB.deltaSync(backendData);
    await dbdanOl();

    setSyncNatija(
      `✅ Delta sync: +${natija.qoshildi} qo'shildi, ` +
      `~${natija.yangilandi} yangilandi, ` +
      `-${natija.ochirildi} o'chirildi`
    );
  }

  async function upsertSync() {
    setSyncNatija("Yuklanmoqda...");
    const javob = await fetch(API_URL);
    const backendData: Photo[] = await javob.json();

    // Upsert sync: put() orqali qo'shadi/yangilaydi, o'chirilganlarni hisoblamaydi
    await photoDB.upsertSync(backendData);
    await dbdanOl();

    setSyncNatija(`✅ Upsert sync: ${backendData.length} ta yozuv put() bilan saqlandi`);
  }

  async function fullSync() {
    setSyncNatija("Yuklanmoqda...");
    const javob = await fetch(API_URL);
    const backendData: Photo[] = await javob.json();

    // Full sync: hammasi o'chib, qaytadan yoziladi
    await photoDB.fullSync(backendData);
    await dbdanOl();

    setSyncNatija(`✅ Full sync: DB tozalanib, ${backendData.length} ta yozuv qaytadan yozildi`);
  }

  // ─── UI ──────────────────────────────────────────────────────────────────

  if (yuklanmoqda) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📸 Photo Manager</h1>
              <p className="text-sm text-gray-500">
                IndexedDB • {fotosuratlar.length} ta fotosurat
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button
                onClick={deltaSync}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Delta Sync
              </button>
              <button
                onClick={upsertSync}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Upsert Sync
              </button>
              <button
                onClick={fullSync}
                className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Full Sync
              </button>
              <button
                onClick={hammasiniOchirish}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                DB ni o'chirish
              </button>
            </div>
          </div>

          {syncNatija && (
            <p className="text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded">
              {syncNatija}
            </p>
          )}

          <input
            type="text"
            placeholder="🔍 Nomi bo'yicha qidirish..."
            value={qidiruv}
            onChange={e => qidirish(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Fotosuratlar */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotosuratlar.map(foto => (
            <div
              key={foto.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-3 space-y-2">
                <p className="text-xs text-gray-600 line-clamp-2">
                  {foto.title}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => sevimliyToggle(foto.id)}
                    className={`flex-1 py-1 text-xs rounded transition ${
                      sevimliylar.has(foto.id)
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {sevimliylar.has(foto.id) ? "❤️ Sevimli" : "🤍 Qo'shish"}
                  </button>
                  <button
                    onClick={() => fotoOchirish(foto.id)}
                    className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
