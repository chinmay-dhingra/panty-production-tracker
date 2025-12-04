import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, Clock, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

const statusColors = {
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  on_hold: "bg-amber-500"
};

export default function BatchCard({ batch }) {
  const products = batch.expected_products || [];
  const uniqueSeries = [...new Set(products.map(p => p.series_name))];
  const uniqueColors = [...new Set(products.map(p => p.color_name))];

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-lg text-slate-800">{batch.batch_number}</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {products.length} product variants
              </p>
            </div>
            <div className={`w-2 h-2 rounded-full ${statusColors[batch.status]}`} />
          </div>

          {/* Product Preview */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1 mb-2">
              {uniqueSeries.slice(0, 2).map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
              ))}
              {uniqueSeries.length > 2 && (
                <Badge variant="outline" className="text-xs">+{uniqueSeries.length - 2}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {uniqueColors.slice(0, 3).map((c, i) => (
                <span key={i} className="text-xs text-slate-400">{c}</span>
              ))}
              {uniqueColors.length > 3 && (
                <span className="text-xs text-slate-400">+{uniqueColors.length - 3} more</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {format(new Date(batch.created_date), "MMM d, yyyy")}
            </div>
            <Link to={createPageUrl(`BatchDetails?id=${batch.id}`)}>
              <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-800">
                View <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}