import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Trophy, TrendingUp, Award, Users } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

const STAGES = ["counting", "cleaning", "stamping", "ironing", "packaging"];

export default function AdvancedWorkerDashboard({ stageRecords, skus, workers, dateRange }) {
  // Filter by date range
  const filterByDate = (item) => {
    if (!dateRange?.from || !dateRange?.to) return true;
    const itemDate = new Date(item.created_date || item.completed_at);
    return itemDate >= dateRange.from && itemDate <= dateRange.to;
  };

  const filteredRecords = stageRecords.filter(filterByDate);
  const filteredSKUs = skus.filter(filterByDate);

  // Calculate worker statistics
  const workerStats = workers.map(worker => {
    const workerRecords = filteredRecords.filter(r => r.completed_by === worker.id);
    const workerSKUs = filteredSKUs.filter(s => s.packed_by === worker.id);

    const totalEntries = workerRecords.length;
    const totalPieces = workerRecords.reduce((sum, r) => 
      sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0
    );
    const passedPieces = workerRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
    const failedPieces = workerRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
    const alteredPieces = workerRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
    const passRate = totalPieces > 0 ? ((passedPieces / totalPieces) * 100) : 0;
    const skusPacked = workerSKUs.reduce((sum, s) => sum + (s.quantity || 0), 0);

    // Stage breakdown
    const stageBreakdown = {};
    STAGES.forEach(stage => {
      const stageRecs = workerRecords.filter(r => r.stage === stage);
      stageBreakdown[stage] = stageRecs.length;
    });

    return {
      id: worker.id,
      name: worker.name,
      employee_id: worker.employee_id,
      role: worker.role,
      totalEntries,
      totalPieces,
      passedPieces,
      failedPieces,
      alteredPieces,
      passRate: passRate.toFixed(1),
      skusPacked,
      stageBreakdown,
      efficiency: passRate
    };
  }).filter(w => w.totalEntries > 0);

  // Sort by efficiency
  const topPerformers = [...workerStats].sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);

  // Worker comparison chart data
  const comparisonData = workerStats.slice(0, 10).map(w => ({
    name: w.name,
    passed: w.passedPieces,
    failed: w.failedPieces,
    altered: w.alteredPieces,
    efficiency: parseFloat(w.passRate)
  }));

  // Weekly productivity trend (mock data based on total)
  const weeklyData = [];
  const totalWeeks = Math.min(8, Math.ceil((Date.now() - new Date(filteredRecords[filteredRecords.length - 1]?.created_date || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)));
  for (let i = totalWeeks; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weeklyData.push({
      week: format(weekStart, 'MMM dd'),
      pieces: Math.floor(filteredRecords.length / (totalWeeks + 1))
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topPerformers.map((worker, idx) => (
              <div key={worker.id} className="relative">
                <Card className={`${idx === 0 ? 'border-2 border-amber-400 bg-amber-50' : 'border-slate-200'}`}>
                  <CardContent className="p-4 text-center">
                    {idx === 0 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-amber-500">🏆 #1</Badge>
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="font-bold text-slate-900">{worker.name}</p>
                      <p className="text-xs text-slate-500 mb-2">{worker.employee_id}</p>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Efficiency</span>
                          <span className="font-semibold text-emerald-600">{worker.passRate}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Pieces</span>
                          <span className="font-semibold">{worker.totalPieces}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Worker Comparison Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Worker Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="passed" fill="#10b981" name="Passed" />
              <Bar yAxisId="left" dataKey="failed" fill="#ef4444" name="Failed" />
              <Bar yAxisId="left" dataKey="altered" fill="#f59e0b" name="Altered" />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#8b5cf6" name="Efficiency %" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Worker Stats */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Detailed Worker Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workerStats.map((worker) => (
              <div key={worker.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{worker.name}</p>
                    <p className="text-sm text-slate-600">{worker.employee_id} • {worker.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{worker.totalEntries} entries</Badge>
                    <Badge variant="outline">{worker.totalPieces} pieces</Badge>
                    {worker.skusPacked > 0 && (
                      <Badge className="bg-violet-600">{worker.skusPacked} SKUs</Badge>
                    )}
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="text-center p-2 bg-emerald-50 rounded border border-emerald-200">
                    <p className="text-xs text-emerald-700">Pass</p>
                    <p className="text-lg font-bold text-emerald-700">{worker.passedPieces}</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs text-red-700">Fail</p>
                    <p className="text-lg font-bold text-red-700">{worker.failedPieces}</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                    <p className="text-xs text-amber-700">Altered</p>
                    <p className="text-lg font-bold text-amber-700">{worker.alteredPieces}</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-700">Efficiency</p>
                    <p className="text-lg font-bold text-blue-700">{worker.passRate}%</p>
                  </div>
                </div>

                {/* Stage Activity */}
                <div>
                  <p className="text-xs text-slate-600 mb-2">Stage Activity</p>
                  <div className="flex gap-2">
                    {STAGES.map(stage => {
                      const count = worker.stageBreakdown[stage] || 0;
                      return count > 0 ? (
                        <Badge key={stage} variant="outline" className="text-xs">
                          {stage}: {count}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <Progress value={parseFloat(worker.passRate)} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}