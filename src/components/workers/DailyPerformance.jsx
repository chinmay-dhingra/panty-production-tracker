import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, CheckCircle, XCircle, Wrench } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function DailyPerformance({ workers, stageRecords, skus }) {
  const [selectedWorker, setSelectedWorker] = useState("all");
  const [daysRange, setDaysRange] = useState(7);

  // Generate daily performance data
  const getDailyData = () => {
    const days = [];
    for (let i = daysRange - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayRecords = stageRecords.filter(r => {
        const recordDate = new Date(r.completed_at || r.created_date);
        const matchesWorker = selectedWorker === "all" || r.completed_by === selectedWorker;
        return matchesWorker && recordDate >= dayStart && recordDate <= dayEnd;
      });

      const daySkus = skus.filter(s => {
        const skuDate = new Date(s.created_date);
        const matchesWorker = selectedWorker === "all" || s.packed_by === selectedWorker;
        return matchesWorker && skuDate >= dayStart && skuDate <= dayEnd;
      });

      const totalPass = dayRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
      const totalFail = dayRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
      const totalAlt = dayRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
      const totalEntries = dayRecords.length + daySkus.length;

      days.push({
        date: format(date, "MMM dd"),
        fullDate: format(date, "yyyy-MM-dd"),
        entries: totalEntries,
        pass: totalPass,
        fail: totalFail,
        alteration: totalAlt,
        total: totalPass + totalFail + totalAlt
      });
    }
    return days;
  };

  const dailyData = getDailyData();
  const totalPass = dailyData.reduce((sum, d) => sum + d.pass, 0);
  const totalFail = dailyData.reduce((sum, d) => sum + d.fail, 0);
  const totalAlt = dailyData.reduce((sum, d) => sum + d.alteration, 0);
  const totalPieces = totalPass + totalFail + totalAlt;
  const passRate = totalPieces > 0 ? ((totalPass / totalPieces) * 100) : 0;

  const activeWorkers = workers.filter(w => w.is_active !== false);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Filter by:</span>
            </div>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger className="w-48">
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
            <Select value={daysRange.toString()} onValueChange={(v) => setDaysRange(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="14">Last 14 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-slate-500">Total Pieces</span>
            </div>
            <p className="text-2xl font-bold">{totalPieces.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-500">Pass</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{totalPass.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-slate-500">Fail</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{totalFail.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-slate-500">Pass Rate</span>
            </div>
            <p className={`text-2xl font-bold ${passRate >= 90 ? 'text-emerald-700' : passRate >= 70 ? 'text-amber-700' : 'text-red-700'}`}>
              {passRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Daily Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.some(d => d.total > 0) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pass" name="Pass" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="fail" name="Fail" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="alteration" name="Alteration" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-slate-400 py-12">No performance data for selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Daily Details Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyData.filter(d => d.total > 0).reverse().map((day, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{day.date}</p>
                  <p className="text-xs text-slate-500">{day.entries} entries</p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3 mr-1" /> {day.pass}
                  </Badge>
                  <Badge className="bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3 mr-1" /> {day.fail}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700">
                    <Wrench className="w-3 h-3 mr-1" /> {day.alteration}
                  </Badge>
                </div>
              </div>
            ))}
            {dailyData.every(d => d.total === 0) && (
              <p className="text-center text-slate-400 py-8">No activity recorded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}