"use client";
import { Product, rp, ICONS, waLink } from "@/lib/products";

export default function ProductCard({ p, wa }: { p: Product; wa: string }) {
  const out = p.stock <= 0;
  const low = !out && p.stock <= 5;
  const icon = ICONS[p.category.toLowerCase()] || "☕";
  return (
    <article className="card">
      {p.image ? (
        <div className="tile photo"><img src={p.image} alt={`Foto ${p.name}`} loading="lazy" /></div>
      ) : (
        <div className="tile" aria-hidden="true">{icon}</div>
      )}
      {p.featured && <span className="badge" style={{ position: "absolute", top: 8, left: 8 }}>Unggulan</span>}
      <div className="body">
        <h2>{p.name}</h2>
        <span className="cat">{p.category}</span>
        <p className="desc">{p.description}</p>
        <div className="meta">
          <span className="price">{rp(p.price)}</span>
          <span className={`stock ${out ? "out" : low ? "low" : ""}`}>
            {out ? "Stok habis" : low ? `Stok tinggal ${p.stock}` : `Stok ${p.stock}`}
          </span>
        </div>
        {out ? (
          <button className="btn" disabled aria-disabled="true">Tidak tersedia</button>
        ) : (
          <a className="btn" href={waLink(p, wa)} target="_blank" rel="noopener noreferrer" aria-label={`Pesan ${p.name} lewat WhatsApp`}>
            Pesan lewat WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}