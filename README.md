# NistoKopi

Fullstack JavaScript (Next.js) katalog biji kopi. Data disimpan di browser (localStorage) untuk keperluan edukasi. Deploy ke Vercel.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Admin

- Halaman: `/admin`
- Password default: `admin123` (ubah via env `NEXT_PUBLIC_ADMIN_PASSWORD`)

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import di Vercel.
3. (Opsional) set env `NEXT_PUBLIC_ADMIN_PASSWORD`.
4. Deploy.