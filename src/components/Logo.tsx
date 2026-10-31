import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex flex-col items-center leading-none ${className}`} aria-label={BRAND.fullName}>
      <span className="font-serif text-[28px] font-semibold tracking-[0.3em] pl-[0.3em]">{BRAND.name}</span>
      <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.5em] pl-[0.5em]">{BRAND.subName}</span>
    </Link>
  );
}
