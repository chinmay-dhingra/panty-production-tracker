import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers, CheckCircle, AlertTriangle, Search, Plus, Loader2, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import StatsCard from "../components/dashboard/StatsCard";
import BatchCardEnhanced from "../components/batch/BatchCardEnhanced";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: () => base44.entities.Batch.list("-created_date")
  });

  const { data: stageRecords = [] } = useQuery({
    queryKey: ["stageRecords"],
    queryFn: () => base44.entities.StageRecord.list()
  });

  const { data: skus = [] } = useQuery({
    queryKey: ["skus"],
    queryFn: () => base44.entities.PackagingSKU.list()
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list()
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Batch.update(id, { status: "archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] })
  });

  const duplicateMutation = useMutation({
    mutationFn: async (batch) => {
      const today = format(new Date(), "yyyyMMdd");
      const todayBatches = batches.filter(b => b.batch_number?.startsWith(`BTH-${today}`));
      const nextNumber = todayBatches.length + 1;
      const newBatchNumber = `BTH-${today}-${String(nextNumber).padStart(3, "0")}`;
      
      return base44.entities.Batch.create({
        batch_number: newBatchNumber,
        status: "in_progress",
        expected_products: batch.expected_products,
        notes: batch.notes ? `Duplicated from ${batch.batch_number}. ${batch.notes}` : `Duplicated from ${batch.batch_number}`
      });
    },
    onSuccess: (newBatch) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      navigate(createPageUrl(`BatchDetails?id=${newBatch.id}`));
    }
  });

  // Calculate stats (exclude archived)
  const activeBatchList = batches.filter(b => b.status !== "archived");
  const totalBatches = activeBatchList.length;
  const activeBatches = activeBatchList.filter(b => b.status === "in_progress").length;
  const completedBatches = activeBatchList.filter(b => b.status === "completed").length;
  
  // Total pieces from counting stage
  const countingRecords = stageRecords.filter(r => r.stage === "counting");
  const totalPieces = countingRecords.reduce((sum, r) => sum + (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0), 0);
  
  const totalQCFail = stageRecords.reduce((sum, r) => sum + (r.qc_fail || 0), 0);
  const totalAlteration = stageRecords.reduce((sum, r) => sum + (r.alteration || 0), 0);
  const totalPackedUnits = skus.reduce((sum, s) => sum + (s.quantity || 0), 0);
  
  // Low stock alerts
  const lowStockCount = inventory.filter(
    item => item.reorder_point > 0 && item.stock_count <= item.reorder_point
  ).length;

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batch_number?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" 
      ? batch.status !== "archived" 
      : batch.status === filter;
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
            title="Pieces Counted"
            value={totalPieces.toLocaleString()}
            subtitle="Verified pieces"
            icon={Layers}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          />
          <StatsCard
            title="Packed SKUs"
            value={totalPackedUnits.toLocaleString()}
            subtitle="Units created"
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

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {lowStockCount} product{lowStockCount > 1 ? 's' : ''} below reorder point
                  </span>
                </div>
                <Link to={createPageUrl("Inventory")}>
                  <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                    View Inventory
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

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
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="on_hold">On Hold</TabsTrigger>
              <TabsTrigger value="archived" className="gap-1">
                <Archive className="w-3 h-3" /> Archived
              </TabsTrigger>
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
              <BatchCardEnhanced 
                key={batch.id} 
                batch={batch} 
                stageRecords={stageRecords}
                onArchive={(id) => archiveMutation.mutate(id)}
                onDuplicate={(b) => duplicateMutation.mutate(b)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}