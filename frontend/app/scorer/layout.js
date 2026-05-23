"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles } from "lucide-react";
import Logo from "../../components/Logo";

export default function ScorerLayout({ children }) {
  const pathname = usePathname();
  const onDashboard = pathname === "/scorer";

  return (
    <div className="min-h-[70vh] -mx-4 sm:-mx-6 lg:-mx-8">
      <header className="sticky top-16 z-40 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/scorer" className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Scorer Panel
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold">
            <Link
              href="/scorer"
              className={`flex items-center gap-1.5 ${onDashboard ? "text-accent" : "text-subtext hover:text-text"}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-subtext hover:text-text flex items-center gap-1.5"
            >
              <Logo className="h-5 w-auto text-subtext" />
              Public Site
            </Link>
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</div>
    </div>
  );
}
