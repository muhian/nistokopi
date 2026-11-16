export const ADMIN_PASSWORD =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("nistokopi:admin") === "1";
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem("nistokopi:admin", "1");
    return true;
  }
  return false;
}

export function adminLogout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("nistokopi:admin");
}