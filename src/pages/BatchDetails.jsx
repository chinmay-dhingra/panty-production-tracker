import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Package, Loader2, CheckCircle2, XCircle, Wrench,
  User, Calendar, FileText, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import BatchProgress from "../components/dashboard/BatchProgress";
import StageForm from "../components/batch/StageForm";
import PackagingForm from "../components/batch/PackagingForm";

const STAGES = ["counting", "cleaning", "stamping", "ironing", "packaging"];

const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging",
  completed: "Completed"
};

export default function BatchDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get("id");
  const queryClient = useQueryClient();

  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => base44.entities.Batch.filter({ id: batchId }),
    select: (data) => data[0],
    enabled: !!batchId
  });

  const { data: stageRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["stageRecords", batchId],
    queryFn: () => base44.entities.StageRecord.filter({ batch_id: batchId }),
    enabled: !!batchId
  });

  const { data: skus = [] } = useQuery({
    queryKey: ["skus", batchId],
    queryFn: () => base44.entities.PackagingSKU.filter({ batch_id: batchId }),
    enabled: !!batchId
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => base44.entities.Worker.filter({ is_active: true })
  });

  const createRecordMutation = useMutation({
    mutationFn: (data) => base44.entities.StageRecord.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stageRecords", batchId] })
  });

  const updateBatchMutation = useMutation({
    mutationFn: (data) => base44.entities.Batch.update(batchId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batch", batchId] })
  });

  const createSKUMutation = useMutation({
    mutationFn: (data) => base44.entities.PackagingSKU.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skus", batchId] })
  });

  const handleStageSubmit = async (data) => {
    await createRecordMutation.mutateAsync({
      batch_id: batchId,
      batch_number: batch.batch_number,
      stage: batch.current_stage,
      ...data,
      completed_at: new Date().toISOString()
    });

    // Move to next stage
    const currentIndex = STAGES.indexOf(batch.current_stage);
    const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : "completed";
    
    await updateBatchMutation.mutateAsync({
      current_stage: nextStage,
      status: nextStage === "completed" ? "completed" : "in_progress"
    });
  };

  const handlePackagingSubmit = async (skusData, totalPieces) => {
    // Create stage record for packaging
    await createRecordMutation.mutateAsync({
      batch_id: batchId,
      batch_number: batch.batch_number,
      stage: "packaging",
      qc_pass: totalPieces,
      qc_fail: 0,
      alteration: 0,
      completed_by: skusData[0]?.packed_by || "",
      completed_by_name: skusData[0]?.packed_by_name || "",
      completed_at: new Date().toISOString()
    });

    // Create SKU records
    for (const sku of skusData) {
      await createSKUMutation.mutateAsync({
        batch_id: batchId,
        batch_number: batch.batch_number,
        ...sku
      });
    }

    // Complete batch
    await updateBatchMutation.mutateAsync({
      current_stage: "completed",
      status: "completed"
    });
  };

  // Calculate available pieces for current stage
  const getAvailablePieces = () => {
    const currentStageIndex = STAGES.indexOf(batch?.current_stage);
    if (currentStageIndex === 0) return batch?.total_pieces || 0;

    const prevStage = STAGES[currentStageIndex - 1];
    const prevRecord = stageRecords.find(r => r.stage === prevStage);
    return prevRecord?.qc_pass || 0;
  };

  if (batchLoading || !batch) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const isCompleted = batch.current_stage === "completed";
  const availablePieces = getAvailablePieces();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6 text-slate-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        {/* Batch Header */}
        <Card className="border-0 shadow-lg mb-6 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                  <Package className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{batch.batch_number}</h1>
                  <div className="flex items-center gap-3 mt-1 text-slate-300 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(batch.created_date), "MMM d, yyyy")}
                    </span>
                    <span>•</span>
                    <span>{batch.total_pieces} pieces</span>
                  </div>
                </div>
              </div>
              <Badge 
                className={`text-sm py-1.5 px-4 ${
                  isCompleted 
                    ? "bg-emerald-500" 
                    : "bg-blue-500"
                }`}
              >
                {isCompleted ? "Completed" : stageLabels[batch.current_stage]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <BatchProgress currentStage={batch.current_stage} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Process Form */}
          <div className="lg:col-span-2">
            {isCompleted ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Batch Completed!</h2>
                  <p className="text-slate-500">All stages have been processed successfully.</p>
                </CardContent>
              </Card>
            ) : batch.current_stage === "packaging" ? (
              <PackagingForm
                workers={workers}
                onSubmit={handlePackagingSubmit}
                isLoading={createRecordMutation.isPending || createSKUMutation.isPending}
                availablePieces={availablePieces}
              />
            ) : (
              <StageForm
                stage={batch.current_stage}
                workers={workers}
                onSubmit={handleStageSubmit}
                isLoading={createRecordMutation.isPending}
                availablePieces={availablePieces}
              />
            )}
          </div>

          {/* Right Column - History */}
          <div className="space-y-6">
            {/* Stage History */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  Stage History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recordsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                ) : stageRecords.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No stages completed yet</p>
                ) : (
                  stageRecords.map((record) => (
                    <div key={record.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="capitalize">
                          {record.stage}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {record.completed_at && format(new Date(record.completed_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{record.qc_pass} pass</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3 h-3" />
                          <span>{record.qc_fail} fail</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600">
                          <Wrench className="w-3 h-3" />
                          <span>{record.alteration} alt</span>
                        </div>
                      </div>
                      {record.completed_by_name && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          {record.completed_by_name}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* SKUs Summary */}
            {skus.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-violet-500" />
                    Packaging SKUs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skus.map((sku) => (
                    <div key={sku.id} className="p-3 bg-violet-50 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium capitalize">
                          {sku.pack_type?.replace("_", " ")}
                        </span>
                        <p className="text-xs text-slate-500">
                          {sku.total_pieces} pieces total
                        </p>
                      </div>
                      <Badge className="bg-violet-600">
                        ×{sku.quantity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Batch Notes */}
            {batch.notes && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-500" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{batch.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}