import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, Wrench, XCircle } from "lucide-react";

const COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981", "#ec4899"];

export default function DefectAnalysis({ stageRecords }) {
  // Analyze defects by stage
  const defectsByStage = ["counting", "cleaning", "stamping", "ironing", "packaging"].map(stage => {
    const records = stageRecords.filter(r => r.stage === stage);
    return {
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      fail: records.reduce((sum, r) => sum + (r.qc_fail || 0), 0),
      alteration: records.reduce((sum, r) => sum + (r.alteration || 0), 0)
    };
  });

  // Analyze by defect reason
  const reasonCounts = {};
  stageRecords.forEach(r => {
    if ((r.qc_fail > 0 || r.alteration > 0) && r.defect_reason) {
      reasonCounts[r.defect_reason] = (reasonCounts[r.defect_reason] || 0) + (r.qc_fail || 0) + (r.alteration || 0);
    }
  });
  const defectReasons = Object.entries(reasonCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Analyze by product
  const productDefects = {};
  stageRecords.forEach(r => {
    if (r.qc_fail > 0 || r.alteration > 0) {
      const key = `${r.series_name || 'Unknown'} - ${r.color_name || 'Unknown'}`;
      if (!productDefects[key]) {
        productDefects[key] = { name: key, fail: 0, alteration: 0 };
      }
      productDefects[key].fail += r.qc_fail || 0;
      productDefects[key].alteration += r.alteration || 0;
    }
  });
  const topDefectProducts = Object.values(productDefects)
    .sort((a, b) => (b.fail + b.alteration) - (a.fail + a.alteration))
    .slice(0, 5);

  const totalFail = stageRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
  const totalAlteration = stageRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">QC Failures</span>
            </div>
            <p className="text-2xl font-bold text-red-800">{totalFail.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">Alterations</span>
            </div>
            <p className="text-2xl font-bold text-amber-800">{totalAlteration.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Defects by Stage */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Defects by Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectsByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="fail" name="Fail" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alteration" name="Alteration" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Defect Reasons */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Top Defect Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          {defectReasons.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectReasons}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {defectReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No defect reasons recorded yet</p>
          )}
        </CardContent>
      </Card>

      {/* Top Defective Products */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Most Defective Products</CardTitle>
        </CardHeader>
        <CardContent>
          {topDefectProducts.length > 0 ? (
            <div className="space-y-3">
              {topDefectProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-sm">{product.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-red-600">{product.fail} fail</Badge>
                    <Badge variant="outline" className="text-amber-600">{product.alteration} alt</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No defects recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}