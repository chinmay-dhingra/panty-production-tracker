import { Card } from "@/components/ui/card";

export default function StatsCard({ title, value, subtitle, icon: Icon, gradient }) {
  return (
    <Card className={`relative overflow-hidden p-6 ${gradient} text-white`}>
      <div className="absolute -right-4 -top-4 opacity-20">
        <Icon className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-sm mt-1 opacity-80">{subtitle}</p>}
      </div>
    </Card>
  );
}