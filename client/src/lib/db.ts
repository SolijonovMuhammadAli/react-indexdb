/**
 * ============================================================
 * IndexedDB QATLAMI — db.ts
 * ============================================================
 *
 * Bu fayl IndexedDB bilan ishlash uchun class yordamida
 * yozilgan. idb kutubxonasi ishlatilgan.
 *
 * Jadvallar:
 *   "photos"    → id (keyPath), title (index)
 *   "favorites" → id (autoIncrement), photoId (index)
 *
 * Ishlatish:
 *   import { photoDB } from "@/lib/db";
 *   await photoDB.init();
 *   await photoDB.getAllPhotos();
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Photo, Favorite } from "@/types";

// ─── Sxema ──────────────────────────────────────────────────

interface PhotosDB extends DBSchema {
  photos: {
    key: number;
    value: Photo;
    indexes: { "by-title": string };
  };
  favorites: {
    key: number;
    value: Favorite;
    indexes: { "by-photoId": number };
  };
}

// ─── Class ──────────────────────────────────────────────────

class PhotoDatabase {
  private db: IDBPDatabase<PhotosDB> | null = null;
  private readonly DB_NAME = "photos-db";
  private readonly DB_VERSION = 1;

  // ── DB ni ochish ────────────────────────────────────────
  // initializatsiya qilish — faqat birinchi marta openDB chaqiriladi

  async init() {
    if (this.db) return; // allaqachon ochilgan

    this.db = await openDB<PhotosDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // "photos" jadvali va index
        if (!db.objectStoreNames.contains("photos")) {
          const store = db.createObjectStore("photos", { keyPath: "id" });
          store.createIndex("by-title", "title");
        }

        // "favorites" jadvali va index
        if (!db.objectStoreNames.contains("favorites")) {
          const store = db.createObjectStore("favorites", {
            keyPath: "id",
            autoIncrement: true, // id ni IndexedDB o'zi beradi
          });
          store.createIndex("by-photoId", "photoId");
        }
      },
    });
  }

  // Barcha metodlar DB ni shu orqali oladi
  private async getDB() {
    if (!this.db) await this.init();
    return this.db!;
  }

  // ── Fotosuratlar ────────────────────────────────────────

  /** DB da fotosuratlar bormi? */
  async hasPhotos(): Promise<boolean> {
    const db = await this.getDB();
    return (await db.count("photos")) > 0;
  }

  /** Fotosuratlarni DB ga saqlash (API dan kelgan) */
  async savePhotos(photos: Photo[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction("photos", "readwrite");
    for (const photo of photos) {
      await tx.store.put(photo); // put = qo'shish yoki yangilash
    }
    await tx.done;
  }

  /** Barcha fotosuratlarni olish */
  async getAllPhotos(): Promise<Photo[]> {
    const db = await this.getDB();
    return db.getAll("photos");
  }

  /** Nomi bo'yicha qidiruv */
  async searchByTitle(query: string): Promise<Photo[]> {
    const db = await this.getDB();
    const all = await db.getAll("photos");
    return all.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  }

  /** Fotosuratni o'chirish */
  async deletePhoto(id: number): Promise<void> {
    const db = await this.getDB();
    await db.delete("photos", id);
  }

  // ── Sevimliylar ─────────────────────────────────────────

  /** Fotosuratni sevimliga qo'shish */
  async addFavorite(photoId: number): Promise<void> {
    const db = await this.getDB();
    // id ko'rsatilmaydi — autoIncrement o'zi beradi
    const yozuv = { photoId, addedAt: Date.now() } as Favorite;
    await db.add("favorites", yozuv);
  }

  /** Fotosuratni sevimlilikdan olib tashlash */
  async removeFavorite(photoId: number): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction("favorites", "readwrite");
    const index = tx.store.index("by-photoId");
    const sevimli = await index.get(photoId); // photoId orqali topish
    if (sevimli) {
      await tx.store.delete(sevimli.id);
    }
    await tx.done;
  }

  /** Barcha sevimli fotosuratlarning ID larini Set shaklida olish */
  async getFavoriteIds(): Promise<Set<number>> {
    const db = await this.getDB();
    const sevimliylar = await db.getAll("favorites");
    return new Set(sevimliylar.map(s => s.photoId));
  }

  // ── Sync strategiyalari ─────────────────────────────────

  /**
   * 1. FULL SYNC — To'liq yangilash
   *
   * Jadvalni to'liq tozalab, backend dan kelgan yangi
   * ma'lumotlarni qaytadan yozadi.
   *
   * ✅ Oddiy va ishonchli
   * ❌ Katta data bo'lsa sekin (hammasi o'chadi/yoziladi)
   */
  async fullSync(photos: Photo[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction("photos", "readwrite");
    await tx.store.clear();            // barchasini o'chirish
    for (const photo of photos) {
      await tx.store.put(photo);       // hammani qaytadan yozish
    }
    await tx.done;
  }

  /**
   * 2. UPSERT SYNC — Qo'shish yoki yangilash (o'chirishsiz)
   *
   * put() metodi: ID mavjud bo'lsa — yangilaydi,
   *               ID yo'q bo'lsa  — yangi qo'shadi.
   *
   * ✅ Tez (faqat o'zgarganlar qayta yoziladi)
   * ❌ Backend dan o'chirilgan ma'lumotlar DB da qoladi
   */
  async upsertSync(photos: Photo[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction("photos", "readwrite");
    for (const photo of photos) {
      await tx.store.put(photo);       // put = add + update birga
    }
    await tx.done;
  }

  /**
   * 3. DELTA SYNC — Faqat farqni yangilash
   *
   * Backend va DB ni solishtiradi:
   *   - Yangi qo'shilganlar → DB ga yoziladi
   *   - O'zgarganlar       → DB da yangilanadi
   *   - O'chirilganlar     → DB dan ham o'chiriladi
   *
   * ✅ Eng samarali — faqat kerakli o'zgarishlar
   * ✅ O'chirilganlar ham hisobga olinadi
   */
  async deltaSync(backendPhotos: Photo[]): Promise<{
    qoshildi: number;
    yangilandi: number;
    ochirildi: number;
  }> {
    const db = await this.getDB();

    const dbPhotos = await db.getAll("photos");
    const dbMap = new Map(dbPhotos.map(p => [p.id, p]));          // DB dagi ID → photo
    const backendIds = new Set(backendPhotos.map(p => p.id));     // Backend ID lar

    // Backend da yo'q, lekin DB da bor → o'chirilgan
    const ochirilganIds = dbPhotos
      .filter(p => !backendIds.has(p.id))
      .map(p => p.id);

    // Yangi yoki o'zgargan
    const qoshilganlar: Photo[] = [];
    const yangilananlar: Photo[] = [];

    for (const photo of backendPhotos) {
      const dbPhoto = dbMap.get(photo.id);
      if (!dbPhoto) {
        qoshilganlar.push(photo);                                  // DB da yo'q → yangi
      } else if (JSON.stringify(dbPhoto) !== JSON.stringify(photo)) {
        yangilananlar.push(photo);                                 // farq bor → yangilandi
      }
    }

    // DB ga yozish
    const tx = db.transaction("photos", "readwrite");

    for (const id of ochirilganIds) {
      await tx.store.delete(id);                                   // o'chirilganlar
    }
    for (const photo of [...qoshilganlar, ...yangilananlar]) {
      await tx.store.put(photo);                                   // yangi + o'zgargan
    }

    await tx.done;

    return {
      qoshildi: qoshilganlar.length,
      yangilandi: yangilananlar.length,
      ochirildi: ochirilganIds.length,
    };
  }

  // ── Database boshqaruvi ──────────────────────────────────

  /** Butun database ni o'chirish */
  async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    indexedDB.deleteDatabase(this.DB_NAME);
  }
}

// ─── Yagona instance (Singleton) ────────────────────────────
// Butun loyihada bitta ob'ekt ishlatiladi

export const photoDB = new PhotoDatabase();