import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  category: string;
  className?: string;
}

export function RiskBadge({ category, className }: RiskBadgeProps) {
  const getStyles = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "low risk":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium risk":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high risk":
      case "reject":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider",
        getStyles(category),
        className
      )}
    >
      {category}
    </span>
  );
}
