import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Wrench, Loader2, Layers, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging"
};

export default function StageForm({ stage, workers, products, onSubmit, isLoading }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    selected_product: "",
    qc_pass: "",
    qc_fail: "",
    alteration: "",
    defect_reason: "",
    completed_by: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    const selectedProduct = products.find(p => 
      `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}` === formData.selected_product
    );

    if (!selectedProduct) return;

    const worker = workers.find(w => w.id === formData.completed_by);
    
    onSubmit({
      series_id: selectedProduct.series_id,
      series_name: selectedProduct.series_name,
      color_id: selectedProduct.color_id,
      color_name: selectedProduct.color_name,
      size_id: selectedProduct.size_id,
      size_name: selectedProduct.size_name,
      material_id: selectedProduct.material_id || "",
      material_name: selectedProduct.material_name || "",
      style_id: selectedProduct.style_id || "",
      style_name: selectedProduct.style_name || "",
      qc_pass: parseInt(formData.qc_pass) || 0,
      qc_fail: parseInt(formData.qc_fail) || 0,
      alteration: parseInt(formData.alteration) || 0,
      defect_reason: formData.defect_reason || null,
      completed_by: formData.completed_by,
      completed_by_name: worker?.name || "",
      notes: formData.notes
    });

    // Reset form
    setFormData({
      selected_product: "",
      qc_pass: "",
      qc_fail: "",
      alteration: "",
      defect_reason: "",
      completed_by: "",
      notes: ""
    });
    setShowConfirm(false);
  };

  const getProductDisplay = () => {
    const product = products.find(p => 
      `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}` === formData.selected_product
    );
    if (!product) return "";
    return `${product.series_name} - ${product.color_name} - ${product.size_name}${product.material_name ? ` - ${product.material_name}` : ''}${product.style_name ? ` - ${product.style_name}` : ''}`;
  };

  const getWorkerDisplay = () => {
    const worker = workers.find(w => w.id === formData.completed_by);
    return worker ? worker.name : "";
  };

  const totalPcs = (parseInt(formData.qc_pass) || 0) + 
                   (parseInt(formData.qc_fail) || 0) + 
                   (parseInt(formData.alteration) || 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
            {Object.keys(stageLabels).indexOf(stage) + 1}
          </span>
          Add {stageLabels[stage]} Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection - Single dropdown with exact combinations */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Layers className="w-3 h-3" /> Select Product
            </Label>
            <Select
              value={formData.selected_product}
              onValueChange={(value) => setFormData({ ...formData, selected_product: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product combination" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => {
                  const key = `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}`;
                  return (
                    <SelectItem 
                      key={key} 
                      value={key}
                    >
                      {p.series_name} - {p.color_name} - {p.size_name}
                      {p.material_name && ` - ${p.material_name}`}
                      {p.style_name && ` - ${p.style_name}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* QC Counts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-4 h-4" /> QC Pass
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.qc_pass}
                onChange={(e) => setFormData({ ...formData, qc_pass: e.target.value })}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-red-700">
                <XCircle className="w-4 h-4" /> QC Fail
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.qc_fail}
                onChange={(e) => setFormData({ ...formData, qc_fail: e.target.value })}
                className="border-red-200 focus:border-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-amber-700">
                <Wrench className="w-4 h-4" /> Alteration
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.alteration}
                onChange={(e) => setFormData({ ...formData, alteration: e.target.value })}
                className="border-amber-200 focus:border-amber-500"
              />
            </div>
          </div>

          {totalPcs > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <span className="text-blue-700 font-medium">Total Pieces: {totalPcs}</span>
            </div>
          )}

          {/* Worker */}
          <div className="space-y-2">
            <Label>Completed By</Label>
            <Select
              value={formData.completed_by}
              onValueChange={(value) => setFormData({ ...formData, completed_by: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name} {worker.employee_id && `(${worker.employee_id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Defect Reason */}
          {(parseInt(formData.qc_fail) > 0 || parseInt(formData.alteration) > 0) && (
            <div className="space-y-2">
              <Label>Defect Reason</Label>
              <Select
                value={formData.defect_reason || ""}
                onValueChange={(value) => setFormData({ ...formData, defect_reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stitching_error">Stitching Error</SelectItem>
                  <SelectItem value="fabric_defect">Fabric Defect</SelectItem>
                  <SelectItem value="color_issue">Color Issue</SelectItem>
                  <SelectItem value="size_mismatch">Size Mismatch</SelectItem>
                  <SelectItem value="stain">Stain/Dirt</SelectItem>
                  <SelectItem value="tear">Tear/Hole</SelectItem>
                  <SelectItem value="elastic_issue">Elastic Issue</SelectItem>
                  <SelectItem value="print_defect">Print Defect</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any observations or issues..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.selected_product || !formData.completed_by || totalPcs === 0}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview & Confirm
          </Button>
        </form>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm {stageLabels[stage]} Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Please review the entry details before submitting.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Product</p>
                <p className="font-medium">{getProductDisplay()}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-xs text-emerald-700 mb-1">QC Pass</p>
                  <p className="text-xl font-bold text-emerald-700">{formData.qc_pass || 0}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-700 mb-1">QC Fail</p>
                  <p className="text-xl font-bold text-red-700">{formData.qc_fail || 0}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-xs text-amber-700 mb-1">Alteration</p>
                  <p className="text-xl font-bold text-amber-700">{formData.alteration || 0}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 mb-1">Total Pieces</p>
                <p className="text-lg font-bold text-blue-700">{totalPcs}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Completed By</p>
                <p className="font-medium">{getWorkerDisplay()}</p>
              </div>
              {formData.defect_reason && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Defect Reason</p>
                  <p className="font-medium">{formData.defect_reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              )}
              {formData.notes && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Notes</p>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Confirm & Submit"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}