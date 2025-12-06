import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package, AlertTriangle, Search, Plus, Loader2, Edit2, Save, X 
} from "lucide-react";
import { AdminOnly } from "../components/admin/AdminGuard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list("-updated_date")
  });

  const { data: series = [] } = useQuery({
    queryKey: ["productSeries"],
    queryFn: () => base44.entities.ProductSeries.filter({ is_active: true })
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["productColors"],
    queryFn: () => base44.entities.ProductColor.filter({ is_active: true })
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["productSizes"],
    queryFn: () => base44.entities.ProductSize.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Inventory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Inventory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setEditingId(null);
    }
  });

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      stock_count: item.stock_count,
      reorder_point: item.reorder_point,
      notes: item.notes || ""
    });
  };

  const saveEdit = () => {
    updateMutation.mutate({ id: editingId, data: editForm });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      item.series_name?.toLowerCase().includes(searchLower) ||
      item.color_name?.toLowerCase().includes(searchLower) ||
      item.size_name?.toLowerCase().includes(searchLower)
    );
  });

  // Count alerts
  const lowStockCount = inventory.filter(
    item => item.reorder_point > 0 && item.stock_count <= item.reorder_point
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
            <p className="text-slate-500 mt-1">Track and manage product stock levels</p>
          </div>
          <AdminOnly>
            <AddInventoryDialog 
              series={series}
              colors={colors}
              sizes={sizes}
              onAdd={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </AdminOnly>
        </div>

        {/* Alerts */}
        {lowStockCount > 0 && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  {lowStockCount} product{lowStockCount > 1 ? 's' : ''} below reorder point
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {/* Inventory Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" />
              Stock Levels ({filteredInventory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No inventory items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Product</th>
                      <th className="text-center p-3 text-sm font-medium text-slate-600">Stock</th>
                      <th className="text-center p-3 text-sm font-medium text-slate-600">Reorder Point</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-600">Notes</th>
                      <th className="text-right p-3 text-sm font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const isEditing = editingId === item.id;
                      const isLowStock = item.reorder_point > 0 && item.stock_count <= item.reorder_point;
                      
                      return (
                        <tr key={item.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.series_name}</span>
                              <span className="text-slate-400">-</span>
                              <span>{item.color_name}</span>
                              <span className="text-slate-400">-</span>
                              <span>{item.size_name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                value={editForm.stock_count}
                                onChange={(e) => setEditForm({ ...editForm, stock_count: parseInt(e.target.value) || 0 })}
                                className="w-20 text-center"
                              />
                            ) : (
                              <span className="font-bold text-lg">{item.stock_count}</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                value={editForm.reorder_point}
                                onChange={(e) => setEditForm({ ...editForm, reorder_point: parseInt(e.target.value) || 0 })}
                                className="w-20 text-center"
                              />
                            ) : (
                              <span>{item.reorder_point}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {isLowStock ? (
                              <Badge className="bg-amber-100 text-amber-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800">In Stock</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <Input
                                type="text"
                                placeholder="Notes..."
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                className="w-full"
                              />
                            ) : (
                              <span className="text-sm text-slate-600">{item.notes || "-"}</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <AdminOnly>
                              {isEditing ? (
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    onClick={saveEdit}
                                    disabled={updateMutation.isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelEdit}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(item)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              )}
                            </AdminOnly>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddInventoryDialog({ series, colors, sizes, onAdd, isLoading }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    series_id: "",
    color_id: "",
    size_id: "",
    stock_count: "",
    reorder_point: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedSeries = series.find(s => s.id === formData.series_id);
    const selectedColor = colors.find(c => c.id === formData.color_id);
    const selectedSize = sizes.find(s => s.id === formData.size_id);

    onAdd({
      series_id: formData.series_id,
      series_name: selectedSeries?.name || "",
      color_id: formData.color_id,
      color_name: selectedColor?.name || "",
      size_id: formData.size_id,
      size_name: selectedSize?.name || "",
      stock_count: parseInt(formData.stock_count) || 0,
      reorder_point: parseInt(formData.reorder_point) || 0,
      notes: formData.notes
    });

    setFormData({
      series_id: "",
      color_id: "",
      size_id: "",
      stock_count: "",
      reorder_point: "",
      notes: ""
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-800 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Series</Label>
            <Select
              value={formData.series_id}
              onValueChange={(value) => setFormData({ ...formData, series_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select series" />
              </SelectTrigger>
              <SelectContent>
                {series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Select
              value={formData.color_id}
              onValueChange={(value) => setFormData({ ...formData, color_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {colors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Size</Label>
            <Select
              value={formData.size_id}
              onValueChange={(value) => setFormData({ ...formData, size_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Initial Stock</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock_count}
                onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Reorder Point</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              type="text"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.series_id || !formData.color_id || !formData.size_id}
              className="bg-slate-800 hover:bg-slate-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}