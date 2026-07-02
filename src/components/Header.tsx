// src/components/Header.tsx
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-purple-900 text-white shadow-md">
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/filmhub_logo.svg"
          alt="FilmHub logo"
          width={120}
          height={120}
          priority
        />
        
      </Link>
      <nav className="flex items-center gap-4 text-sm font-medium" aria-label="Primary navigation">
        <Link href="/" className="hover:underline">
          Events
        </Link>
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        <Link href="/my-events" className="hover:underline">
          My Events
        </Link>
      </nav>
    </header>
  );
}
