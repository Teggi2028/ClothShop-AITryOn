"use client";

import { useRouter } from "next/navigation";

// Ô chọn sắp xếp: mỗi lựa chọn đã có sẵn đường link (do server tạo), chỉ cần chuyển trang.
export function SortSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      Sắp xếp:
      <select
        value={value}
        onChange={(e) => router.push(options.find((o) => o.value === e.target.value)!.href, { scroll: false })}
        className="h-9 rounded border border-line bg-white px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
