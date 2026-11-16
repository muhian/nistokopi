"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { loadProducts, saveProducts, loadWA, saveWA, normWA, cleanProduct, uid, DEMO, Product, rp } from "@/lib/products";
import { isAdminLoggedIn, adminLogin, adminLogout, ADMIN_PASSWORD } from "@/lib/auth";

// helper to add ids to demo
function withIdsLocal(list: any[]) { return list.map((p: any) => ({ ...p, id: uid() })); }

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [wa, setWa] = useState("6281234567890");
  const [toastMsg, setToastMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", cat: "", price: "", stock: "", desc: "", feat: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingImage, setPendingImage] = useState("");
  const [imgPreview, setImgPreview] = useState("");
  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    setAuthed(isAdminLoggedIn());
  }, []);

  useEffect(() => {
    if (authed) {
      setProducts(loadProducts());
      setWa(loadWA());
    }
  }, [authed]);

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2600);
  }

  function persist(next: Product[]) {
    setProducts(next);
    saveProducts(next);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (adminLogin(pw)) {
      setAuthed(true);
      setLoginErr("");
    } else {
      setLoginErr("Password salah.");
    }
  }

  function logout() {
    adminLogout();
    setAuthed(false);
  }

  // image handling
  function setImage(v: string) {
    setPendingImage(v);
    setImgPreview(v);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fail = (m: string) => { setErrors((er) => ({ ...er, img: m })); e.target.value = ""; };
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return fail("Pilih file JPG, PNG, atau WebP.");
    if (f.size > 8 * 1024 * 1024) return fail("Ukuran file maksimal 8 MB.");
    const rd = new FileReader();
    rd.onerror = () => fail("File tidak bisa dibaca.");
    rd.onload = () => {
      const im = new Image();
      im.onerror = () => fail("File gambar tidak bisa dibuka.");
      im.onload = () => {
        const r = Math.min(1, 640 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * r));
        c.height = Math.max(1, Math.round(im.height * r));
        const g = c.getContext("2d")!;
        g.fillStyle = "#fff";
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(im, 0, 0, c.width, c.height);
        const out = c.toDataURL("image/jpeg", 0.75);
        if (out.length > 400000) return fail("Foto masih terlalu besar. Pilih foto lain.");
        setImage(out);
        toast("Foto siap. Klik Simpan produk.");
        setErrors((er) => ({ ...er, img: "" }));
      };
      im.src = rd.result as string;
    };
    rd.readAsDataURL(f);
  }

  function clearErrors() { setErrors({}); }

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", cat: "", price: "", stock: "", desc: "", feat: false });
    clearErrors();
    setImage("");
    const inp = document.getElementById("p-img") as HTMLInputElement | null;
    if (inp) inp.value = "";
  }

  function canonCat(c: string) {
    const l = c.toLowerCase();
    const f = products.find((p) => p.category.toLowerCase() === l);
    return f ? f.category : c;
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    const name = form.name.trim();
    const cat = canonCat(form.cat.trim());
    const desc = form.desc.trim();
    const price = form.price === "" ? NaN : Number(form.price);
    const stock = form.stock === "" ? NaN : Number(form.stock);
    const bad: string[] = [];
    const fail = (k: string, msg: string) => { setErrors((er) => ({ ...er, [k]: msg })); bad.push(k); };
    if (!name) fail("name", "Isi nama produk.");
    else if (products.some((p) => p.id !== editingId && p.name.toLowerCase() === name.toLowerCase())) fail("name", "Nama produk sudah ada. Gunakan nama yang berbeda.");
    if (!cat) fail("cat", "Isi kategori, misalnya Arabika.");
    if (!isFinite(price) || price < 1 || price > 1e9 || Math.floor(price) !== price) fail("price", "Isi harga dengan bilangan bulat lebih dari 0.");
    if (!isFinite(stock) || stock < 0 || stock > 1e6 || Math.floor(stock) !== stock) fail("stock", "Isi stok dengan bilangan bulat 0 sampai 1.000.000.");
    if (!desc) fail("desc", "Isi deskripsi singkat produk.");
    if (bad.length) return;
    const data: Product = {
      id: editingId || uid(),
      name: name.slice(0, 80),
      category: cat.slice(0, 40),
      description: desc.slice(0, 240),
      price,
      stock,
      featured: form.feat,
      image: pendingImage,
    };
    let next: Product[];
    if (editingId) {
      next = products.map((p) => (p.id === editingId ? data : p));
      toast("Produk diperbarui.");
    } else {
      next = [...products, data];
      toast("Produk ditambahkan.");
    }
    persist(next);
    resetForm();
  }

  function editProduct(p: Product) {
    setEditingId(p.id);
    setForm({ name: p.name, cat: p.category, price: String(p.price), stock: String(p.stock), desc: p.description, feat: !!p.featured });
    setImage(p.image || "");
    setErrors({});
    const el = document.getElementById("form-title");
    if (el) el.scrollIntoView({ block: "start" });
  }

  function deleteProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`"${p.name}" akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.`)) return;
    const next = products.filter((x) => x.id !== id);
    if (editingId === id) resetForm();
    persist(next);
    toast("Produk dihapus.");
  }

  // WA
  const [waInput, setWaInput] = useState("");
  useEffect(() => { setWaInput("0" + wa.slice(2)); }, [wa]);
  function saveWAForm(e: React.FormEvent) {
    e.preventDefault();
    const n = normWA(waInput);
    if (!n) { setErrors((er) => ({ ...er, wa: "Nomor tidak valid. Contoh: 0812-3456-7890" })); return; }
    setErrors((er) => ({ ...er, wa: "" }));
    setWa(n);
    saveWA(n);
    toast("Nomor WhatsApp disimpan.");
  }

  // export/import/reset
  function exportText() {
    return JSON.stringify(products.map((p) => ({ name: p.name, description: p.description, category: p.category, price: p.price, stock: p.stock, featured: !!p.featured, image: p.image || "" })), null, 2);
  }

  function handleImport() {
    let arr: any;
    try { arr = JSON.parse(jsonText); } catch (e) { setErrors((er) => ({ ...er, json: "Teks bukan JSON yang valid." })); return; }
    if (!Array.isArray(arr)) { setErrors((er) => ({ ...er, json: "JSON harus berupa daftar (array) produk." })); return; }
    if (!arr.length) { setErrors((er) => ({ ...er, json: "Daftar produk kosong." })); return; }
    const out: Product[] = [];
    for (let i = 0; i < arr.length; i++) {
      const r = cleanProduct(arr[i]);
      if (!r) { setErrors((er) => ({ ...er, json: `Produk ke-${i + 1}: data tidak valid.` })); return; }
      out.push(r);
    }
    // unify categories
    const seen: Record<string, string> = {};
    out.forEach((p) => { const k = p.category.toLowerCase(); if (seen[k]) p.category = seen[k]; else seen[k] = p.category; });
    if (!confirm(`Data produk saat ini akan diganti dengan ${out.length} produk dari JSON.`)) return;
    persist(out);
    resetForm();
    setJsonText("");
    setErrors((er) => ({ ...er, json: "" }));
    toast("Data berhasil diimpor.");
  }

  function handleReset() {
    if (!confirm("Semua perubahan akan hilang dan data kembali ke contoh awal.")) return;
    const next = withIdsLocal(DEMO);
    persist(next);
    resetForm();
    setJsonText("");
    toast("Data demo dikembalikan.");
  }

  const categories = Array.from(new Set(products.map((p) => p.category))).sort((a, b) => a.localeCompare(b, "id"));

  if (!authed) {
    return (
      <>
        <Navbar />
        <main className="wrap">
          <section className="hero">
            <h1>Dashboard pengelola</h1>
            <p>Masuk untuk mengelola produk.</p>
          </section>
          <div className="panel" style={{ maxWidth: 416 }}>
            <h2>Login admin</h2>
            <form onSubmit={handleLogin} style={{ display: "grid", gap: 8 }}>
              <div>
                <label htmlFor="pw">Password</label>
                <input type="password" id="pw" value={pw} onChange={(e) => setPw(e.target.value)} />
                {loginErr && <p className="err">{loginErr}</p>}
              </div>
              <div className="row-actions">
                <button className="btn" type="submit">Masuk</button>
              </div>
              <p className="note">Password default: {ADMIN_PASSWORD} (ubah via env NEXT_PUBLIC_ADMIN_PASSWORD).</p>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="wrap">
        <section className="hero">
          <h1 id="h-dash" tabIndex={-1}>Dashboard pengelola</h1>
          <p>Kelola produk yang tampil di katalog. Perubahan langsung tampil di halaman Katalog.</p>
        </section>

        <div className="stats">
          <div className="stat"><b>{products.length}</b><span>Total produk</span></div>
          <div className="stat"><b>{products.reduce((a, p) => a + p.stock, 0).toLocaleString("id-ID")}</b><span>Total stok</span></div>
          <div className="stat"><b>{categories.length}</b><span>Kategori aktif</span></div>
        </div>

        <div className="panel">
          <h2>Nomor WhatsApp penjual</h2>
          <form onSubmit={saveWAForm} noValidate style={{ display: "grid", gap: 8, maxWidth: 416 }}>
            <div>
              <label htmlFor="wa-num">Nomor WhatsApp</label>
              <input type="text" id="wa-num" inputMode="tel" autoComplete="off" placeholder="0812-3456-7890" value={waInput} onChange={(e) => setWaInput(e.target.value)} />
              {errors.wa && <p className="err">{errors.wa}</p>}
            </div>
            <p className="note" style={{ margin: 0 }}>{wa === "6281234567890" ? "Saat ini masih nomor contoh. Ganti dengan nomor penjual sebelum dipakai." : `Pesanan dari katalog dikirim ke +${wa}.`}</p>
            <div className="row-actions"><button className="btn" type="submit">Simpan nomor</button></div>
          </form>
        </div>

        <div className="panel">
          <h2 id="form-title">{editingId ? "Ubah produk" : "Tambah produk"}</h2>
          <form className="form" onSubmit={submitForm} noValidate>
            <div>
              <label htmlFor="p-name">Nama produk</label>
              <input type="text" id="p-name" aria-required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} />
              {errors.name && <p className="err">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="p-cat">Kategori</label>
              <input type="text" id="p-cat" aria-required list="cats" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} maxLength={40} />
              <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              {errors.cat && <p className="err">{errors.cat}</p>}
            </div>
            <div>
              <label htmlFor="p-price">Harga (Rp)</label>
              <input type="number" id="p-price" aria-required min={0} max={1000000000} step={500} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              {errors.price && <p className="err">{errors.price}</p>}
            </div>
            <div>
              <label htmlFor="p-stock">Stok</label>
              <input type="number" id="p-stock" aria-required min={0} max={1000000} step={1} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              {errors.stock && <p className="err">{errors.stock}</p>}
            </div>
            <div className="full">
              <label htmlFor="p-desc">Deskripsi</label>
              <textarea id="p-desc" aria-required maxLength={240} className="plain" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
              {errors.desc && <p className="err">{errors.desc}</p>}
            </div>
            <div className="full">
              <label htmlFor="p-img">Foto produk (opsional)</label>
              <input type="file" id="p-img" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
              <p className="note" style={{ margin: "4px 0 0" }}>JPG, PNG, atau WebP. Foto diperkecil otomatis (maks. 640 px).</p>
              {errors.img && <p className="err">{errors.img}</p>}
              {imgPreview && (
                <div id="img-wrap">
                  <img id="img-prev" className="prev" src={imgPreview} alt="Pratinjau foto produk" />
                  <button className="btn alt sm" type="button" onClick={() => { setImage(""); const inp = document.getElementById("p-img") as HTMLInputElement; if (inp) inp.value = ""; }}>Hapus foto</button>
                </div>
              )}
            </div>
            <div className="full">
              <label className="chk"><input type="checkbox" checked={form.feat} onChange={(e) => setForm({ ...form, feat: e.target.checked })} /> Tandai sebagai produk unggulan</label>
            </div>
            <div className="full row-actions">
              <button className="btn" type="submit">{editingId ? "Simpan perubahan" : "Simpan produk"}</button>
              {editingId && <button className="btn alt" type="button" onClick={resetForm}>Batal ubah</button>}
            </div>
          </form>
        </div>

        <div className="panel">
          <h2>Daftar produk</h2>
          <div className="tbl">
            <table>
              <thead><tr><th scope="col">Produk</th><th scope="col">Kategori</th><th scope="col">Harga</th><th scope="col">Stok</th><th scope="col">Aksi</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.image && <img className="thumb" src={p.image} alt="" />}<b>{p.name}</b>{p.featured && <span className="stock"> (unggulan)</span>}</td>
                    <td>{p.category}</td>
                    <td>{rp(p.price)}</td>
                    <td className={p.stock <= 0 ? "stock out" : ""}>{p.stock <= 0 ? "Habis" : p.stock}</td>
                    <td>
                      <div className="act-wrap">
                        <button className="btn alt sm" type="button" onClick={() => editProduct(p)}>Ubah</button>
                        <button className="btn danger sm" type="button" onClick={() => deleteProduct(p.id)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && <div className="empty">Belum ada produk. Isi formulir di atas untuk menambah produk pertama.</div>}
        </div>

        <div className="panel">
          <h2>Data produk</h2>
          <p className="note" style={{ marginTop: 0 }}>Data tersimpan di browser ini saja (localStorage). Salin teks JSON di bawah untuk mencadangkan, atau tempel JSON lalu pilih Impor.</p>
          <label htmlFor="json" style={{ marginTop: 16 }}>Data JSON</label>
          <textarea id="json" spellCheck={false} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          {errors.json && <p className="err">{errors.json}</p>}
          <div className="row-actions">
            <button className="btn alt" type="button" onClick={() => { setJsonText(exportText()); setErrors((er) => ({ ...er, json: "" })); toast("Data ditampilkan."); }}>Tampilkan data (ekspor)</button>
            <button className="btn alt" type="button" onClick={() => {
              const box = document.getElementById("json") as HTMLTextAreaElement;
              if (!box.value) setJsonText(exportText());
              box.select();
              navigator.clipboard?.writeText(box.value).then(() => toast("JSON disalin.")).catch(() => { try { document.execCommand("copy"); toast("JSON disalin."); } catch { toast("Salin manual."); } });
            }}>Salin JSON</button>
            <button className="btn" type="button" onClick={handleImport}>Impor JSON</button>
            <button className="btn danger" type="button" onClick={handleReset}>Reset data demo</button>
          </div>
        </div>

        <div className="row-actions">
          <button className="btn alt" type="button" onClick={logout}>Keluar</button>
        </div>
      </main>
      {toastMsg && <div id="toast" role="status">{toastMsg}</div>}
    </>
  );
}