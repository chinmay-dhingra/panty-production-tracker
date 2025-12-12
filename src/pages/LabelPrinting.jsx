import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Settings, Loader2, Package } from "lucide-react";
import LabelDesigner from "../components/labels/LabelDesigner";
import LabelPreview from "../components/labels/LabelPreview";
import LabelPresets from "../components/labels/LabelPresets";

export default function LabelPrinting() {
  const [selectedSKU, setSelectedSKU] = useState(null);
  const [labelConfig, setLabelConfig] = useState({
    width: 50, // mm
    height: 25, // mm
    mrp: "",
    logo: null,
    fontSize: 8,
    showBorder: true,
    preset: "standard"
  });

  const { data: skus = [], isLoading } = useQuery({
    queryKey: ["allSKUs"],
    queryFn: () => base44.entities.PackagingSKU.list("-created_date")
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["batches"],
    queryFn: () => base44.entities.Batch.list()
  });

  // Group SKUs by SKU code for selection
  const uniqueSKUs = {};
  skus.forEach(sku => {
    if (!uniqueSKUs[sku.sku_code]) {
      uniqueSKUs[sku.sku_code] = {
        sku_code: sku.sku_code,
        size_name: sku.size_name,
        pack_type: sku.pack_type,
        batch_number: sku.batch_number,
        series_name: sku.series_name,
        color_name: sku.color_name,
        total_quantity: 0
      };
    }
    uniqueSKUs[sku.sku_code].total_quantity += sku.quantity || 0;
  });

  const skuList = Object.values(uniqueSKUs);

  const handlePrint = () => {
    window.print();
  };

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Label Printing</h1>
          <p className="text-slate-500 mt-1">Design and print product labels with Data Matrix codes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* SKU Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Select SKU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {skuList.map((sku, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSKU(sku)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSKU?.sku_code === sku.sku_code
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-bold text-slate-900">{sku.sku_code}</p>
                      <p className="text-xs text-slate-600">
                        {sku.pack_type?.replace('_', ' ')} • Size: {sku.size_name}
                      </p>
                      <p className="text-xs text-slate-500">Batch: {sku.batch_number}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Label Designer */}
            <Tabs defaultValue="config" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config">
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="config">
                <LabelDesigner 
                  config={labelConfig}
                  onChange={setLabelConfig}
                />
              </TabsContent>
              
              <TabsContent value="presets">
                <LabelPresets 
                  onSelectPreset={(preset) => setLabelConfig({ ...labelConfig, ...preset })}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Label Preview</CardTitle>
                  <Button
                    onClick={handlePrint}
                    disabled={!selectedSKU}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Label
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedSKU ? (
                  <LabelPreview
                    sku={selectedSKU}
                    config={labelConfig}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    Select a SKU to preview label
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}