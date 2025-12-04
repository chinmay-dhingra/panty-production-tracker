import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Loader2, Sparkles, Plus, X, Layers, Palette, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function NewBatch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: batches = [] } = useQuery({
    queryKey: ["batches"],
    queryFn: () => base44.entities.Batch.list("-created_date")
  });

  const { data: series = [] } = useQuery({
    queryKey: ["productSeries"],
    queryFn: () => base44.entities.ProductSeries.filter({ is_active: true })
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["productColors"],
    queryFn: () => base44.entities.ProductColor.filter({ is_active: true })
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["productSizes"],
    queryFn: () => base44.entities.ProductSize.filter({ is_active: true })
  });

  const generateBatchNumber = () => {
    const today = format(new Date(), "yyyyMMdd");
    const todayBatches = batches.filter(b => b.batch_number?.startsWith(`BTH-${today}`));
    const nextNumber = todayBatches.length + 1;
    return `BTH-${today}-${String(nextNumber).padStart(3, "0")}`;
  };

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [notes, setNotes] = useState("");

  // Selection state
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const addProducts = () => {
    if (selectedSeries.length === 0 || selectedColors.length === 0 || selectedSizes.length === 0) {
      alert("Please select at least one series, color, and size");
      return;
    }

    const newProducts = [];
    selectedSeries.forEach(ser => {
      selectedColors.forEach(col => {
        selectedSizes.forEach(siz => {
          const exists = selectedProducts.some(p => 
            p.series_id === ser.id && p.color_id === col.id && p.size_id === siz.id
          );
          if (!exists) {
            newProducts.push({
              series_id: ser.id,
              series_name: ser.name,
              color_id: col.id,
              color_name: col.name,
              color_hex: col.hex_code,
              size_id: siz.id,
              size_name: siz.name
            });
          }
        });
      });
    });

    setSelectedProducts([...selectedProducts, ...newProducts]);
    setSelectedSeries([]);
    setSelectedColors([]);
    setSelectedSizes([]);
  };

  const removeProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Batch.create(data),
    onSuccess: (newBatch) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      navigate(createPageUrl(`BatchDetails?id=${newBatch.id}`));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert("Please add at least one product to the batch");
      return;
    }

    createMutation.mutate({
      batch_number: generateBatchNumber(),
      status: "in_progress",
      expected_products: selectedProducts,
      notes
    });
  };

  const batchNumber = generateBatchNumber();

  const toggleSelection = (item, list, setList) => {
    const exists = list.find(i => i.id === item.id);
    if (exists) {
      setList(list.filter(i => i.id !== item.id));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6 text-slate-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create New Batch</h2>
                <p className="text-slate-300 text-sm font-normal mt-1">
                  Select products for this production batch
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Auto Batch Number */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <Label className="text-blue-700 font-medium">Auto-Generated Batch Number</Label>
                </div>
                <p className="text-2xl font-bold text-slate-800">{batchNumber}</p>
              </div>

              {/* Product Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Products to Batch
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Series Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-500" /> Series
                    </Label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {series.length === 0 ? (
                        <p className="text-sm text-slate-400">No series. Add in Settings.</p>
                      ) : (
                        series.map(s => (
                          <div key={s.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedSeries.some(i => i.id === s.id)}
                              onCheckedChange={() => toggleSelection(s, selectedSeries, setSelectedSeries)}
                            />
                            <span className="text-sm">{s.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-slate-500" /> Colors
                    </Label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {colors.length === 0 ? (
                        <p className="text-sm text-slate-400">No colors. Add in Settings.</p>
                      ) : (
                        colors.map(c => (
                          <div key={c.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedColors.some(i => i.id === c.id)}
                              onCheckedChange={() => toggleSelection(c, selectedColors, setSelectedColors)}
                            />
                            {c.hex_code && (
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: c.hex_code }}
                              />
                            )}
                            <span className="text-sm">{c.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-slate-500" /> Sizes
                    </Label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {sizes.length === 0 ? (
                        <p className="text-sm text-slate-400">No sizes. Add in Settings.</p>
                      ) : (
                        sizes.map(s => (
                          <div key={s.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedSizes.some(i => i.id === s.id)}
                              onCheckedChange={() => toggleSelection(s, selectedSizes, setSelectedSizes)}
                            />
                            <span className="text-sm">{s.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addProducts}
                  disabled={selectedSeries.length === 0 || selectedColors.length === 0 || selectedSizes.length === 0}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" /> 
                  Add Selected Combinations ({selectedSeries.length * selectedColors.length * selectedSizes.length})
                </Button>
              </div>

              {/* Selected Products */}
              <div className="space-y-2">
                <Label>Products in this Batch ({selectedProducts.length})</Label>
                {selectedProducts.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-400">
                    No products added yet. Select series, colors, and sizes above.
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                    {selectedProducts.map((product, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {product.color_hex && (
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: product.color_hex }}
                            />
                          )}
                          <span className="text-sm">
                            <strong>{product.series_name}</strong> - {product.color_name} - {product.size_name}
                          </span>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeProduct(index)}
                          className="h-6 w-6"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Any special instructions for this batch..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending || selectedProducts.length === 0}
                className="w-full py-6 text-lg bg-slate-800 hover:bg-slate-700"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 mr-2" /> Create Batch
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}