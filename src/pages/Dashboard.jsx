import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers, CheckCircle, AlertTriangle, Search, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatsCard from "../components/dashboard/StatsCard";
import BatchCard from "../components/batch/BatchCard";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: () => base44.entities.Batch.list("-created_date")
  });

  const { data: stageRecords = [] } = useQuery({
    queryKey: ["stageRecords"],
    queryFn: () => base44.entities.StageRecord.list()
  });

  // Calculate stats
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === "in_progress").length;
  const completedBatches = batches.filter(b => b.status === "completed").length;
  const totalPieces = batches.reduce((sum, b) => sum + (b.total_pieces || 0), 0);
  const totalQCFail = stageRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
  const totalAlteration = stageRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batch_number?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || batch.current_stage === filter || batch.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Production Dashboard</h1>
            <p className="text-slate-500 mt-1">Track your panty QC production progress</p>
          </div>
          <Link to={createPageUrl("NewBatch")}>
            <Button className="bg-slate-800 hover:bg-slate-700 shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> New Batch
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Batches"
            value={totalBatches}
            subtitle={`${activeBatches} active`}
            icon={Package}
            gradient="bg-gradient-to-br from-slate-700 to-slate-900"
          />
          <StatsCard
            title="Total Pieces"
            value={totalPieces.toLocaleString()}
            subtitle="Across all batches"
            icon={Layers}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          />
          <StatsCard
            title="Completed"
            value={completedBatches}
            subtitle="Batches finished"
            icon={CheckCircle}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
          <StatsCard
            title="QC Issues"
            value={totalQCFail + totalAlteration}
            subtitle={`${totalQCFail} fails, ${totalAlteration} alterations`}
            icon={AlertTriangle}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by batch number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="in_progress">Active</TabsTrigger>
              <TabsTrigger value="counting">Counting</TabsTrigger>
              <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
              <TabsTrigger value="stamping">Stamping</TabsTrigger>
              <TabsTrigger value="ironing">Ironing</TabsTrigger>
              <TabsTrigger value="packaging">Packaging</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Batches Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No batches found</h3>
            <p className="text-slate-400 mt-1">Create your first batch to get started</p>
            <Link to={createPageUrl("NewBatch")}>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" /> Create Batch
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}