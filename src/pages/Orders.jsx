import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Search, Plus, Package, Clock, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminOnly } from "../components/admin/AdminGuard";
import { format, differenceInHours } from "date-fns";

export default function Orders() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date")
  });

  const { data: skus = [] } = useQuery({
    queryKey: ["skus-for-orders"],
    queryFn: () => base44.entities.SKU.filter({ is_active: true })
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => base44.entities.Warehouse.filter({ is_active: true })
  });

  const { data: channelSLAs = [] } = useQuery({
    queryKey: ["channel-slas"],
    queryFn: () => base44.entities.ChannelSLA.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setDialogOpen(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] })
  });

  const markPackedMutation = useMutation({
    mutationFn: async ({ id, user }) => {
      await base44.entities.Order.update(id, {
        status: "ready_to_ship",
        packed_by: user.id,
        packed_by_name: user.full_name,
        packed_at: new Date().toISOString()
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] })
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const packingCount = orders.filter(o => o.status === "packing").length;
  const readyCount = orders.filter(o => o.status === "ready_to_ship").length;
  const breachedSLA = orders.filter(o => {
    if (!o.sla_pickup_time || o.status === "shipped" || o.status === "delivered" || o.status === "cancelled") return false;
    return new Date() > new Date(o.sla_pickup_time);
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Orders</h1>
            <p className="text-slate-500 mt-1">Process and track customer orders</p>
          </div>
          <AdminOnly>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-800 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2" /> New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <OrderForm
                  skus={skus}
                  warehouses={warehouses}
                  channelSLAs={channelSLAs}
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
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <p className="text-slate-500 text-sm">Pending</p>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <p className="text-slate-500 text-sm">Packing</p>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">{packingCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-slate-500 text-sm">Ready</p>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">{readyCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-slate-500 text-sm">SLA Breach</p>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-1">{breachedSLA}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="packing">Packing</TabsTrigger>
            <TabsTrigger value="ready_to_ship">Ready to Ship</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600">No orders found</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                    onMarkPacked={(user) => markPackedMutation.mutate({ id: order.id, user })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusChange, onMarkPacked }) {
  const [user, setUser] = useState(null);

  useState(() => {
    base44.auth.me().then(setUser);
  }, []);

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    packing: "bg-blue-100 text-blue-700",
    ready_to_ship: "bg-green-100 text-green-700",
    picked_up: "bg-violet-100 text-violet-700",
    shipped: "bg-slate-100 text-slate-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const slaBreached = order.sla_pickup_time && new Date() > new Date(order.sla_pickup_time) && 
                      order.status !== "shipped" && order.status !== "delivered";
  const hoursToSLA = order.sla_pickup_time ? differenceInHours(new Date(order.sla_pickup_time), new Date()) : null;

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-slate-800">{order.order_number}</h3>
              <Badge className={statusColors[order.status]}>
                {order.status.replace("_", " ")}
              </Badge>
              {slaBreached && (
                <Badge className="bg-red-100 text-red-700">
                  <AlertTriangle className="w-3 h-3 mr-1" /> SLA Breached
                </Badge>
              )}
              {hoursToSLA !== null && hoursToSLA > 0 && !slaBreached && (
                <Badge variant="outline">{hoursToSLA}h to SLA</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><strong>Customer:</strong> {order.customer_name}</p>
              <p><strong>Channel:</strong> {order.channel}</p>
              <p><strong>Warehouse:</strong> {order.warehouse_name || "N/A"}</p>
              {order.items && order.items.length > 0 && (
                <div>
                  <strong>Items:</strong>
                  <div className="ml-4 mt-1 space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx}>• {item.product_name} x {item.quantity}</p>
                    ))}
                  </div>
                </div>
              )}
              {order.notes && <p className="text-slate-500 italic">{order.notes}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <AdminOnly>
              {order.status === "pending" && (
                <Button size="sm" onClick={() => onStatusChange("packing")}>
                  Start Packing
                </Button>
              )}
              {order.status === "packing" && user && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onMarkPacked(user)}>
                  Mark Packed
                </Button>
              )}
              {order.status === "ready_to_ship" && (
                <Button size="sm" onClick={() => onStatusChange("picked_up")}>
                  Mark Picked Up
                </Button>
              )}
            </AdminOnly>
            <p className="text-xs text-slate-400 text-right">
              {format(new Date(order.created_date), "MMM d, HH:mm")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderForm({ skus, warehouses, channelSLAs, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    order_number: "",
    channel: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    shipping_address: "",
    warehouse_id: "",
    payment_status: "pending",
    total_amount: 0,
    items: [],
    notes: ""
  });

  const [selectedSKU, setSelectedSKU] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleAddItem = () => {
    const sku = skus.find(s => s.id === selectedSKU);
    if (!sku) return;

    setFormData({
      ...formData,
      items: [...formData.items, {
        sku_id: sku.id,
        sku_code: sku.sku_code,
        product_name: sku.product_name,
        quantity: parseInt(quantity),
        price: sku.selling_price || 0
      }]
    });
    setSelectedSKU("");
    setQuantity(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouse_id);
    const sla = channelSLAs.find(s => s.channel === formData.channel);
    const slaHours = sla?.sla_hours || 24;
    const slaTime = new Date();
    slaTime.setHours(slaTime.getHours() + slaHours);

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    onSubmit({
      ...formData,
      warehouse_name: selectedWarehouse?.name || "",
      sla_pickup_time: slaTime.toISOString(),
      total_amount: totalAmount,
      status: "pending"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Order Number *</Label>
          <Input
            required
            value={formData.order_number}
            onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Channel *</Label>
          <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="amazon">Amazon</SelectItem>
              <SelectItem value="flipkart">Flipkart</SelectItem>
              <SelectItem value="myntra">Myntra</SelectItem>
              <SelectItem value="ajio">Ajio</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Customer Name *</Label>
        <Input
          required
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.customer_phone}
            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.customer_email}
            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Shipping Address</Label>
        <Textarea
          value={formData.shipping_address}
          onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
        />
      </div>

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

      {/* Add Items */}
      <div className="border-t pt-4">
        <Label className="mb-2 block">Order Items</Label>
        <div className="flex gap-2 mb-3">
          <Select value={selectedSKU} onValueChange={setSelectedSKU}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select SKU" />
            </SelectTrigger>
            <SelectContent>
              {skus.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.sku_code} - {s.product_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20"
            placeholder="Qty"
          />
          <Button type="button" onClick={handleAddItem}>Add</Button>
        </div>
        {formData.items.length > 0 && (
          <div className="space-y-2">
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span>{item.product_name} x {item.quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({
                    ...formData,
                    items: formData.items.filter((_, i) => i !== idx)
                  })}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading || !formData.items.length} className="w-full">
        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Order"}
      </Button>
    </form>
  );
}