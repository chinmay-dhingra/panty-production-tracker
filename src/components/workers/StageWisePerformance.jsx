import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Layers, CheckCircle, XCircle, Wrench, User } from "lucide-react";

const STAGE_LABELS = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging"
};

const STAGE_COLORS = {
  counting: "#3b82f6",
  cleaning: "#06b6d4",
  stamping: "#f59e0b",
  ironing: "#ef4444",
  packaging: "#8b5cf6"
};

export default function StageWisePerformance({ workers, stageRecords, skus }) {
  const [selectedWorker, setSelectedWorker] = useState("all");

  // Calculate stage-wise performance
  const getStageData = () => {
    const stages = ["counting", "cleaning", "stamping", "ironing", "packaging"];
    
    return stages.map(stage => {
      let records;
      if (stage === "packaging") {
        records = skus.filter(s => selectedWorker === "all" || s.packed_by === selectedWorker);
        const totalQuantity = records.reduce((sum, s) => sum + (s.quantity || 0), 0);
        return {
          stage: STAGE_LABELS[stage],
          stageKey: stage,
          entries: records.length,
          pieces: records.reduce((sum, s) => sum + (s.total_pieces || 0), 0),
          pass: records.reduce((sum, s) => sum + (s.total_pieces || 0), 0),
          fail: 0,
          alteration: 0,
          passRate: 100
        };
      } else {
        records = stageRecords.filter(r => {
          const matchesStage = r.stage === stage;
          const matchesWorker = selectedWorker === "all" || r.completed_by === selectedWorker;
          return matchesStage && matchesWorker;
        });
        
        const totalPass = records.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
        const totalFail = records.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
        const totalAlt = records.reduce((sum, r) => sum + (r.alteration || 0), 0);
        const totalPieces = totalPass + totalFail + totalAlt;
        const passRate = totalPieces > 0 ? (totalPass / totalPieces * 100) : 0;

        return {
          stage: STAGE_LABELS[stage],
          stageKey: stage,
          entries: records.length,
          pieces: totalPieces,
          pass: totalPass,
          fail: totalFail,
          alteration: totalAlt,
          passRate: passRate
        };
      }
    });
  };

  // Get worker-stage breakdown
  const getWorkerStageBreakdown = () => {
    return workers
      .filter(w => w.is_active !== false)
      .map(worker => {
        const stages = ["counting", "cleaning", "stamping", "ironing", "packaging"];
        const stageData = {};
        
        stages.forEach(stage => {
          if (stage === "packaging") {
            const workerSkus = skus.filter(s => s.packed_by === worker.id);
            stageData[stage] = {
              entries: workerSkus.length,
              pieces: workerSkus.reduce((sum, s) => sum + (s.total_pieces || 0), 0)
            };
          } else {
            const workerRecords = stageRecords.filter(r => r.stage === stage && r.completed_by === worker.id);
            const totalPass = workerRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
            const totalFail = workerRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
            const totalAlt = workerRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
            stageData[stage] = {
              entries: workerRecords.length,
              pieces: totalPass + totalFail + totalAlt,
              pass: totalPass,
              fail: totalFail,
              alteration: totalAlt
            };
          }
        });

        const totalPieces = Object.values(stageData).reduce((sum, s) => sum + s.pieces, 0);

        return {
          ...worker,
          stageData,
          totalPieces
        };
      })
      .filter(w => w.totalPieces > 0)
      .sort((a, b) => b.totalPieces - a.totalPieces);
  };

  const stageData = getStageData();
  const workerBreakdown = getWorkerStageBreakdown();
  const activeWorkers = workers.filter(w => w.is_active !== false);

  // Chart data for stage comparison
  const chartData = stageData.map(s => ({
    name: s.stage,
    Pass: s.pass,
    Fail: s.fail,
    Alteration: s.alteration
  }));

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Filter by worker:</span>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {activeWorkers.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stage Performance Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Stage-wise Quality Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {stageData.some(s => s.pieces > 0) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Pass" stackId="a" fill="#10b981" />
                  <Bar dataKey="Fail" stackId="a" fill="#ef4444" />
                  <Bar dataKey="Alteration" stackId="a" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-12">No stage data available</p>
          )}
        </CardContent>
      </Card>

      {/* Stage Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stageData.map(stage => (
          <Card key={stage.stageKey} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: STAGE_COLORS[stage.stageKey] }}
                />
                <h3 className="font-semibold text-slate-800">{stage.stage}</h3>
              </div>
              
              {stage.pieces > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-emerald-700">{stage.pass}</p>
                      <p className="text-xs text-slate-500">Pass</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-red-700">{stage.fail}</p>
                      <p className="text-xs text-slate-500">Fail</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-amber-700">{stage.alteration}</p>
                      <p className="text-xs text-slate-500">Alt</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Pass Rate</span>
                      <span className={`font-medium ${stage.passRate >= 90 ? 'text-emerald-600' : stage.passRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {stage.passRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={stage.passRate} className="h-2" />
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-xs text-slate-500">{stage.entries} entries</span>
                    <Badge variant="outline">{stage.pieces} pieces</Badge>
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-400 text-sm py-4">No activity</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Worker-Stage Matrix (only if "All Workers" selected) */}
      {selectedWorker === "all" && workerBreakdown.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Worker Performance by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workerBreakdown.map(worker => (
                <div key={worker.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{worker.name}</h4>
                      <p className="text-xs text-slate-500">{worker.totalPieces} total pieces</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {["counting", "cleaning", "stamping", "ironing", "packaging"].map(stage => {
                      const data = worker.stageData[stage];
                      return (
                        <div key={stage} className="text-center p-2 bg-white rounded border">
                          <p className="text-xs text-slate-500 mb-1">{STAGE_LABELS[stage]}</p>
                          <p className="text-lg font-bold" style={{ color: STAGE_COLORS[stage] }}>
                            {data.pieces}
                          </p>
                          <p className="text-xs text-slate-400">{data.entries} entries</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}