import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Clock, TrendingUp, AlertCircle } from "lucide-react";

const STAGES = ["counting", "cleaning", "stamping", "ironing", "packaging"];

export default function EfficiencyReport({ stageRecords, dateRange }) {
  // Filter by date range
  const filterByDate = (item) => {
    if (!dateRange?.from || !dateRange?.to) return true;
    const itemDate = new Date(item.created_date);
    return itemDate >= dateRange.from && itemDate <= dateRange.to;
  };

  const filteredRecords = stageRecords.filter(filterByDate);

  // Calculate efficiency by stage
  const stageEfficiency = STAGES.map(stage => {
    const records = filteredRecords.filter(r => r.stage === stage);
    const totalPieces = records.reduce((sum, r) => 
      sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0
    );
    const passedPieces = records.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
    const failedPieces = records.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
    const alteredPieces = records.reduce((sum, r) => sum + (r.alteration || 0), 0);
    
    const efficiency = totalPieces > 0 ? ((passedPieces / totalPieces) * 100) : 0;
    const failRate = totalPieces > 0 ? ((failedPieces / totalPieces) * 100) : 0;
    
    return {
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      efficiency: efficiency.toFixed(1),
      total: totalPieces,
      passed: passedPieces,
      failed: failedPieces,
      altered: alteredPieces,
      failRate: failRate.toFixed(1)
    };
  });

  // Calculate stage completion times (average entries per day)
  const avgCompletionTime = filteredRecords.length > 0 ? 
    (filteredRecords.length / Math.max(1, Math.ceil((Date.now() - new Date(filteredRecords[filteredRecords.length - 1]?.created_date || Date.now()).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1) 
    : 0;

  // Overall efficiency
  const totalPieces = filteredRecords.reduce((sum, r) => 
    sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0
  );
  const totalPass = filteredRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
  const overallEfficiency = totalPieces > 0 ? ((totalPass / totalPieces) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overall Efficiency</p>
                <p className="text-2xl font-bold text-emerald-600">{overallEfficiency}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Entries/Day</p>
                <p className="text-2xl font-bold text-blue-600">{avgCompletionTime}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Processed</p>
                <p className="text-2xl font-bold text-slate-900">{totalPieces.toLocaleString()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Efficiency Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Efficiency by Production Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="passed" fill="#10b981" name="Passed" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              <Bar dataKey="altered" fill="#f59e0b" name="Altered" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Stage Breakdown */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Stage Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stageEfficiency.map((stage, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stage.stage}</Badge>
                    <span className="text-sm text-slate-600">{stage.total} pieces</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-emerald-600">{stage.efficiency}% pass</span>
                    <span className="text-sm text-red-600">{stage.failRate}% fail</span>
                  </div>
                </div>
                <Progress value={parseFloat(stage.efficiency)} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}