import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2, Trash2 } from "lucide-react";
import ReasonBreakdown, {
  ALTERATION_REASONS,
  QC_FAIL_REASONS,
  reasonLabel,
  rowsTotal,
  rowsComplete
} from "@/components/batch/ReasonBreakdown";

const seedRows = (rows, total, legacyReason) => {
  if (rows && rows.length > 0) {
    return rows.map(r => ({ reason: r.reason || "", count: String(r.count ?? "") }));
  }
  if (total > 0) {
    return [{ reason: legacyReason || "", count: String(total) }];
  }
  return [];
};

export default function EditStageRecord({ record, workers, onUpdate, onDelete, isLoading }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    stage: record.stage || "",
    qc_pass: record.qc_pass || 0,
    qc_fail: record.qc_fail || 0,
    alteration: record.alteration || 0,
    completed_by: record.completed_by || "",
    notes: record.notes || ""
  });
  const [alterationRows, setAlterationRows] = useState([]);
  const [failRows, setFailRows] = useState([]);

  const resetForm = () => {
    setFormData({
      stage: record.stage || "",
      qc_pass: record.qc_pass || 0,
      qc_fail: record.qc_fail || 0,
      alteration: record.alteration || 0,
      completed_by: record.completed_by || "",
      notes: record.notes || ""
    });
    setAlterationRows(
      seedRows(record.alteration_reasons, record.alteration || 0, record.defect_reason)
    );
    setFailRows(seedRows(record.qc_fail_reasons, record.qc_fail || 0, record.defect_reason));
  };

  const failTotal = parseInt(formData.qc_fail) || 0;
  const alterationTotal = parseInt(formData.alteration) || 0;

  const cleanRows = (rows) =>
    rows
      .filter(r => r.reason && (parseInt(r.count) || 0) > 0)
      .map(r => ({ reason: r.reason, count: parseInt(r.count) }));

  const failsDone = failTotal === 0 || (rowsTotal(failRows) === failTotal && rowsComplete(failRows));
  const alterationsDone =
    alterationTotal === 0 || (rowsTotal(alterationRows) === alterationTotal && rowsComplete(alterationRows));

  const buildSummary = () => {
    const parts = [
      ...cleanRows(alterationRows).map(
        r => `Alteration: ${reasonLabel(r.reason, ALTERATION_REASONS)} x${r.count}`
      ),
      ...cleanRows(failRows).map(r => `Fail: ${reasonLabel(r.reason, QC_FAIL_REASONS)} x${r.count}`)
    ];
    return parts.join("; ") || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!failsDone || !alterationsDone) return;

    const user = await base44.auth.me();
    const worker = workers.find(w => w.id === formData.completed_by);

    const newData = {
      stage: formData.stage,
      qc_pass: parseInt(formData.qc_pass) || 0,
      qc_fail: failTotal,
      alteration: alterationTotal,
      qc_fail_reasons: cleanRows(failRows),
      alteration_reasons: cleanRows(alterationRows),
      defect_reason: buildSummary(),
      completed_by: formData.completed_by,
      completed_by_name: worker?.name || record.completed_by_name,
      notes: formData.notes
    };

    // Log the change
    const changedFields = Object.keys(newData).filter(
      key => JSON.stringify(newData[key]) !== JSON.stringify(record[key])
    );

    if (changedFields.length > 0) {
      await base44.entities.AuditLog.create({
        action: "update",
        entity_type: "StageRecord",
        entity_id: record.id,
        entity_name: `${record.stage} - ${record.series_name} ${record.color_name} ${record.size_name}`,
        old_data: record,
        new_data: newData,
        changed_fields: changedFields,
        user_email: user.email,
        user_name: user.full_name,
        batch_id: record.batch_id,
        batch_number: record.batch_number
      });
    }

    onUpdate(record.id, newData);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this record? ID: ${record.id.slice(0, 8)}`)) return;

    const user = await base44.auth.me();

    // Log the deletion
    await base44.entities.AuditLog.create({
      action: "delete",
      entity_type: "StageRecord",
      entity_id: record.id,
      entity_name: `${record.stage} - ${record.series_name} ${record.color_name} ${record.size_name}`,
      old_data: record,
      new_data: {},
      changed_fields: ["deleted"],
      user_email: user.email,
      user_name: user.full_name,
      batch_id: record.batch_id,
      batch_number: record.batch_number
    });

    onDelete(record.id);
  };

  return (
    <div className="flex gap-1">
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (value) resetForm();
          setOpen(value);
        }}
      >
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7">
            <Pencil className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <p className="text-xs text-slate-500">ID: {record.id}</p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counting">Counting</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="stamping">Stamping</SelectItem>
                  <SelectItem value="ironing">Ironing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Pass</Label>
                <Input
                  type="number"
                  value={formData.qc_pass}
                  onChange={(e) => setFormData({ ...formData, qc_pass: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
              <div>
                <Label className="text-xs">Fail</Label>
                <Input
                  type="number"
                  value={formData.qc_fail}
                  onChange={(e) => setFormData({ ...formData, qc_fail: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
              <div>
                <Label className="text-xs">Alteration</Label>
                <Input
                  type="number"
                  value={formData.alteration}
                  onChange={(e) => setFormData({ ...formData, alteration: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
            </div>

            <ReasonBreakdown
              title="Alteration reasons"
              total={alterationTotal}
              rows={alterationRows}
              onChange={setAlterationRows}
              options={ALTERATION_REASONS}
              tone="amber"
            />

            <ReasonBreakdown
              title="QC fail reasons"
              total={failTotal}
              rows={failRows}
              onChange={setFailRows}
              options={QC_FAIL_REASONS}
              tone="red"
            />

            <div>
              <Label>Worker</Label>
              <Select
                value={formData.completed_by}
                onValueChange={(value) => setFormData({ ...formData, completed_by: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {(!failsDone || !alterationsDone) && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Allocate every QC failed and altered piece to a reason before saving.
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !failsDone || !alterationsDone}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Record
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      </Button>
    </div>
  );
}