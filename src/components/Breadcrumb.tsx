import Link from "next/link";
import { Fragment } from "react";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mt-4 rounded-md bg-surface px-4 py-2.5 text-[13px]" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-accent">Trang chủ</Link>
      {items.map((item) => (
        <Fragment key={item.label}>
          <span className="mx-2 text-subtle">/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-accent">{item.label}</Link>
          ) : (
            <span className="text-subtle">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
