export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  image: string;
};

const KEY = "nistokopi:products:v1";
const WA_KEY = "nistokopi:wa:v1";
const DEFAULT_WA = "6281234567890";

export const DEMO: Omit<Product, "id">[] = [
  { name: "Robusta Banyuwangi Medium Roast 250 g", description: "Biji kopi Robusta khas Banyuwangi, roasting medium, kemasan 250 g. Data contoh.", category: "Robusta", price: 55000, stock: 30, featured: true, image: "" },
  { name: "Robusta Banyuwangi Dark Roast 250 g", description: "Biji kopi Robusta khas Banyuwangi, roasting dark, kemasan 250 g. Data contoh.", category: "Robusta", price: 55000, stock: 22, featured: false, image: "" },
  { name: "Robusta Banyuwangi Biji Mentah 1 kg", description: "Biji kopi Robusta mentah (green bean) untuk disangrai sendiri, kemasan 1 kg. Data contoh.", category: "Robusta", price: 90000, stock: 5, featured: false, image: "" },
  { name: "Arabika Ijen Medium Roast 200 g", description: "Biji kopi Arabika Ijen, roasting medium, kemasan 200 g. Data contoh.", category: "Arabika", price: 85000, stock: 18, featured: true, image: "" },
  { name: "Arabika Ijen Light Roast 200 g", description: "Biji kopi Arabika Ijen, roasting light, kemasan 200 g. Data contoh.", category: "Arabika", price: 85000, stock: 0, featured: false, image: "" },
  { name: "Arabika Ijen Biji Mentah 500 g", description: "Biji kopi Arabika Ijen mentah (green bean), kemasan 500 g. Data contoh.", category: "Arabika", price: 140000, stock: 10, featured: false, image: "" },
  { name: "Specialty Banyuwangi 100 g", description: "Biji kopi kelas specialty, kemasan 100 g. Detail lot dan skor cupping belum tersedia. Data contoh.", category: "Specialty", price: 120000, stock: 12, featured: true, image: "" },
  { name: "Paket Cicip Biji Kopi 3 × 100 g", description: "Paket berisi Robusta, Arabika Ijen, dan specialty masing-masing 100 g. Data contoh.", category: "Paket", price: 150000, stock: 8, featured: false, image: "" },
];

let seq = 0;
export function uid(): string {
  seq++;
  return "p" + Date.now().toString(36) + seq.toString(36) + Math.random().toString(36).slice(2, 5);
}

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const cleaned: Product[] = [];
        for (const p of arr) {
          const r = cleanProduct(p);
          if (r) cleaned.push(r);
        }
        // unify categories
        const seen: Record<string, string> = {};
        cleaned.forEach((p) => {
          const k = p.category.toLowerCase();
          if (seen[k]) p.category = seen[k];
          else seen[k] = p.category;
        });
        return cleaned;
      }
    }
  } catch (e) {}
  return DEMO.map((p) => ({ ...p, id: uid() }));
}

export function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(products));
  } catch (e) {
    alert("Penyimpanan browser penuh atau tidak tersedia.");
  }
}

function okImg(v: unknown): string {
  if (typeof v !== "string") return "";
  if (v.length > 400000) return "";
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : "";
}

export function cleanProduct(p: any, n = ""): Product | null {
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  if (typeof p.name !== "string" || !p.name.trim()) return null;
  if (typeof p.category !== "string" || !p.category.trim()) return null;
  if (typeof p.description !== "string" || !p.description.trim()) return null;
  if (typeof p.price !== "number" || !isFinite(p.price) || p.price < 1 || p.price > 1e9 || Math.floor(p.price) !== p.price) return null;
  if (typeof p.stock !== "number" || !isFinite(p.stock) || p.stock < 0 || p.stock > 1e6 || Math.floor(p.stock) !== p.stock) return null;
  if (p.featured !== undefined && typeof p.featured !== "boolean") return null;
  return {
    id: typeof p.id === "string" ? p.id : uid(),
    name: p.name.trim().slice(0, 80),
    category: p.category.trim().slice(0, 40),
    description: p.description.trim().slice(0, 240),
    price: p.price,
    stock: p.stock,
    featured: !!p.featured,
    image: okImg(p.image),
  };
}

export function loadWA(): string {
  if (typeof window === "undefined") return DEFAULT_WA;
  try {
    const v = localStorage.getItem(WA_KEY);
    if (v && /^62\d{8,13}$/.test(v)) return v;
  } catch (e) {}
  return DEFAULT_WA;
}

export function saveWA(n: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WA_KEY, n);
  } catch (e) {}
}

export function normWA(v: string): string {
  let d = String(v).replace(/\D/g, "");
  if (d.indexOf("620") === 0) d = "62" + d.slice(3);
  else if (d.indexOf("0") === 0) d = "62" + d.slice(1);
  else if (d.indexOf("8") === 0) d = "62" + d;
  return /^62\d{8,13}$/.test(d) ? d : "";
}

export function waLink(p: Product, wa: string): string {
  const msg = `Halo NistoKopi, saya ingin memesan ${p.name} (Rp${p.price.toLocaleString("id-ID")}). Apakah masih tersedia?`;
  return `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
}

export const ICONS: Record<string, string> = { robusta: "☕", arabika: "☕", specialty: "✨", paket: "🎁" };

export function canonCat(c: string, products: Product[]): string {
  const l = c.toLowerCase();
  const f = products.find((p) => p.category.toLowerCase() === l);
  return f ? f.category : c;
}

export function rp(n: number): string {
  return "Rp" + Number(n).toLocaleString("id-ID");
}