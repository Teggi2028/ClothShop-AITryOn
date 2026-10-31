import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={`flex flex-col items-center leading-none ${light ? "text-white" : "text-ink"} ${className}`} aria-label={BRAND.fullName}>
      <span className="text-[26px] font-extrabold tracking-[0.18em]">{BRAND.name}</span>
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.42em]">{BRAND.subName}</span>
    </Link>
  );
}
