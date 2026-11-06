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
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import ReasonBreakdown, {
  ALTERATION_REASONS,
  QC_FAIL_REASONS,
  reasonLabel,
  rowsTotal,
  rowsComplete
} from "@/components/batch/ReasonBreakdown";

const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging"
};

const emptyForm = {
  selected_product: "",
  qc_pass: "",
  qc_fail: "",
  alteration: "",
  completed_by: "",
  notes: ""
};

export default function StageForm({ stage, workers, products, onSubmit, isLoading }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [alterationRows, setAlterationRows] = useState([]);
  const [failRows, setFailRows] = useState([]);

  const failTotal = parseInt(formData.qc_fail) || 0;
  const alterationTotal = parseInt(formData.alteration) || 0;
  const passTotal = parseInt(formData.qc_pass) || 0;
  const totalPcs = passTotal + failTotal + alterationTotal;

  const cleanRows = (rows) =>
    rows
      .filter(r => r.reason && (parseInt(r.count) || 0) > 0)
      .map(r => ({ reason: r.reason, count: parseInt(r.count) }));

  const failsDone = failTotal === 0 || (rowsTotal(failRows) === failTotal && rowsComplete(failRows));
  const alterationsDone =
    alterationTotal === 0 || (rowsTotal(alterationRows) === alterationTotal && rowsComplete(alterationRows));

  const canSubmit =
    !!formData.selected_product && !!formData.completed_by && totalPcs > 0 && failsDone && alterationsDone;

  const handleCountChange = (field, value, setRows) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if ((parseInt(value) || 0) > 0) {
      setRows(prev => (prev.length === 0 ? [{ reason: "", count: "" }] : prev));
    }
  };

  const buildSummary = () => {
    const parts = [
      ...cleanRows(alterationRows).map(
        r => `Alteration: ${reasonLabel(r.reason, ALTERATION_REASONS)} x${r.count}`
      ),
      ...cleanRows(failRows).map(r => `Fail: ${reasonLabel(r.reason, QC_FAIL_REASONS)} x${r.count}`)
    ];
    return parts.join("; ") || null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    const selectedProduct = products.find(
      p => `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}` === formData.selected_product
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
      qc_pass: passTotal,
      qc_fail: failTotal,
      alteration: alterationTotal,
      qc_fail_reasons: cleanRows(failRows),
      alteration_reasons: cleanRows(alterationRows),
      defect_reason: buildSummary(),
      completed_by: formData.completed_by,
      completed_by_name: worker?.name || "",
      notes: formData.notes
    });

    setFormData(emptyForm);
    setAlterationRows([]);
    setFailRows([]);
    setShowConfirm(false);
  };

  const getProductDisplay = () => {
    const product = products.find(
      p => `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}` === formData.selected_product
    );
    if (!product) return "";
    return `${product.series_name} - ${product.color_name} - ${product.size_name}${product.material_name ? ` - ${product.material_name}` : ''}${product.style_name ? ` - ${product.style_name}` : ''}`;
  };

  const getWorkerDisplay = () => {
    const worker = workers.find(w => w.id === formData.completed_by);
    return worker ? worker.name : "";
  };

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
          {/* Product Selection */}
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
                    <SelectItem key={key} value={key}>
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
                onWheel={(e) => e.target.blur()}
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
                onChange={(e) => handleCountChange("qc_fail", e.target.value, setFailRows)}
                onWheel={(e) => e.target.blur()}
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
                onChange={(e) => handleCountChange("alteration", e.target.value, setAlterationRows)}
                onWheel={(e) => e.target.blur()}
                className="border-amber-200 focus:border-amber-500"
              />
            </div>
          </div>

          {totalPcs > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <span className="text-blue-700 font-medium">Total Pieces: {totalPcs}</span>
            </div>
          )}

          {/* Alteration reasons */}
          <ReasonBreakdown
            title="Alteration reasons"
            total={alterationTotal}
            rows={alterationRows}
            onChange={setAlterationRows}
            options={ALTERATION_REASONS}
            tone="amber"
          />

          {/* QC fail reasons */}
          <ReasonBreakdown
            title="QC fail reasons"
            total={failTotal}
            rows={failRows}
            onChange={setFailRows}
            options={QC_FAIL_REASONS}
            tone="red"
          />

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

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any observations or issues..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {!failsDone || !alterationsDone ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Allocate every QC failed and altered piece to a reason before saving this entry.
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview & Confirm
          </Button>
        </form>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Entry</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-2">
              <div className="bg-slate-800 text-white p-2 rounded text-center">
                <p className="text-sm font-bold">{stageLabels[stage]}</p>
              </div>
              <div className="bg-slate-100 p-2 rounded">
                <p className="text-xs text-slate-600">Product</p>
                <p className="font-semibold text-sm">{getProductDisplay()}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 p-2 rounded text-center border border-emerald-200">
                  <p className="text-xs text-emerald-700">Pass</p>
                  <p className="text-lg font-bold text-emerald-700">{passTotal}</p>
                </div>
                <div className="bg-red-50 p-2 rounded text-center border border-red-200">
                  <p className="text-xs text-red-700">Fail</p>
                  <p className="text-lg font-bold text-red-700">{failTotal}</p>
                </div>
                <div className="bg-amber-50 p-2 rounded text-center border border-amber-200">
                  <p className="text-xs text-amber-700">Alt</p>
                  <p className="text-lg font-bold text-amber-700">{alterationTotal}</p>
                </div>
              </div>
              <div className="bg-blue-100 p-2 rounded text-center border border-blue-200">
                <p className="text-xs text-blue-700">Total</p>
                <p className="text-xl font-bold text-blue-700">{totalPcs} pcs</p>
              </div>

              {cleanRows(alterationRows).length > 0 && (
                <div className="bg-amber-50 p-2 rounded border border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">Alteration reasons</p>
                  {cleanRows(alterationRows).map((row, i) => (
                    <p key={i} className="text-sm text-slate-700">
                      {reasonLabel(row.reason, ALTERATION_REASONS)} — {row.count} pcs
                    </p>
                  ))}
                </div>
              )}

              {cleanRows(failRows).length > 0 && (
                <div className="bg-red-50 p-2 rounded border border-red-200">
                  <p className="text-xs text-red-700 mb-1">QC fail reasons</p>
                  {cleanRows(failRows).map((row, i) => (
                    <p key={i} className="text-sm text-slate-700">
                      {reasonLabel(row.reason, QC_FAIL_REASONS)} — {row.count} pcs
                    </p>
                  ))}
                </div>
              )}

              <div className="bg-slate-100 p-2 rounded">
                <p className="text-xs text-slate-600">Worker</p>
                <p className="font-semibold text-sm">{getWorkerDisplay()}</p>
              </div>
              {formData.notes && (
                <div className="bg-slate-100 p-2 rounded">
                  <p className="text-xs text-slate-600">Notes</p>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}
            </div>
            <AlertDialogFooter className="mt-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSubmit} disabled={isLoading} className="bg-slate-800 hover:bg-slate-700">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}