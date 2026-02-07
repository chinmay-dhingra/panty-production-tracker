import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, TrendingUp, Award, Target, User } from "lucide-react";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STAGES = ["counting", "cleaning", "stamping", "ironing"];
const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning", 
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging"
};

export default function DetailedPerformance() {
  const [selectedWorker, setSelectedWorker] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => base44.entities.Worker.filter({ is_active: true })
  });

  const { data: allRecords = [] } = useQuery({
    queryKey: ["stageRecords"],
    queryFn: () => base44.entities.StageRecord.list("-created_date", 1000)
  });

  const { data: allSKUs = [] } = useQuery({
    queryKey: ["skus"],
    queryFn: () => base44.entities.PackagingSKU.list("-created_date", 1000)
  });

  // Filter records by selected date
  const dateStart = startOfDay(selectedDate);
  const dateEnd = endOfDay(selectedDate);
  
  const recordsForDate = allRecords.filter(r => {
    const recordDate = new Date(r.completed_at || r.created_date);
    return recordDate >= dateStart && recordDate <= dateEnd;
  });

  const skusForDate = allSKUs.filter(s => {
    const skuDate = new Date(s.created_date);
    return skuDate >= dateStart && skuDate <= dateEnd;
  });

  // Filter by worker and stage
  const filteredRecords = recordsForDate.filter(r => {
    const matchesWorker = selectedWorker === "all" || r.completed_by === selectedWorker;
    const matchesStage = selectedStage === "all" || r.stage === selectedStage;
    return matchesWorker && matchesStage;
  });

  const filteredSKUs = skusForDate.filter(s => {
    return selectedWorker === "all" || s.packed_by === selectedWorker;
  });

  // Calculate daily stats
  const totalPieces = filteredRecords.reduce((sum, r) => 
    sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0
  );
  const totalPass = filteredRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
  const totalFail = filteredRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
  const totalAlteration = filteredRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
  const passRate = totalPieces > 0 ? ((totalPass / totalPieces) * 100).toFixed(1) : 0;
  const totalSKUs = filteredSKUs.reduce((sum, s) => sum + (s.quantity || 0), 0);

  // Stage breakdown
  const stageBreakdown = STAGES.map(stage => {
    const stageRecords = filteredRecords.filter(r => r.stage === stage);
    const pieces = stageRecords.reduce((sum, r) => 
      sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0
    );
    const pass = stageRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
    const fail = stageRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
    const alteration = stageRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
    
    return {
      stage: stageLabels[stage],
      pieces,
      pass,
      fail,
      alteration,
      entries: stageRecords.length
    };
  });

  // Add packaging data
  if (selectedStage === "all" || selectedStage === "packaging") {
    stageBreakdown.push({
      stage: "Packaging",
      pieces: filteredSKUs.reduce((sum, s) => sum + (s.total_pieces || 0), 0),
      pass: filteredSKUs.reduce((sum, s) => sum + (s.total_pieces || 0), 0),
      fail: 0,
      alteration: 0,
      entries: filteredSKUs.length
    });
  }

  // Worker breakdown (when all workers selected)
  const workerBreakdown = selectedWorker === "all" ? workers.map(worker => {
    const workerRecords = filteredRecords.filter(r => r.completed_by === worker.id);
    const workerSKUs = filteredSKUs.filter(s => s.packed_by === worker.id);
    const pieces = workerRecords.reduce((sum, r) => 
      sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0
    ) + workerSKUs.reduce((sum, s) => sum + (s.total_pieces || 0), 0);
    const pass = workerRecords.reduce((sum, r) => sum + (r.qc_pass || 0), 0);
    
    return {
      name: worker.name,
      pieces,
      pass,
      passRate: pieces > 0 ? ((pass / pieces) * 100).toFixed(1) : 0,
      entries: workerRecords.length + workerSKUs.length
    };
  }).filter(w => w.pieces > 0).sort((a, b) => b.pieces - a.pieces) : [];

  return (
    <div className="space-y-6">
      {/* Date and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Daily Performance Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="counting">Counting</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="stamping">Stamping</SelectItem>
                <SelectItem value="ironing">Ironing</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Pieces</p>
                <p className="text-3xl font-bold">{totalPieces.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pass Rate</p>
                <p className="text-3xl font-bold text-green-600">{passRate}%</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Entries</p>
                <p className="text-3xl font-bold">{filteredRecords.length + filteredSKUs.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">SKUs Packed</p>
                <p className="text-3xl font-bold text-violet-600">{totalSKUs}</p>
              </div>
              <Award className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stage-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pass" fill="#10b981" name="Pass" />
              <Bar dataKey="fail" fill="#ef4444" name="Fail" />
              <Bar dataKey="alteration" fill="#f59e0b" name="Alteration" />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            {stageBreakdown.map((stage, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-slate-600 mb-1">{stage.stage}</p>
                <p className="text-2xl font-bold text-slate-900">{stage.pieces}</p>
                <p className="text-xs text-slate-500 mt-1">{stage.entries} entries</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Worker Breakdown (when all workers selected) */}
      {selectedWorker === "all" && workerBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Worker Performance on {format(selectedDate, "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workerBreakdown.map((worker, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{worker.name}</p>
                      <p className="text-sm text-slate-500">{worker.entries} entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{worker.pieces}</p>
                      <p className="text-xs text-slate-500">pieces</p>
                    </div>
                    <Badge className={
                      parseFloat(worker.passRate) >= 95 ? "bg-green-600" :
                      parseFloat(worker.passRate) >= 90 ? "bg-blue-600" :
                      "bg-amber-600"
                    }>
                      {worker.passRate}% pass
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <p className="text-sm text-green-700 font-medium">Pass</p>
              <p className="text-3xl font-bold text-green-700">{totalPass}</p>
              <p className="text-xs text-green-600 mt-1">{passRate}%</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <p className="text-sm text-red-700 font-medium">Fail</p>
              <p className="text-3xl font-bold text-red-700">{totalFail}</p>
              <p className="text-xs text-red-600 mt-1">
                {totalPieces > 0 ? ((totalFail / totalPieces) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
              <p className="text-sm text-amber-700 font-medium">Alteration</p>
              <p className="text-3xl font-bold text-amber-700">{totalAlteration}</p>
              <p className="text-xs text-amber-600 mt-1">
                {totalPieces > 0 ? ((totalAlteration / totalPieces) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}