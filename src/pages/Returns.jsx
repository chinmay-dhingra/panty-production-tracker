import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminOnly } from "../components/admin/AdminGuard";
import { format } from "date-fns";

export default function Returns() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["returns"],
    queryFn: () => base44.entities.Return.list("-created_date")
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders-for-returns"],
    queryFn: () => base44.entities.Order.list("-created_date", 100)
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => base44.entities.Warehouse.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Return.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      setDialogOpen(false);
    }
  });

  const processReturnMutation = useMutation({
    mutationFn: async ({ returnData, user }) => {
      // Update return status
      await base44.entities.Return.update(returnData.id, {
        status: "processed",
        processed_by: user.id,
        processed_by_name: user.full_name,
        processed_at: new Date().toISOString()
      });

      // Process each item
      for (const item of returnData.items) {
        if (item.action === "restock") {
          // Find SKU and update stock
          const skuList = await base44.entities.SKU.filter({ sku_code: item.sku_code });
          if (skuList.length > 0) {
            const sku = skuList[0];
            await base44.entities.SKU.update(sku.id, {
              current_stock: (sku.current_stock || 0) + item.quantity
            });

            // Log stock movement
            await base44.entities.StockMovement.create({
              movement_type: "return",
              sku_id: sku.id,
              sku_code: sku.sku_code,
              product_name: sku.product_name,
              quantity: item.quantity,
              warehouse_id: returnData.warehouse_id,
              warehouse_name: returnData.warehouse_name,
              reference_id: returnData.id,
              reference_type: "return",
              performed_by: user.id,
              performed_by_name: user.full_name,
              notes: `Restocked from return ${returnData.return_number}`
            });
          }
        } else if (item.action === "loss") {
          // Log as loss
          const skuList = await base44.entities.SKU.filter({ sku_code: item.sku_code });
          if (skuList.length > 0) {
            const sku = skuList[0];
            await base44.entities.StockMovement.create({
              movement_type: "loss",
              sku_id: sku.id,
              sku_code: sku.sku_code,
              product_name: sku.product_name,
              quantity: -item.quantity,
              warehouse_id: returnData.warehouse_id,
              warehouse_name: returnData.warehouse_name,
              reference_id: returnData.id,
              reference_type: "return",
              performed_by: user.id,
              performed_by_name: user.full_name,
              notes: `Loss from return ${returnData.return_number} - ${item.condition}`
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["skus-manager"] });
    }
  });

  const filteredReturns = returns.filter(ret => {
    return ret.return_number?.toLowerCase().includes(search.toLowerCase()) ||
           ret.customer_name?.toLowerCase().includes(search.toLowerCase());
  });

  const pendingReturns = filteredReturns.filter(r => r.status === "pending" || r.status === "received");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Returns & Exchanges</h1>
            <p className="text-slate-500 mt-1">Process customer returns and manage restocking</p>
          </div>
          <AdminOnly>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-800 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2" /> New Return
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Return Request</DialogTitle>
                </DialogHeader>
                <ReturnForm
                  orders={orders}
                  warehouses={warehouses}
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </AdminOnly>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Total Returns</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{filteredReturns.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingReturns.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Processed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {filteredReturns.filter(r => r.status === "processed" || r.status === "completed").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Total Refunded</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                ₹{filteredReturns.reduce((sum, r) => sum + (r.refund_amount || 0), 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by return number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Returns List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredReturns.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">No returns found</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReturns.map(ret => (
              <ReturnCard
                key={ret.id}
                returnData={ret}
                onProcess={(user) => processReturnMutation.mutate({ returnData: ret, user })}
                isProcessing={processReturnMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReturnCard({ returnData, onProcess, isProcessing }) {
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    received: "bg-blue-100 text-blue-700",
    processed: "bg-green-100 text-green-700",
    completed: "bg-emerald-100 text-emerald-700"
  };

  const allItemsActioned = returnData.items?.every(item => item.action !== "pending") || false;

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-slate-800">{returnData.return_number}</h3>
              <Badge className={statusColors[returnData.status]}>
                {returnData.status}
              </Badge>
              <Badge variant="outline">{returnData.return_type}</Badge>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><strong>Customer:</strong> {returnData.customer_name}</p>
              <p><strong>Order:</strong> {returnData.order_number}</p>
              <p><strong>Channel:</strong> {returnData.channel}</p>
              {returnData.reason && <p><strong>Reason:</strong> {returnData.reason}</p>}
              {returnData.items && returnData.items.length > 0 && (
                <div>
                  <strong>Items:</strong>
                  <div className="ml-4 mt-1 space-y-1">
                    {returnData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span>• {item.product_name} x {item.quantity}</span>
                        <Badge variant="outline" className="text-xs">{item.condition}</Badge>
                        {item.action !== "pending" && (
                          <Badge className={item.action === "restock" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {item.action}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <AdminOnly>
              {returnData.status === "received" && allItemsActioned && user && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onProcess(user)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Process Return"}
                </Button>
              )}
            </AdminOnly>
            <p className="text-xs text-slate-400">
              {format(new Date(returnData.created_date), "MMM d, HH:mm")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReturnForm({ orders, warehouses, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    return_number: "",
    order_id: "",
    return_type: "return",
    channel: "",
    customer_name: "",
    warehouse_id: "",
    reason: "",
    refund_amount: 0,
    items: [],
    notes: ""
  });

  const selectedOrder = orders.find(o => o.id === formData.order_id);

  const handleOrderSelect = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setFormData({
        ...formData,
        order_id: orderId,
        order_number: order.order_number,
        channel: order.channel,
        customer_name: order.customer_name,
        warehouse_id: order.warehouse_id,
        items: order.items?.map(item => ({
          ...item,
          condition: "resellable",
          action: "pending"
        })) || []
      });
    }
  };

  const updateItemAction = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouse_id);

    onSubmit({
      ...formData,
      warehouse_name: selectedWarehouse?.name || "",
      status: "received",
      refund_status: "pending"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Return Number *</Label>
          <Input
            required
            value={formData.return_number}
            onChange={(e) => setFormData({ ...formData, return_number: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Return Type *</Label>
          <Select value={formData.return_type} onValueChange={(v) => setFormData({ ...formData, return_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Select Order</Label>
        <Select value={formData.order_id} onValueChange={handleOrderSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select order" />
          </SelectTrigger>
          <SelectContent>
            {orders.map(o => (
              <SelectItem key={o.id} value={o.id}>
                {o.order_number} - {o.customer_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedOrder && (
        <>
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <Input value={formData.customer_name} disabled />
          </div>

          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({ ...formData, warehouse_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Items with action selection */}
          <div className="border-t pt-4">
            <Label className="mb-2 block">Return Items - Set Action</Label>
            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <p className="font-medium">{item.product_name} x {item.quantity}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={item.condition}
                      onValueChange={(v) => updateItemAction(idx, "condition", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resellable">Resellable</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={item.action}
                      onValueChange={(v) => updateItemAction(idx, "action", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restock">Restock</SelectItem>
                        <SelectItem value="loss">Record Loss</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Return Reason</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Refund Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.refund_amount}
              onChange={(e) => setFormData({ ...formData, refund_amount: e.target.value })}
            />
          </div>
        </>
      )}

      <Button type="submit" disabled={isLoading || !selectedOrder} className="w-full">
        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Return"}
      </Button>
    </form>
  );
}