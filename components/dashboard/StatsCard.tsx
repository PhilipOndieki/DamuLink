import { Card } from "@/components/ui/Card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
  icon: React.ReactNode;
}

/** Dashboard summary stat card */
export function StatsCard({
  title,
  value,
  subtitle,
  highlight = false,
  icon,
}: StatsCardProps) {
  return (
    <Card
      className={highlight ? "border-red-200 bg-red-50" : ""}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={[
              "text-sm font-medium",
              highlight ? "text-red-600" : "text-gray-500",
            ].join(" ")}
          >
            {title}
          </p>
          <p
            className={[
              "text-3xl font-bold mt-1",
              highlight ? "text-red-700" : "text-gray-900",
            ].join(" ")}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={[
            "p-2 rounded-lg",
            highlight ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500",
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
