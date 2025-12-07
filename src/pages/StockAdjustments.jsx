import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Loader2, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminOnly } from "../components/admin/AdminGuard";
import { format } from "date-fns";

export default function StockAdjustments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: () => base44.entities.StockMovement.list("-created_date", 100)
  });

  const { data: skus = [] } = useQuery({
    queryKey: ["skus-for-adjustments"],
    queryFn: () => base44.entities.SKU.filter({ is_active: true })
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => base44.entities.Warehouse.filter({ is_active: true })
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: async ({ adjustmentData, user }) => {
      // Create stock movement record
      await base44.entities.StockMovement.create({
        ...adjustmentData,
        performed_by: user.id,
        performed_by_name: user.full_name
      });

      // Update SKU stock
      if (adjustmentData.movement_type === "adjustment" || adjustmentData.movement_type === "stock_in") {
        const sku = skus.find(s => s.id === adjustmentData.sku_id);
        if (sku) {
          await base44.entities.SKU.update(sku.id, {
            current_stock: (sku.current_stock || 0) + adjustmentData.quantity
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["skus-for-adjustments"] });
      setDialogOpen(false);
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: async ({ transferData, user }) => {
      // Find SKUs in both warehouses
      const fromSKU = skus.find(s => s.id === transferData.sku_id && s.warehouse_id === transferData.from_warehouse_id);
      const toSKU = skus.find(s => s.sku_code === fromSKU?.sku_code && s.warehouse_id === transferData.to_warehouse_id);

      if (!fromSKU) {
        throw new Error("SKU not found in source warehouse");
      }

      // Reduce stock in from warehouse
      await base44.entities.SKU.update(fromSKU.id, {
        current_stock: (fromSKU.current_stock || 0) - transferData.quantity
      });

      // Increase stock in to warehouse (create if doesn't exist)
      if (toSKU) {
        await base44.entities.SKU.update(toSKU.id, {
          current_stock: (toSKU.current_stock || 0) + transferData.quantity
        });
      } else {
        await base44.entities.SKU.create({
          ...fromSKU,
          warehouse_id: transferData.to_warehouse_id,
          warehouse_name: transferData.to_warehouse_name,
          current_stock: transferData.quantity
        });
      }

      // Log movement
      await base44.entities.StockMovement.create({
        ...transferData,
        performed_by: user.id,
        performed_by_name: user.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["skus-for-adjustments"] });
      setDialogOpen(false);
    }
  });

  const filteredMovements = movements.filter(m => {
    if (activeTab === "all") return true;
    return m.movement_type === activeTab;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Stock Adjustments</h1>
            <p className="text-slate-500 mt-1">Manage stock movements, transfers, and adjustments</p>
          </div>
          <AdminOnly>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-800 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2" /> New Adjustment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Stock Adjustment</DialogTitle>
                </DialogHeader>
                <AdjustmentForm
                  skus={skus}
                  warehouses={warehouses}
                  onSubmit={(data, user) => {
                    if (data.movement_type === "transfer") {
                      createTransferMutation.mutate({ transferData: data, user });
                    } else {
                      createAdjustmentMutation.mutate({ adjustmentData: data, user });
                    }
                  }}
                  isLoading={createAdjustmentMutation.isPending || createTransferMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </AdminOnly>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Total Movements</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{movements.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Stock In</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {movements.filter(m => m.quantity > 0 && m.movement_type !== "transfer").reduce((sum, m) => sum + m.quantity, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Stock Out</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {Math.abs(movements.filter(m => m.quantity < 0 && m.movement_type !== "transfer").reduce((sum, m) => sum + m.quantity, 0))}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Transfers</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {movements.filter(m => m.movement_type === "transfer").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="stock_in">Stock In</TabsTrigger>
            <TabsTrigger value="stock_out">Stock Out</TabsTrigger>
            <TabsTrigger value="transfer">Transfers</TabsTrigger>
            <TabsTrigger value="adjustment">Adjustments</TabsTrigger>
            <TabsTrigger value="loss">Losses</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredMovements.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600">No movements found</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredMovements.map(movement => (
                  <MovementCard key={movement.id} movement={movement} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MovementCard({ movement }) {
  const typeColors = {
    stock_in: "bg-green-100 text-green-700",
    stock_out: "bg-red-100 text-red-700",
    transfer: "bg-blue-100 text-blue-700",
    adjustment: "bg-amber-100 text-amber-700",
    loss: "bg-red-100 text-red-700"
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={typeColors[movement.movement_type]}>
                {movement.movement_type.replace("_", " ")}
              </Badge>
              <h3 className="font-semibold text-slate-800">{movement.product_name}</h3>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><strong>SKU:</strong> {movement.sku_code}</p>
              <p><strong>Quantity:</strong> {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</p>
              {movement.movement_type === "transfer" ? (
                <p><strong>Transfer:</strong> {movement.from_warehouse_name} → {movement.to_warehouse_name}</p>
              ) : (
                <p><strong>Warehouse:</strong> {movement.warehouse_name}</p>
              )}
              {movement.reference_type && (
                <p><strong>Reference:</strong> {movement.reference_type}</p>
              )}
              {movement.notes && <p className="text-slate-500 italic">{movement.notes}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {movement.quantity > 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
            <p className="text-xs text-slate-400">
              {format(new Date(movement.created_date), "MMM d, HH:mm")}
            </p>
            {movement.performed_by_name && (
              <p className="text-xs text-slate-500">by {movement.performed_by_name}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdjustmentForm({ skus, warehouses, onSubmit, isLoading }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    movement_type: "adjustment",
    sku_id: "",
    quantity: 0,
    warehouse_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    notes: ""
  });

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedSKU = skus.find(s => s.id === formData.sku_id);
    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouse_id);
    const fromWarehouse = warehouses.find(w => w.id === formData.from_warehouse_id);
    const toWarehouse = warehouses.find(w => w.id === formData.to_warehouse_id);

    const data = {
      ...formData,
      sku_code: selectedSKU?.sku_code || "",
      product_name: selectedSKU?.product_name || "",
      quantity: parseInt(formData.quantity),
      warehouse_name: selectedWarehouse?.name || "",
      from_warehouse_name: fromWarehouse?.name || "",
      to_warehouse_name: toWarehouse?.name || ""
    };

    onSubmit(data, user);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Movement Type *</Label>
        <Select value={formData.movement_type} onValueChange={(v) => setFormData({ ...formData, movement_type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stock_in">Stock In</SelectItem>
            <SelectItem value="stock_out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="loss">Loss/Damage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>SKU *</Label>
        <Select value={formData.sku_id} onValueChange={(v) => setFormData({ ...formData, sku_id: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select SKU" />
          </SelectTrigger>
          <SelectContent>
            {skus.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.sku_code} - {s.product_name} ({s.current_stock} in stock)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.movement_type === "transfer" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From Warehouse *</Label>
            <Select value={formData.from_warehouse_id} onValueChange={(v) => setFormData({ ...formData, from_warehouse_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To Warehouse *</Label>
            <Select value={formData.to_warehouse_id} onValueChange={(v) => setFormData({ ...formData, to_warehouse_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Warehouse *</Label>
          <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({ ...formData, warehouse_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Quantity *</Label>
        <Input
          type="number"
          required
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          placeholder={formData.movement_type === "stock_out" || formData.movement_type === "loss" ? "Negative for reduction" : "Positive for increase"}
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Reason for adjustment..."
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Submit Adjustment"}
      </Button>
    </form>
  );
}