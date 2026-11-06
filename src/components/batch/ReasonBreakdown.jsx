import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

export const QC_FAIL_REASONS = [
  { value: "stitching_error", label: "Stitching Error" },
  { value: "fabric_defect", label: "Fabric Defect" },
  { value: "color_issue", label: "Color Issue" },
  { value: "size_mismatch", label: "Size Mismatch" },
  { value: "stain", label: "Stain / Dirt" },
  { value: "oil_stain", label: "Oil Stain" },
  { value: "tear", label: "Tear / Hole" },
  { value: "elastic_issue", label: "Elastic Issue" },
  { value: "print_defect", label: "Print Defect" },
  { value: "measurement_issue", label: "Measurement Issue" },
  { value: "other", label: "Other" }
];

export const ALTERATION_REASONS = [
  { value: "stitching_issue", label: "Stitching Issue" },
  { value: "fabric_issue", label: "Fabric Issue" },
  { value: "loose_thread", label: "Loose Thread" },
  { value: "stain", label: "Stain" },
  { value: "oil_stain", label: "Oil Stain" },
  { value: "size_issue", label: "Size Issue" },
  { value: "elastic_issue", label: "Elastic Issue" },
  { value: "trim_issue", label: "Trim / Lace Issue" },
  { value: "other", label: "Other" }
];

export const reasonLabel = (value, options) =>
  options.find(o => o.value === value)?.label || (value ? value.replace(/_/g, " ") : "");

export const rowsTotal = (rows = []) =>
  rows.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0);

export const rowsComplete = (rows = []) =>
  rows.length > 0 && rows.every(r => r.reason && (parseInt(r.count) || 0) > 0);

const tones = {
  red: {
    wrap: "bg-red-50 border-red-200",
    title: "text-red-800",
    hint: "text-red-600",
    add: "border-red-300 text-red-700 hover:bg-red-100"
  },
  amber: {
    wrap: "bg-amber-50 border-amber-200",
    title: "text-amber-800",
    hint: "text-amber-600",
    add: "border-amber-300 text-amber-700 hover:bg-amber-100"
  }
};

export default function ReasonBreakdown({ title, total, rows = [], onChange, options, tone = "red" }) {
  const style = tones[tone] || tones.red;
  const allocated = rowsTotal(rows);
  const remaining = total - allocated;

  const updateRow = (index, patch) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const addRow = () => onChange([...rows, { reason: "", count: "" }]);
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));

  if (!total || total <= 0) return null;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${style.wrap}`}>
      <div className="flex items-center justify-between gap-2">
        <Label className={`text-sm font-semibold ${style.title}`}>{title}</Label>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            remaining === 0 ? "bg-emerald-600 text-white" : "bg-white/80 text-slate-700"
          }`}
        >
          {allocated} / {total} allocated
        </span>
      </div>

      {rows.length === 0 && (
        <p className={`text-xs ${style.hint}`}>
          Add a reason to break down the {total} piece{total > 1 ? "s" : ""}.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={row.reason}
              onValueChange={(value) => updateRow(index, { reason: value })}
            >
              <SelectTrigger className="flex-1 bg-white">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              max={total}
              placeholder="0"
              value={row.count}
              onChange={(e) => updateRow(index, { count: e.target.value })}
              onWheel={(e) => e.target.blur()}
              className="w-20 bg-white"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:text-red-600"
              onClick={() => removeRow(index)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={`bg-white ${style.add}`}
          onClick={addRow}
          disabled={remaining <= 0 && rows.length > 0}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add reason
        </Button>

        {remaining === 0 ? (
          <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fully allocated
          </span>
        ) : remaining > 0 ? (
          <span className={`text-xs font-medium flex items-center gap-1 ${style.hint}`}>
            <AlertCircle className="w-3.5 h-3.5" /> {remaining} left to allocate
          </span>
        ) : (
          <span className="text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {Math.abs(remaining)} over the total
          </span>
        )}
      </div>
    </div>
  );
}