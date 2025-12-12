import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function ProductionSummary({ stageRecords, skus, batches, dateRange }) {
  // Filter by date range
  const filterByDate = (item) => {
    if (!dateRange?.from || !dateRange?.to) return true;
    const itemDate = new Date(item.created_date);
    return itemDate >= dateRange.from && itemDate <= dateRange.to;
  };

  const filteredRecords = stageRecords.filter(filterByDate);
  const filteredSKUs = skus.filter(filterByDate);
  const filteredBatches = batches.filter(filterByDate);

  // Total pieces processed
  const totalPieces = filteredRecords.reduce((sum, r) => 
    sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0
  );

  // Total SKUs created
  const totalSKUs = filteredSKUs.reduce((sum, s) => sum + (s.quantity || 0), 0);

  // Quality metrics
  const totalPass = filteredRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
  const totalFail = filteredRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
  const totalAlteration = filteredRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
  const passRate = totalPieces > 0 ? ((totalPass / totalPieces) * 100).toFixed(1) : 0;

  // Batches summary
  const activeBatches = filteredBatches.filter(b => b.status === 'in_progress').length;
  const completedBatches = filteredBatches.filter(b => b.status === 'completed').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Total Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{filteredBatches.length}</div>
          <div className="flex gap-2 mt-2 text-xs">
            <Badge variant="outline" className="text-blue-600">{activeBatches} active</Badge>
            <Badge variant="outline" className="text-green-600">{completedBatches} done</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Pieces Processed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{totalPieces.toLocaleString()}</div>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-emerald-600">{totalPass} pass</span>
            <span className="text-red-600">{totalFail} fail</span>
            <span className="text-amber-600">{totalAlteration} alt</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Quality Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-600">{passRate}%</div>
          <div className="text-xs text-slate-500 mt-2">
            Pass rate across all stages
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Package className="w-4 h-4" />
            SKUs Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-violet-600">{totalSKUs.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2">
            Final SKU bundles packaged
          </div>
        </CardContent>
      </Card>
    </div>
  );
}