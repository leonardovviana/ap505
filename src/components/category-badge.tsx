import { categoryColors } from "@/lib/expenses/constants";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/app";

export function CategoryBadge({ category }: { category: string }) {
  const tone = categoryColors[(category as Category) || "Outros"] ?? categoryColors.Outros;
  return (
    <span className={cn("inline-flex items-center rounded-[8px] px-2 py-1 text-xs font-black ring-1", tone)}>
      {category}
    </span>
  );
}
