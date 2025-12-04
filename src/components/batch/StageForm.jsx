import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Wrench, Loader2 } from "lucide-react";

const stageLabels = {
  counting: "Counting",
  cleaning: "Cleaning",
  stamping: "Stamping",
  ironing: "Ironing",
  packaging: "Packaging"
};

export default function StageForm({ stage, workers, onSubmit, isLoading, availablePieces }) {
  const [formData, setFormData] = useState({
    qc_pass: "",
    qc_fail: "",
    alteration: "",
    completed_by: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const total = (parseInt(formData.qc_pass) || 0) + 
                  (parseInt(formData.qc_fail) || 0) + 
                  (parseInt(formData.alteration) || 0);
    
    if (total > availablePieces) {
      alert(`Total (${total}) cannot exceed available pieces (${availablePieces})`);
      return;
    }
    
    const worker = workers.find(w => w.id === formData.completed_by);
    onSubmit({
      ...formData,
      qc_pass: parseInt(formData.qc_pass) || 0,
      qc_fail: parseInt(formData.qc_fail) || 0,
      alteration: parseInt(formData.alteration) || 0,
      completed_by_name: worker?.name || ""
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
            {Object.keys(stageLabels).indexOf(stage) + 1}
          </span>
          {stageLabels[stage]} Stage
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">
              Available Pieces: <span className="text-xl font-bold">{availablePieces}</span>
            </p>
          </div>

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
            disabled={isLoading || !formData.completed_by}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              "Complete Stage"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}