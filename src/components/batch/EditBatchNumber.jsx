import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminOnly } from "../admin/AdminGuard";

export default function EditBatchNumber({ currentNumber, onUpdate, isLoading }) {
  const [open, setOpen] = useState(false);
  const [newNumber, setNewNumber] = useState(currentNumber);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newNumber && newNumber !== currentNumber) {
      onUpdate(newNumber);
      setOpen(false);
    }
  };

  return (
    <AdminOnly>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Batch Number
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch Number</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Batch Number</Label>
              <Input
                type="text"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="Enter new batch number"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !newNumber || newNumber === currentNumber}
                className="bg-slate-800 hover:bg-slate-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Number"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminOnly>
  );
}