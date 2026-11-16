"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { loadProducts, loadWA, Product, rp } from "@/lib/products";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wa, setWa] = useState("6281234567890");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("nama");

  useEffect(() => {
    setProducts(loadProducts());
    setWa(loadWA());
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category))).sort((a, b) => a.localeCompare(b, "id"));

  const visible = products
    .filter((p) => {
      if (cat && p.category !== cat) return false;
      const query = q.trim().toLowerCase();
      return !query || (p.name + " " + p.description).toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sort === "murah") return a.price - b.price;
      if (sort === "mahal") return b.price - a.price;
      if (sort === "unggulan" && a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name, "id");
    });

  return (
    <>
      <Navbar />
      <main className="wrap">
        <section>
          <div className="hero">
            <h1 id="h-katalog" tabIndex={-1}>Biji kopi khas Banyuwangi, pesan lewat WhatsApp</h1>
            <p>Katalog digital biji kopi lokal Banyuwangi. Cari produk, bandingkan harga, lalu kirim pesanan langsung ke penjual.</p>
          </div>
          <div className="toolbar">
            <div>
              <label htmlFor="q" className="sr">Cari produk</label>
              <input type="search" id="q" autoComplete="off" placeholder="Cari nama atau deskripsi produk" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div>
              <label htmlFor="f-cat" className="sr">Kategori</label>
              <select id="f-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="">Semua kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="sr">Urutkan</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="nama">Nama A–Z</option>
                <option value="murah">Harga termurah</option>
                <option value="mahal">Harga termahal</option>
                <option value="unggulan">Unggulan dulu</option>
              </select>
            </div>
          </div>
          <p className="count" aria-live="polite">{visible.length} dari {products.length} produk</p>
          <div className="grid">
            {visible.length === 0 ? (
              <div className="empty" style={{ gridColumn: "1/-1" }}>
                {products.length
                  ? <>Tidak ada produk yang cocok. <button className="btn alt sm" type="button" style={{ marginTop: 16 }} onClick={() => { setQ(""); setCat(""); }}>Hapus filter</button></>
                  : <>Katalog masih kosong. Tambahkan produk lewat <a href="/admin">Dashboard</a>.</>}
              </div>
            ) : (
              visible.map((p) => <ProductCard key={p.id} p={p} wa={wa} />)
            )}
          </div>
        </section>
      </main>
      <div className="wrap">
        <footer>Prototipe workshop Vibe Coding UMKM. Bukan sistem e-commerce: pemesanan diteruskan lewat WhatsApp dan data hanya tersimpan di browser ini.</footer>
      </div>
    </>
  );
}