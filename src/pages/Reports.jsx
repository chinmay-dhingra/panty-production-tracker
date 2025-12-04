import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Loader2, TrendingUp, Package, CheckCircle, XCircle, Wrench, 
  BarChart3, PieChartIcon
} from "lucide-react";

const COLORS = ["#10b981", "#ef4444", "#f59e0b"];
const PACK_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6", "#22c55e"];

export default function Reports() {
  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: () => base44.entities.Batch.list()
  });

  const { data: stageRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["stageRecords"],
    queryFn: () => base44.entities.StageRecord.list()
  });

  const { data: skus = [], isLoading: skusLoading } = useQuery({
    queryKey: ["skus"],
    queryFn: () => base44.entities.PackagingSKU.list()
  });

  const isLoading = batchesLoading || recordsLoading || skusLoading;

  // Calculate QC stats by stage
  const stageStats = ["counting", "cleaning", "stamping", "ironing", "packaging"].map(stage => {
    const records = stageRecords.filter(r => r.stage === stage);
    return {
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      pass: records.reduce((sum, r) => sum + (r.qc_pass || 0), 0),
      fail: records.reduce((sum, r) => sum + (r.qc_fail || 0), 0),
      alteration: records.reduce((sum, r) => sum + (r.alteration || 0), 0)
    };
  });

  // Calculate overall QC distribution
  const totalPass = stageRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
  const totalFail = stageRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
  const totalAlteration = stageRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);

  const qcDistribution = [
    { name: "QC Pass", value: totalPass, color: "#10b981" },
    { name: "QC Fail", value: totalFail, color: "#ef4444" },
    { name: "Alteration", value: totalAlteration, color: "#f59e0b" }
  ].filter(item => item.value > 0);

  // Calculate SKU distribution
  const skuData = [
    { name: "Single", value: skus.filter(s => s.pack_type === "single").reduce((sum, s) => sum + (s.quantity || 0), 0) },
    { name: "2 Pack", value: skus.filter(s => s.pack_type === "2_pack").reduce((sum, s) => sum + (s.quantity || 0), 0) },
    { name: "3 Pack", value: skus.filter(s => s.pack_type === "3_pack").reduce((sum, s) => sum + (s.quantity || 0), 0) },
    { name: "4 Pack", value: skus.filter(s => s.pack_type === "4_pack").reduce((sum, s) => sum + (s.quantity || 0), 0) },
    { name: "6 Pack", value: skus.filter(s => s.pack_type === "6_pack").reduce((sum, s) => sum + (s.quantity || 0), 0) },
    { name: "8 Pack", value: skus.filter(s => s.pack_type === "8_pack").reduce((sum, s) => sum + (s.quantity || 0), 0) }
  ].filter(item => item.value > 0);

  // Summary stats
  const completedBatches = batches.filter(b => b.status === "completed").length;
  const totalPieces = batches.reduce((sum, b) => sum + (b.total_pieces || 0), 0);
  const totalPackedUnits = skus.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const passRate = totalPass + totalFail + totalAlteration > 0
    ? ((totalPass / (totalPass + totalFail + totalAlteration)) * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Production Reports</h1>
          <p className="text-slate-500 mt-1">Analytics and insights for your production</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Batches</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{batches.length}</p>
                  <p className="text-xs text-emerald-600 mt-1">{completedBatches} completed</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Pieces</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{totalPieces.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">All batches</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">QC Pass Rate</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{passRate}%</p>
                  <p className="text-xs text-slate-400 mt-1">{totalPass.toLocaleString()} passed</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Packed SKUs</p>
                  <p className="text-3xl font-bold text-violet-600 mt-1">{totalPackedUnits.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">Units created</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* QC Results by Stage */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-500" />
                QC Results by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pass" name="Pass" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fail" name="Fail" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="alteration" name="Alteration" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* QC Distribution Pie */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-slate-500" />
                Overall QC Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {qcDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qcDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {qcDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No QC data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SKU Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-violet-500" />
              SKU Pack Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skuData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skuData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" name="Units" radius={[0, 4, 4, 0]}>
                      {skuData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PACK_COLORS[index % PACK_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                No packaging data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* QC Issues Summary */}
        <Card className="border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle>QC Issues Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">QC Pass</span>
                </div>
                <p className="text-3xl font-bold text-emerald-800">{totalPass.toLocaleString()}</p>
                <p className="text-sm text-emerald-600 mt-1">pieces passed inspection</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-700">QC Fail</span>
                </div>
                <p className="text-3xl font-bold text-red-800">{totalFail.toLocaleString()}</p>
                <p className="text-sm text-red-600 mt-1">pieces rejected</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-700">Alteration</span>
                </div>
                <p className="text-3xl font-bold text-amber-800">{totalAlteration.toLocaleString()}</p>
                <p className="text-sm text-amber-600 mt-1">pieces need repair</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}