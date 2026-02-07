import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Loader2, Trash2 } from "lucide-react";

const PACK_TYPES = [
  { value: "single", label: "Single Pack" },
  { value: "2_pack", label: "2 Pack" },
  { value: "3_pack", label: "3 Pack" },
  { value: "4_pack", label: "4 Pack" },
  { value: "6_pack", label: "6 Pack" },
  { value: "8_pack", label: "8 Pack" }
];

export default function EditPackagingSKU({ sku, workers, sizes, onUpdate, onDelete, isLoading }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku_code: sku.sku_code || "",
    size_id: sku.size_id || "",
    pack_type: sku.pack_type || "",
    quantity: sku.quantity || 0,
    packed_by: sku.packed_by || ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await base44.auth.me();
    const worker = workers.find(w => w.id === formData.packed_by);
    const size = sizes.find(s => s.id === formData.size_id);
    
    const newData = {
      sku_code: formData.sku_code,
      size_id: formData.size_id,
      size_name: size?.name || sku.size_name,
      pack_type: formData.pack_type,
      quantity: parseInt(formData.quantity),
      packed_by: formData.packed_by,
      packed_by_name: worker?.name || ""
    };
    
    // Log the change
    const changedFields = Object.keys(newData).filter(key => 
      JSON.stringify(newData[key]) !== JSON.stringify(sku[key])
    );
    
    if (changedFields.length > 0) {
      await base44.entities.AuditLog.create({
        action: "update",
        entity_type: "PackagingSKU",
        entity_id: sku.id,
        entity_name: `SKU: ${formData.sku_code}`,
        old_data: sku,
        new_data: newData,
        changed_fields: changedFields,
        user_email: user.email,
        user_name: user.full_name,
        batch_id: sku.batch_id,
        batch_number: sku.batch_number
      });
    }
    
    onUpdate(sku.id, newData);
    setOpen(false);
  };

  const handleDelete = async () => {
    const user = await base44.auth.me();
    
    // Log the deletion
    await base44.entities.AuditLog.create({
      action: "delete",
      entity_type: "PackagingSKU",
      entity_id: sku.id,
      entity_name: `SKU: ${sku.sku_code}`,
      old_data: sku,
      new_data: {},
      changed_fields: ["deleted"],
      user_email: user.email,
      user_name: user.full_name,
      batch_id: sku.batch_id,
      batch_number: sku.batch_number
    });
    
    onDelete(sku.id);
  };

  return (
    <div className="flex gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Packaging Entry</DialogTitle>
            <DialogDescription>Update the packaging SKU details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>SKU Code</Label>
              <Input
                value={formData.sku_code}
                onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
                placeholder="e.g., SBP09_M"
              />
            </div>

            <div className="space-y-2">
              <Label>SKU Size</Label>
              <Select
                value={formData.size_id}
                onValueChange={(value) => setFormData({ ...formData, size_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pack Type</Label>
              <Select
                value={formData.pack_type}
                onValueChange={(value) => setFormData({ ...formData, pack_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PACK_TYPES.map((pack) => (
                    <SelectItem key={pack.value} value={pack.value}>
                      {pack.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity (Bundles)</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                onWheel={(e) => e.target.blur()}
              />
            </div>

            <div className="space-y-2">
              <Label>Packed By</Label>
              <Select
                value={formData.packed_by}
                onValueChange={(value) => setFormData({ ...formData, packed_by: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Packaging Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the packaging entry for SKU "{sku.sku_code}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}