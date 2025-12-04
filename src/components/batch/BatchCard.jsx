import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BatchProgress from "../dashboard/BatchProgress";
import { format } from "date-fns";

const stageColors = {
  counting: "bg-blue-100 text-blue-700",
  cleaning: "bg-cyan-100 text-cyan-700",
  stamping: "bg-amber-100 text-amber-700",
  ironing: "bg-orange-100 text-orange-700",
  packaging: "bg-violet-100 text-violet-700",
  completed: "bg-emerald-100 text-emerald-700"
};

const statusColors = {
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  on_hold: "bg-amber-500"
};

export default function BatchCard({ batch }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-lg text-slate-800">{batch.batch_number}</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {batch.total_pieces} pieces
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColors[batch.status]}`} />
              <Badge className={stageColors[batch.current_stage]}>
                {batch.current_stage === "completed" ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Completed</>
                ) : (
                  batch.current_stage?.replace("_", " ")
                )}
              </Badge>
            </div>
          </div>

          <div className="mb-4">
            <BatchProgress currentStage={batch.current_stage} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {format(new Date(batch.created_date), "MMM d, yyyy")}
            </div>
            <Link to={createPageUrl(`BatchDetails?id=${batch.id}`)}>
              <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-800">
                View Details <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}