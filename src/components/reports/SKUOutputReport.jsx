import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Layers } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function SKUOutputReport({ skus, dateRange, seriesFilter }) {
  // Filter by date range and series
  const filterData = (item) => {
    let matches = true;
    
    if (dateRange?.from && dateRange?.to) {
      const itemDate = new Date(item.created_date);
      matches = matches && itemDate >= dateRange.from && itemDate <= dateRange.to;
    }
    
    if (seriesFilter && seriesFilter !== 'all') {
      matches = matches && item.series_id === seriesFilter;
    }
    
    return matches;
  };

  const filteredSKUs = skus.filter(filterData);

  // Group by SKU code
  const skuGroups = {};
  filteredSKUs.forEach(sku => {
    const key = sku.sku_code;
    if (!skuGroups[key]) {
      skuGroups[key] = {
        sku_code: key,
        size_name: sku.size_name,
        pack_type: sku.pack_type,
        total_quantity: 0,
        total_pieces: 0
      };
    }
    skuGroups[key].total_quantity += sku.quantity || 0;
    skuGroups[key].total_pieces += sku.total_pieces || 0;
  });

  const skuSummary = Object.values(skuGroups).sort((a, b) => b.total_quantity - a.total_quantity);

  // Group by pack type for pie chart
  const packTypeData = {};
  filteredSKUs.forEach(sku => {
    const packType = sku.pack_type || 'unknown';
    if (!packTypeData[packType]) {
      packTypeData[packType] = { name: packType.replace('_', ' '), value: 0 };
    }
    packTypeData[packType].value += sku.quantity || 0;
  });

  const pieData = Object.values(packTypeData);

  // Total stats
  const totalBundles = filteredSKUs.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalPieces = filteredSKUs.reduce((sum, s) => sum + (s.total_pieces || 0), 0);
  const uniqueSKUs = skuSummary.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Bundles</p>
                <p className="text-3xl font-bold text-violet-600">{totalBundles.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Pieces</p>
                <p className="text-3xl font-bold text-blue-600">{totalPieces.toLocaleString()}</p>
              </div>
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Unique SKUs</p>
                <p className="text-3xl font-bold text-emerald-600">{uniqueSKUs}</p>
              </div>
              <Package className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pack Type Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Distribution by Pack Type</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top SKUs */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Top Performing SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            {skuSummary.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {skuSummary.slice(0, 10).map((sku, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-200">
                    <div className="flex-1">
                      <p className="font-semibold text-violet-900">{sku.sku_code}</p>
                      <p className="text-xs text-violet-700">
                        {sku.pack_type?.replace('_', ' ')} • Size: {sku.size_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-violet-600">{sku.total_quantity} bundles</Badge>
                      <p className="text-xs text-slate-500 mt-1">{sku.total_pieces} pieces</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No SKUs created yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}