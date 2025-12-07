import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Loader2, Edit2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminOnly } from "../components/admin/AdminGuard";

export default function Warehouses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const queryClient = useQueryClient();

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses-list"],
    queryFn: () => base44.entities.Warehouse.list("-created_date")
  });

  const { data: skus = [] } = useQuery({
    queryKey: ["skus-by-warehouse"],
    queryFn: () => base44.entities.SKU.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Warehouse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses-list"] });
      setDialogOpen(false);
      setEditingWarehouse(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Warehouse.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses-list"] });
      setDialogOpen(false);
      setEditingWarehouse(null);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Warehouses</h1>
            <p className="text-slate-500 mt-1">Manage warehouse locations and details</p>
          </div>
          <AdminOnly>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setEditingWarehouse(null)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Warehouse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
                </DialogHeader>
                <WarehouseForm
                  warehouse={editingWarehouse}
                  onSubmit={(data) => {
                    if (editingWarehouse) {
                      updateMutation.mutate({ id: editingWarehouse.id, data });
                    } else {
                      createMutation.mutate(data);
                    }
                  }}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </AdminOnly>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Total Warehouses</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{warehouses.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {warehouses.filter(w => w.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Total SKUs</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{skus.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : warehouses.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">No warehouses found</h3>
              <p className="text-slate-400 mt-1">Create your first warehouse to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {warehouses.map(warehouse => {
              const warehouseSKUs = skus.filter(s => s.warehouse_id === warehouse.id);
              const totalStock = warehouseSKUs.reduce((sum, s) => sum + (s.current_stock || 0), 0);
              
              return (
                <Card key={warehouse.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-slate-800">{warehouse.name}</h3>
                          {warehouse.is_active ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700">Inactive</Badge>
                          )}
                        </div>
                        {warehouse.code && (
                          <p className="text-sm text-slate-500">Code: {warehouse.code}</p>
                        )}
                      </div>
                      <AdminOnly>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWarehouse(warehouse);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </AdminOnly>
                    </div>

                    {warehouse.address && (
                      <div className="flex gap-2 text-sm text-slate-600 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>{warehouse.address}</p>
                      </div>
                    )}

                    {(warehouse.contact_person || warehouse.contact_phone) && (
                      <div className="space-y-1 text-sm text-slate-600 mb-4">
                        {warehouse.contact_person && (
                          <p><strong>Contact:</strong> {warehouse.contact_person}</p>
                        )}
                        {warehouse.contact_phone && (
                          <p><strong>Phone:</strong> {warehouse.contact_phone}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-6 pt-4 border-t">
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{warehouseSKUs.length}</p>
                        <p className="text-xs text-slate-500">SKUs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{totalStock}</p>
                        <p className="text-xs text-slate-500">Total Units</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WarehouseForm({ warehouse, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(warehouse || {
    name: "",
    code: "",
    address: "",
    contact_person: "",
    contact_phone: "",
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Warehouse Name *</Label>
        <Input
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Code</Label>
        <Input
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g. WH001"
        />
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full address..."
        />
      </div>

      <div className="space-y-2">
        <Label>Contact Person</Label>
        <Input
          value={formData.contact_person}
          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Contact Phone</Label>
        <Input
          type="tel"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : warehouse ? "Update Warehouse" : "Create Warehouse"}
      </Button>
    </form>
  );
}