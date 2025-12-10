import { useState } from "react";
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
import { AdminOnly } from "../admin/AdminGuard";

const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing"
};

export default function EditStageRecord({ record, workers, onUpdate, onDelete, isLoading }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    stage: record.stage || "",
    qc_pass: record.qc_pass || 0,
    qc_fail: record.qc_fail || 0,
    alteration: record.alteration || 0,
    defect_reason: record.defect_reason || "",
    completed_by: record.completed_by || "",
    notes: record.notes || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const worker = workers.find(w => w.id === formData.completed_by);
    onUpdate(record.id, {
      stage: formData.stage,
      qc_pass: parseInt(formData.qc_pass) || 0,
      qc_fail: parseInt(formData.qc_fail) || 0,
      alteration: parseInt(formData.alteration) || 0,
      defect_reason: formData.defect_reason,
      completed_by: formData.completed_by,
      completed_by_name: worker?.name || record.completed_by_name,
      notes: formData.notes
    });
    setOpen(false);
  };

  return (
    <AdminOnly>
      <div className="flex gap-1">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Pencil className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
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

              {(formData.qc_fail > 0 || formData.alteration > 0) && (
                <div>
                  <Label>Defect Reason</Label>
                  <Select
                    value={formData.defect_reason}
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

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
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
          onClick={() => {
            if (window.confirm(`Delete this record? ID: ${record.id.slice(0, 8)}`)) {
              onDelete(record.id);
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </Button>
      </div>
    </AdminOnly>
  );
}