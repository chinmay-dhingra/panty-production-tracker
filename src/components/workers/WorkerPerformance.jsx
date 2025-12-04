import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { User, TrendingUp, CheckCircle, XCircle, Wrench, Clock } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export default function WorkerPerformance({ workers, stageRecords, skus }) {
  // Calculate performance for each worker
  const workerStats = workers.map(worker => {
    const workerRecords = stageRecords.filter(r => r.completed_by === worker.id);
    const workerSkus = skus.filter(s => s.packed_by === worker.id);

    const totalPass = workerRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
    const totalFail = workerRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
    const totalAlt = workerRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
    const totalPieces = totalPass + totalFail + totalAlt;
    const passRate = totalPieces > 0 ? (totalPass / totalPieces * 100) : 0;

    // Calculate entries by stage
    const stageBreakdown = ["counting", "cleaning", "stamping", "ironing"].reduce((acc, stage) => {
      acc[stage] = workerRecords.filter(r => r.stage === stage).length;
      return acc;
    }, {});
    stageBreakdown.packaging = workerSkus.length;

    const totalEntries = workerRecords.length + workerSkus.length;

    return {
      id: worker.id,
      name: worker.name,
      employee_id: worker.employee_id,
      department: worker.department,
      is_active: worker.is_active,
      totalEntries,
      totalPieces,
      totalPass,
      totalFail,
      totalAlt,
      passRate,
      stageBreakdown,
      packedUnits: workerSkus.reduce((sum, s) => sum + (s.quantity || 0), 0)
    };
  }).sort((a, b) => b.totalPieces - a.totalPieces);

  // Top performers chart data
  const topPerformers = workerStats.filter(w => w.totalPieces > 0).slice(0, 5).map(w => ({
    name: w.name.split(' ')[0],
    pieces: w.totalPieces,
    passRate: Math.round(w.passRate)
  }));

  return (
    <div className="space-y-6">
      {/* Top Performers Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Top Performers by Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPerformers.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPerformers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="pieces" name="Pieces Processed" radius={[0, 4, 4, 0]}>
                    {topPerformers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No performance data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Individual Worker Stats */}
      <div className="space-y-4">
        {workerStats.filter(w => w.is_active !== false).map((worker) => (
          <Card key={worker.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{worker.name}</h3>
                    <p className="text-xs text-slate-500">{worker.employee_id || 'No ID'}</p>
                  </div>
                </div>
                {worker.department && (
                  <Badge variant="outline">{worker.department}</Badge>
                )}
              </div>

              {worker.totalEntries > 0 ? (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-800">{worker.totalEntries}</p>
                      <p className="text-xs text-slate-500">Entries</p>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-bold text-emerald-700">{worker.totalPass}</p>
                      <p className="text-xs text-emerald-600">Pass</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-700">{worker.totalFail}</p>
                      <p className="text-xs text-red-600">Fail</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-700">{worker.totalAlt}</p>
                      <p className="text-xs text-amber-600">Alt</p>
                    </div>
                  </div>

                  {/* Pass Rate */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Pass Rate</span>
                      <span className={`font-medium ${worker.passRate >= 90 ? 'text-emerald-600' : worker.passRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {worker.passRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={worker.passRate} className="h-2" />
                  </div>

                  {/* Stage Breakdown */}
                  <div className="flex gap-2 text-xs">
                    {Object.entries(worker.stageBreakdown).map(([stage, count]) => (
                      count > 0 && (
                        <Badge key={stage} variant="outline" className="text-xs">
                          {stage.slice(0, 3)}: {count}
                        </Badge>
                      )
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-400 py-4 text-sm">No activity recorded yet</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}