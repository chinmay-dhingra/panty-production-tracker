import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Package, Loader2, CheckCircle2, XCircle, Wrench,
  User, Calendar, FileText, Clock, Layers, Palette, Ruler, Copy
} from "lucide-react";
import ExportBatchPDF from "../components/batch/ExportBatchPDF";
import EditStageRecord from "../components/batch/EditStageRecord";
import BatchStatusControl from "../components/batch/BatchStatusControl";
import DeleteBatch from "../components/batch/DeleteBatch";
import EditBatchNumber from "../components/batch/EditBatchNumber";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import StageForm from "../components/batch/StageForm";
import PackagingForm from "../components/batch/PackagingForm";

const STAGES = ["counting", "cleaning", "stamping", "ironing", "packaging"];

const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging"
};

const stageColors = {
  counting: "bg-blue-100 text-blue-700 border-blue-200",
  cleaning: "bg-cyan-100 text-cyan-700 border-cyan-200",
  stamping: "bg-amber-100 text-amber-700 border-amber-200",
  ironing: "bg-orange-100 text-orange-700 border-orange-200",
  packaging: "bg-violet-100 text-violet-700 border-violet-200"
};

export default function BatchDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get("id");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState("counting");

  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: () => base44.entities.Batch.filter({ id: batchId }),
    select: (data) => data[0],
    enabled: !!batchId
  });

  const { data: stageRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["stageRecords", batchId],
    queryFn: () => base44.entities.StageRecord.filter({ batch_id: batchId }, "-created_date"),
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

  const { data: sizes = [] } = useQuery({
    queryKey: ["sizes"],
    queryFn: () => base44.entities.ProductSize.filter({ is_active: true })
  });

  const createRecordMutation = useMutation({
    mutationFn: (data) => base44.entities.StageRecord.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stageRecords", batchId] })
  });

  const createSKUMutation = useMutation({
    mutationFn: (data) => base44.entities.PackagingSKU.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skus", batchId] })
  });

  const updateBatchMutation = useMutation({
    mutationFn: (data) => base44.entities.Batch.update(batchId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batch", batchId] })
  });

  const updateRecordMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StageRecord.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stageRecords", batchId] })
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id) => base44.entities.StageRecord.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stageRecords", batchId] })
  });

  const deleteBatchMutation = useMutation({
    mutationFn: async () => {
      // Delete all stage records
      const recordPromises = stageRecords.map(r => base44.entities.StageRecord.delete(r.id));
      await Promise.all(recordPromises);
      
      // Delete all SKUs
      const skuPromises = skus.map(s => base44.entities.PackagingSKU.delete(s.id));
      await Promise.all(skuPromises);
      
      // Delete batch
      await base44.entities.Batch.delete(batchId);
    },
    onSuccess: () => {
      navigate(createPageUrl("Dashboard"));
    }
  });

  const handleStageSubmit = async (data) => {
    await createRecordMutation.mutateAsync({
      batch_id: batchId,
      batch_number: batch.batch_number,
      stage: activeStage,
      ...data,
      completed_at: new Date().toISOString()
    });
  };

  const handlePackagingSubmit = async (data) => {
    // Get first source product for series/color/material/style info
    const firstSource = data.source_products[0];
    
    // Create SKU record
    await createSKUMutation.mutateAsync({
      batch_id: batchId,
      batch_number: batch.batch_number,
      series_id: firstSource.series_id,
      series_name: firstSource.series_name,
      color_id: firstSource.color_id,
      color_name: firstSource.color_name,
      size_id: data.size_id,
      size_name: data.size_name,
      material_id: firstSource.material_id,
      material_name: firstSource.material_name,
      style_id: firstSource.style_id,
      style_name: firstSource.style_name,
      pack_type: data.pack_type,
      quantity: data.quantity,
      total_pieces: data.total_pieces,
      packed_by: data.packed_by,
      packed_by_name: data.packed_by_name,
      sku_code: data.sku_code
    });

    // Deduct raw products from inventory
    try {
      for (const sourceProduct of data.source_products) {
        const existingInventory = await base44.entities.Inventory.filter({
          series_id: sourceProduct.series_id,
          color_id: sourceProduct.color_id,
          size_id: sourceProduct.size_id,
          material_id: sourceProduct.material_id || "",
          style_id: sourceProduct.style_id || ""
        });

        if (existingInventory.length > 0) {
          const current = existingInventory[0];
          await base44.entities.Inventory.update(current.id, {
            stock_count: Math.max(0, (current.stock_count || 0) - sourceProduct.quantity)
          });
        }
      }

      // Add SKU to inventory
      const skuInventory = await base44.entities.Inventory.filter({
        series_id: firstSource.series_id,
        color_id: firstSource.color_id,
        size_id: data.size_id,
        material_id: firstSource.material_id || "",
        style_id: firstSource.style_id || ""
      });

      if (skuInventory.length > 0) {
        const current = skuInventory[0];
        await base44.entities.Inventory.update(current.id, {
          stock_count: (current.stock_count || 0) + data.quantity
        });
      } else {
        await base44.entities.Inventory.create({
          series_id: firstSource.series_id,
          series_name: firstSource.series_name,
          color_id: firstSource.color_id,
          color_name: firstSource.color_name,
          size_id: data.size_id,
          size_name: data.size_name,
          material_id: firstSource.material_id || "",
          material_name: firstSource.material_name || "",
          style_id: firstSource.style_id || "",
          style_name: firstSource.style_name || "",
          stock_count: data.quantity,
          reorder_point: 0
        });
      }
    } catch (error) {
      console.error("Failed to update inventory:", error);
    }
  };

  // Calculate stock by product for each stage
  const calculateStockByStage = (stage) => {
    const stageIndex = STAGES.indexOf(stage);
    const prevStage = stageIndex > 0 ? STAGES[stageIndex - 1] : null;
    
    const stock = {};
    
    if (!prevStage) {
      // For counting, we don't have previous stage data
      return stock;
    }

    // Get passed pieces from previous stage
    const prevRecords = stageRecords.filter(r => r.stage === prevStage);
    prevRecords.forEach(r => {
      const key = `${r.series_id}-${r.color_id}-${r.size_id}-${r.material_id || ''}-${r.style_id || ''}`;
      stock[key] = (stock[key] || 0) + (r.qc_pass || 0);
    });

    // Subtract what's already processed in current stage
    const currentRecords = stageRecords.filter(r => r.stage === stage);
    currentRecords.forEach(r => {
      const key = `${r.series_id}-${r.color_id}-${r.size_id}-${r.material_id || ''}-${r.style_id || ''}`;
      const total = (r.qc_pass || 0) + (r.qc_fail || 0) + (r.alteration || 0);
      stock[key] = (stock[key] || 0) - total;
    });

    return stock;
  };

  // Calculate available for packaging (after ironing)
  const calculatePackagingStock = () => {
    const stock = {};
    
    // Get passed from ironing
    const ironingRecords = stageRecords.filter(r => r.stage === "ironing");
    ironingRecords.forEach(r => {
      const key = `${r.series_id}-${r.color_id}-${r.size_id}-${r.material_id || ''}-${r.style_id || ''}`;
      stock[key] = (stock[key] || 0) + (r.qc_pass || 0);
    });

    // Subtract already packaged
    skus.forEach(s => {
      const key = `${s.series_id}-${s.color_id}-${s.size_id}-${s.material_id || ''}-${s.style_id || ''}`;
      stock[key] = (stock[key] || 0) - (s.total_pieces || 0);
    });

    return stock;
  };

  // Calculate totals by product
  const calculateProductTotals = () => {
    const totals = {};
    
    stageRecords.forEach(r => {
      const key = `${r.series_name}-${r.color_name}-${r.size_name}-${r.material_name || ''}-${r.style_name || ''}`;
      if (!totals[key]) {
        totals[key] = {
          series_name: r.series_name,
          color_name: r.color_name,
          size_name: r.size_name,
          material_name: r.material_name || "",
          style_name: r.style_name || "",
          stages: {}
        };
      }
      if (!totals[key].stages[r.stage]) {
        totals[key].stages[r.stage] = { pass: 0, fail: 0, alteration: 0 };
      }
      totals[key].stages[r.stage].pass += r.qc_pass || 0;
      totals[key].stages[r.stage].fail += r.qc_fail || 0;
      totals[key].stages[r.stage].alteration += r.alteration || 0;
    });

    return Object.values(totals);
  };

  // Get stage summary
  const getStageSummary = (stage) => {
    const records = stageRecords.filter(r => r.stage === stage);
    return {
      entries: records.length,
      pass: records.reduce((sum, r) => sum + (r.qc_pass || 0), 0),
      fail: records.reduce((sum, r) => sum + (r.qc_fail || 0), 0),
      alteration: records.reduce((sum, r) => sum + (r.alteration || 0), 0)
    };
  };

  if (batchLoading || !batch) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const products = batch.expected_products || [];
  const productTotals = calculateProductTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
                    <span>{products.length} product variants</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      ID: {batch.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EditBatchNumber 
                  currentNumber={batch.batch_number}
                  onUpdate={(newNumber) => updateBatchMutation.mutate({ batch_number: newNumber })}
                  isLoading={updateBatchMutation.isPending}
                />
                <BatchStatusControl 
                  currentStatus={batch.status} 
                  onStatusChange={(status) => updateBatchMutation.mutate({ status })}
                />
                <ExportBatchPDF batch={batch} stageRecords={stageRecords} skus={skus} />
                <DeleteBatch 
                  batchNumber={batch.batch_number}
                  onDelete={() => deleteBatchMutation.mutate()}
                  isLoading={deleteBatchMutation.isPending}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Expected Products */}
            <div className="flex flex-wrap gap-2">
              {products.map((p, i) => (
                <Badge key={i} variant="outline" className="gap-1">
                  <span className="font-medium">{p.series_name}</span>
                  <span className="text-slate-400">-</span>
                  {p.color_name}
                  <span className="text-slate-400">-</span>
                  {p.size_name}
                  {p.material_name && (
                    <>
                      <span className="text-slate-400">-</span>
                      {p.material_name}
                    </>
                  )}
                  {p.style_name && (
                    <>
                      <span className="text-slate-400">-</span>
                      {p.style_name}
                    </>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {STAGES.map((stage) => {
            const summary = getStageSummary(stage);
            return (
              <Card 
                key={stage} 
                className={`border-0 shadow-sm cursor-pointer transition-all ${
                  activeStage === stage ? 'ring-2 ring-slate-800' : ''
                }`}
                onClick={() => setActiveStage(stage)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={stageColors[stage]}>{stageLabels[stage]}</Badge>
                    <span className="text-xs text-slate-400">{summary.entries} entries</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-emerald-600">{summary.pass} ✓</span>
                    <span className="text-red-600">{summary.fail} ✗</span>
                    <span className="text-amber-600">{summary.alteration} ⚡</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Entry Form */}
          <div className="lg:col-span-2">
            {activeStage === "packaging" ? (
              <PackagingForm
                workers={workers}
                products={products}
                availableStock={calculatePackagingStock()}
                sizes={sizes}
                onSubmit={handlePackagingSubmit}
                isLoading={createSKUMutation.isPending}
              />
            ) : (
              <StageForm
                stage={activeStage}
                workers={workers}
                products={products}
                onSubmit={handleStageSubmit}
                isLoading={createRecordMutation.isPending}
              />
            )}

            {/* Stage Records */}
            <Card className="border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  {stageLabels[activeStage]} Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeStage === "packaging" ? (
                  skus.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">No packaging entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {skus.map((sku) => {
                        const packType = sku.pack_type?.replace("_", " ") || "";
                        const piecesPerPack = sku.pack_type ? parseInt(sku.pack_type.split("_")[0]) || 1 : 1;
                        const totalPacks = sku.quantity || 0;
                        const totalPieces = sku.total_pieces || (piecesPerPack * totalPacks);
                        
                        return (
                          <div key={sku.id} className="border-2 border-violet-300 rounded-lg overflow-hidden">
                            {/* SKU Header - Main Focus */}
                            <div className="bg-violet-600 text-white p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  <span className="font-bold text-sm">FINAL SKU CREATED</span>
                                </div>
                                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                  {format(new Date(sku.created_date), "MMM d, HH:mm")}
                                </span>
                              </div>
                              <p className="text-2xl font-bold mt-2 mb-1">
                                {sku.sku_code}
                              </p>
                              <div className="bg-white/20 rounded p-2 mt-2">
                                <p className="text-sm font-semibold">
                                  {piecesPerPack} pieces per pack × {totalPacks} packs = {totalPieces} pieces
                                </p>
                              </div>
                            </div>

                            {/* Raw Products Consumed */}
                            <div className="bg-violet-50 p-3">
                              <p className="text-xs text-violet-700 font-bold mb-2 uppercase">Raw Products Consumed:</p>
                              <div className="space-y-1">
                                {sku.source_products && sku.source_products.length > 0 ? (
                                  sku.source_products.map((source, idx) => {
                                    const rawProductName = [
                                      source.series_name,
                                      source.color_name,
                                      source.size_name,
                                      source.material_name,
                                      source.style_name
                                    ].filter(Boolean).join(" - ");
                                    
                                    return (
                                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-violet-200">
                                        <span className="text-sm text-slate-700">{rawProductName}</span>
                                        <Badge variant="outline" className="font-bold text-violet-700">
                                          {source.quantity} pcs
                                        </Badge>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-xs text-slate-400">No source products recorded</p>
                                )}
                              </div>
                              {sku.packed_by_name && (
                                <p className="text-xs text-slate-500 mt-2">Packed by: {sku.packed_by_name}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  stageRecords.filter(r => r.stage === activeStage).length === 0 ? (
                    <p className="text-slate-400 text-center py-6">No entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stageRecords.filter(r => r.stage === activeStage).map((record) => (
                        <div key={record.id} className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{record.series_name}</Badge>
                                <Badge variant="outline">{record.color_name}</Badge>
                                <Badge variant="outline">{record.size_name}</Badge>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Copy className="w-3 h-3" />
                                  {record.id.slice(0, 8)}
                                </span>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> {record.qc_pass}
                                </span>
                                <span className="text-red-600 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> {record.qc_fail}
                                </span>
                                <span className="text-amber-600 flex items-center gap-1">
                                  <Wrench className="w-3 h-3" /> {record.alteration}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="text-right text-xs text-slate-400">
                                {record.completed_at && (
                                  <p>{format(new Date(record.completed_at), "MMM d, HH:mm")}</p>
                                )}
                                {record.completed_by_name && (
                                  <p className="flex items-center gap-1 justify-end mt-1">
                                    <User className="w-3 h-3" /> {record.completed_by_name}
                                  </p>
                                )}
                              </div>
                              <EditStageRecord
                                record={record}
                                workers={workers}
                                onUpdate={(id, data) => updateRecordMutation.mutate({ id, data })}
                                onDelete={(id) => deleteRecordMutation.mutate(id)}
                                isLoading={updateRecordMutation.isPending || deleteRecordMutation.isPending}
                              />
                            </div>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-slate-500 mt-2 border-t pt-2">{record.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Summary */}
          <div className="space-y-6">
            {/* Product Tracking Summary */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-500" />
                  Production Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {productTotals.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No production data yet</p>
                ) : (
                  productTotals.map((product, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {product.series_name} - {product.color_name} - {product.size_name}
                          {product.material_name && ` - ${product.material_name}`}
                          {product.style_name && ` - ${product.style_name}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-xs">
                        {STAGES.map(stage => {
                          const data = product.stages[stage];
                          return (
                            <div key={stage} className="text-center">
                              <p className="text-slate-400 mb-1">{stage.slice(0,3)}</p>
                              {data ? (
                                <p className="font-medium text-emerald-600">{data.pass}</p>
                              ) : (
                                <p className="text-slate-300">-</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* SKU-Specific Summary */}
            {skus.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-violet-500" />
                    SKU Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {skus.map((sku) => (
                      <div key={sku.id} className="p-3 bg-violet-50 rounded-lg border border-violet-200">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-violet-900">
                              {sku.series_name} - {sku.color_name} - {sku.size_name}
                              {sku.material_name && ` - ${sku.material_name}`}
                              {sku.style_name && ` - ${sku.style_name}`}
                            </p>
                            <p className="text-xs text-violet-700 mt-1">
                              {sku.pack_type?.replace("_", " ")} • SKU: {sku.sku_code}
                            </p>
                          </div>
                          <Badge className="bg-violet-600 shrink-0">
                            {sku.quantity} packs
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Batch Notes */}
            {batch.notes && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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