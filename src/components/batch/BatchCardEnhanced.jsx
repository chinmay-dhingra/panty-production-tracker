import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Package, ArrowRight, Clock, Layers, Eye, EyeOff, 
  Copy, Archive, CheckCircle2, Circle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

const statusColors = {
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
  on_hold: "bg-amber-500",
  archived: "bg-slate-400"
};

const STAGES = ["counting", "cleaning", "stamping", "ironing", "packaging"];

export default function BatchCardEnhanced({ 
  batch, 
  stageRecords = [], 
  onArchive, 
  onDuplicate,
  showQuickView = true 
}) {
  const [expanded, setExpanded] = useState(false);

  const products = batch.expected_products || [];
  const uniqueSeries = [...new Set(products.map(p => p.series_name))];
  const uniqueColors = [...new Set(products.map(p => p.color_name))];

  // Calculate stage progress
  const batchRecords = stageRecords.filter(r => r.batch_id === batch.id);
  
  const getStageStatus = (stage) => {
    const records = batchRecords.filter(r => r.stage === stage);
    if (records.length === 0) return "pending";
    return "done";
  };

  const completedStages = STAGES.filter(s => getStageStatus(s) === "done").length;
  const progressPercent = (completedStages / STAGES.length) * 100;

  // Get current stage (first incomplete)
  const currentStage = STAGES.find(s => getStageStatus(s) === "pending") || "completed";

  // Calculate totals for quick view
  const totalPieces = batchRecords
    .filter(r => r.stage === "counting")
    .reduce((sum, r) => sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0);

  const totalPass = batchRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
  const totalFail = batchRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);

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
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColors[batch.status]}`} />
              {batch.status !== "archived" && (
                <>
                  {showQuickView && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {batch.status !== "archived" && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>
                  {currentStage === "completed" ? "Completed" : `Current: ${currentStage}`}
                </span>
                <span>{completedStages}/{STAGES.length} stages</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}

          {/* Quick View Expanded */}
          {expanded && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg space-y-3">
              {/* Stage Status */}
              <div className="flex gap-1">
                {STAGES.map((stage) => {
                  const status = getStageStatus(stage);
                  return (
                    <div key={stage} className="flex-1 text-center">
                      <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${
                        status === "done" ? "bg-emerald-500" : "bg-slate-200"
                      }`}>
                        {status === "done" ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{stage.slice(0, 3)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white rounded">
                  <p className="text-lg font-bold text-slate-800">{totalPieces}</p>
                  <p className="text-xs text-slate-500">Pieces</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-lg font-bold text-emerald-600">{totalPass}</p>
                  <p className="text-xs text-slate-500">Pass</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-lg font-bold text-red-600">{totalFail}</p>
                  <p className="text-xs text-slate-500">Fail</p>
                </div>
              </div>
            </div>
          )}

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
            <div className="flex items-center gap-1">
              {batch.status === "completed" && onArchive && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                  onClick={() => onArchive(batch.id)}
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </Button>
              )}
              {onDuplicate && batch.status !== "archived" && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                  onClick={() => onDuplicate(batch)}
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
              <Link to={createPageUrl(`BatchDetails?id=${batch.id}`)}>
                <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-800">
                  View <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}