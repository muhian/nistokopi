"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  const isDash = path.startsWith("/admin");
  return (
    <header className="top">
      <div className="wrap">
        <span className="brand">NistoKopi</span>
        <nav aria-label="Navigasi utama">
          <Link href="/" aria-current={!isDash ? "page" : undefined}>Katalog</Link>
          <Link href="/admin" aria-current={isDash ? "page" : undefined}>Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}