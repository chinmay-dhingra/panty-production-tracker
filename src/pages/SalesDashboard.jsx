import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function SalesDashboard() {
  const { data: skus = [] } = useQuery({
    queryKey: ["skus-sales"],
    queryFn: () => base44.entities.SKU.list()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 50)
  });

  const { data: returns = [] } = useQuery({
    queryKey: ["returns"],
    queryFn: () => base44.entities.Return.list("-created_date", 20)
  });

  // Calculate stats
  const totalSKUs = skus.length;
  const totalStock = skus.reduce((sum, sku) => sum + (sku.current_stock || 0), 0);
  const lowStockSKUs = skus.filter(sku => sku.current_stock <= sku.reorder_point && sku.reorder_point > 0).length;
  
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "packing").length;
  const readyToShip = orders.filter(o => o.status === "ready_to_ship").length;
  const pendingReturns = returns.filter(r => r.status === "pending" || r.status === "received").length;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Sales & Inventory Dashboard</h1>
          <p className="text-slate-500 mt-1">D2C order fulfillment and inventory management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Total SKUs</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{totalSKUs}</p>
                  <p className="text-xs text-slate-400 mt-1">{totalStock} units in stock</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Pending Orders</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{pendingOrders}</p>
                  <p className="text-xs text-slate-400 mt-1">Need processing</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Ready to Ship</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{readyToShip}</p>
                  <p className="text-xs text-slate-400 mt-1">Awaiting pickup</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Low Stock Alerts</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{lowStockSKUs}</p>
                  <p className="text-xs text-slate-400 mt-1">Below reorder point</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to={createPageUrl("Orders")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-8 h-8 text-violet-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Manage Orders</p>
                    <p className="text-sm text-slate-500">Process new orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Returns")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Returns & Exchanges</p>
                    <p className="text-sm text-slate-500">{pendingReturns} pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("SKUManager")}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-800">SKU Manager</p>
                    <p className="text-sm text-slate-500">Manage inventory</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-slate-500">{order.customer_name} • {order.channel}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'packing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'ready_to_ship' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}