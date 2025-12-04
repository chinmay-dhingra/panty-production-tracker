import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function NewBatch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: batches = [] } = useQuery({
    queryKey: ["batches"],
    queryFn: () => base44.entities.Batch.list("-created_date")
  });

  // Generate auto batch number
  const generateBatchNumber = () => {
    const today = format(new Date(), "yyyyMMdd");
    const todayBatches = batches.filter(b => b.batch_number?.startsWith(`BTH-${today}`));
    const nextNumber = todayBatches.length + 1;
    return `BTH-${today}-${String(nextNumber).padStart(3, "0")}`;
  };

  const [formData, setFormData] = useState({
    total_pieces: "",
    notes: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Batch.create(data),
    onSuccess: (newBatch) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      navigate(createPageUrl(`BatchDetails?id=${newBatch.id}`));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.total_pieces || parseInt(formData.total_pieces) <= 0) {
      alert("Please enter a valid number of pieces");
      return;
    }

    createMutation.mutate({
      batch_number: generateBatchNumber(),
      total_pieces: parseInt(formData.total_pieces),
      current_stage: "counting",
      status: "in_progress",
      notes: formData.notes
    });
  };

  const batchNumber = generateBatchNumber();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
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
                <p className="text-slate-300 text-sm font-normal mt-1">Start tracking a new production batch</p>
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
                <p className="text-xs text-slate-500 mt-1">
                  Format: BTH-YYYYMMDD-XXX
                </p>
              </div>

              {/* Total Pieces */}
              <div className="space-y-2">
                <Label htmlFor="total_pieces" className="text-slate-700 font-medium">
                  Total Pieces in Batch *
                </Label>
                <Input
                  id="total_pieces"
                  type="number"
                  min="1"
                  placeholder="Enter number of panties"
                  value={formData.total_pieces}
                  onChange={(e) => setFormData({ ...formData, total_pieces: e.target.value })}
                  className="text-lg py-6"
                  required
                />
                <p className="text-xs text-slate-500">
                  This is the total count of individual panties in this batch
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-700 font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes for this batch..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-24"
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-6 text-lg bg-slate-800 hover:bg-slate-700"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 mr-2" /> Create Batch & Start Counting
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