import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, parseISO, startOfDay, startOfWeek, eachDayOfInterval, eachWeekOfInterval, subDays } from "date-fns";

export default function ThroughputChart({ stageRecords, batches }) {
  const [period, setPeriod] = useState("daily");

  // Get date range (last 30 days for daily, last 12 weeks for weekly)
  const today = new Date();
  const startDate = period === "daily" ? subDays(today, 30) : subDays(today, 84);

  // Group records by date
  const getDataByPeriod = () => {
    const intervals = period === "daily"
      ? eachDayOfInterval({ start: startDate, end: today })
      : eachWeekOfInterval({ start: startDate, end: today });

    return intervals.map(date => {
      const periodStart = period === "daily" ? startOfDay(date) : startOfWeek(date);
      const periodEnd = period === "daily" 
        ? new Date(periodStart.getTime() + 24 * 60 * 60 * 1000)
        : new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const periodRecords = stageRecords.filter(r => {
        const recordDate = r.completed_at ? new Date(r.completed_at) : new Date(r.created_date);
        return recordDate >= periodStart && recordDate < periodEnd;
      });

      const countingRecords = periodRecords.filter(r => r.stage === "counting");
      const pieces = countingRecords.reduce((sum, r) => sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0);
      const passed = periodRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
      const failed = periodRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);

      const periodBatches = batches.filter(b => {
        const batchDate = new Date(b.created_date);
        return batchDate >= periodStart && batchDate < periodEnd;
      });

      return {
        date: format(date, period === "daily" ? "MMM d" : "MMM d"),
        pieces,
        passed,
        failed,
        batches: periodBatches.length
      };
    });
  };

  const data = getDataByPeriod();
  const totalPieces = data.reduce((sum, d) => sum + d.pieces, 0);
  const avgDaily = period === "daily" ? Math.round(totalPieces / 30) : Math.round(totalPieces / 12);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Production Throughput
        </CardTitle>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="h-8">
            <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs px-3">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Total Pieces</p>
            <p className="text-lg font-bold text-blue-800">{totalPieces.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">Avg per {period === "daily" ? "day" : "week"}</p>
            <p className="text-lg font-bold text-slate-800">{avgDaily.toLocaleString()}</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="pieces" 
                name="Total Pieces" 
                stroke="#3b82f6" 
                fill="#93c5fd" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="passed" 
                name="Passed" 
                stroke="#10b981" 
                fill="#6ee7b7" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}