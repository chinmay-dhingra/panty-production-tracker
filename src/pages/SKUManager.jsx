import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, Upload, Edit2, Loader2, AlertTriangle, Barcode } from "lucide-react";
import { AdminOnly } from "../components/admin/AdminGuard";

export default function SKUManager() {
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSKU, setEditingSKU] = useState(null);
  const queryClient = useQueryClient();

  const { data: skus = [], isLoading } = useQuery({
    queryKey: ["skus-manager"],
    queryFn: () => base44.entities.SKU.list("-created_date")
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => base44.entities.Warehouse.filter({ is_active: true })
  });

  const { data: series = [] } = useQuery({
    queryKey: ["series"],
    queryFn: () => base44.entities.ProductSeries.filter({ is_active: true })
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["colors"],
    queryFn: () => base44.entities.ProductColor.filter({ is_active: true })
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["sizes"],
    queryFn: () => base44.entities.ProductSize.filter({ is_active: true })
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => base44.entities.ProductMaterial.filter({ is_active: true })
  });

  const { data: styles = [] } = useQuery({
    queryKey: ["styles"],
    queryFn: () => base44.entities.ProductStyle.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SKU.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus-manager"] });
      setDialogOpen(false);
      setEditingSKU(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SKU.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus-manager"] });
      setDialogOpen(false);
      setEditingSKU(null);
    }
  });

  const filteredSKUs = skus.filter(sku => {
    const matchesSearch = sku.sku_code?.toLowerCase().includes(search.toLowerCase()) ||
                         sku.product_name?.toLowerCase().includes(search.toLowerCase()) ||
                         sku.amazon_fnsku?.toLowerCase().includes(search.toLowerCase()) ||
                         sku.flipkart_fnsku?.toLowerCase().includes(search.toLowerCase());
    const matchesWarehouse = filterWarehouse === "all" || sku.warehouse_id === filterWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const lowStockSKUs = filteredSKUs.filter(sku => sku.current_stock <= sku.reorder_point && sku.reorder_point > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">SKU Manager</h1>
            <p className="text-slate-500 mt-1">Manage product SKUs and inventory levels</p>
          </div>
          <AdminOnly>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-800 hover:bg-slate-700" onClick={() => setEditingSKU(null)}>
                  <Plus className="w-4 h-4 mr-2" /> Add SKU
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSKU ? "Edit SKU" : "Add New SKU"}</DialogTitle>
                </DialogHeader>
                <SKUForm
                  sku={editingSKU}
                  warehouses={warehouses}
                  series={series}
                  colors={colors}
                  sizes={sizes}
                  materials={materials}
                  styles={styles}
                  onSubmit={(data) => {
                    if (editingSKU) {
                      updateMutation.mutate({ id: editingSKU.id, data });
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Total SKUs</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{filteredSKUs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm">Total Stock</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {filteredSKUs.reduce((sum, s) => sum + (s.current_stock || 0), 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">{lowStockSKUs.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by SKU code, product name, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SKU List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredSKUs.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">No SKUs found</h3>
              <p className="text-slate-400 mt-1">Create your first SKU to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSKUs.map(sku => (
              <Card key={sku.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-800">{sku.product_name}</h3>
                        <Badge variant="outline">{sku.sku_code}</Badge>
                        {sku.current_stock <= sku.reorder_point && sku.reorder_point > 0 && (
                          <Badge className="bg-red-100 text-red-700">Low Stock</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                        {sku.series_name && <span>Series: {sku.series_name}</span>}
                        {sku.color_name && <span>• {sku.color_name}</span>}
                        {sku.size_name && <span>• {sku.size_name}</span>}
                        {sku.pack_type && <span>• {sku.pack_type.replace("_", " ")}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        {sku.amazon_fnsku && (
                          <div className="flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>Amazon: {sku.amazon_fnsku}</span>
                          </div>
                        )}
                        {sku.flipkart_fnsku && (
                          <div className="flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>Flipkart: {sku.flipkart_fnsku}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{sku.current_stock || 0}</p>
                        <p className="text-xs text-slate-500">In Stock</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-600">{sku.warehouse_name || "N/A"}</p>
                        <p className="text-xs text-slate-500">Warehouse</p>
                      </div>
                      <AdminOnly>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSKU(sku);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </AdminOnly>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SKUForm({ sku, warehouses, series, colors, sizes, materials, styles, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(sku || {
    sku_code: "",
    product_name: "",
    series_id: "",
    color_id: "",
    size_id: "",
    material_id: "",
    style_id: "",
    pack_type: "single",
    units_per_pack: 1,
    amazon_fnsku: "",
    flipkart_fnsku: "",
    warehouse_barcode: "",
    warehouse_id: "",
    current_stock: 0,
    reorder_point: 0,
    cost_price: 0,
    selling_price: 0,
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedSeries = series.find(s => s.id === formData.series_id);
    const selectedColor = colors.find(c => c.id === formData.color_id);
    const selectedSize = sizes.find(s => s.id === formData.size_id);
    const selectedMaterial = materials.find(m => m.id === formData.material_id);
    const selectedStyle = styles.find(s => s.id === formData.style_id);
    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouse_id);

    const packUnits = {
      single: 1, "2_pack": 2, "3_pack": 3, "4_pack": 4, "6_pack": 6, "8_pack": 8
    };

    onSubmit({
      ...formData,
      series_name: selectedSeries?.name || "",
      color_name: selectedColor?.name || "",
      size_name: selectedSize?.name || "",
      material_name: selectedMaterial?.name || "",
      style_name: selectedStyle?.name || "",
      warehouse_name: selectedWarehouse?.name || "",
      units_per_pack: packUnits[formData.pack_type] || 1,
      current_stock: parseInt(formData.current_stock) || 0,
      reorder_point: parseInt(formData.reorder_point) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>SKU Code *</Label>
          <Input
            required
            value={formData.sku_code}
            onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input
            required
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Series</Label>
          <Select value={formData.series_id} onValueChange={(v) => setFormData({ ...formData, series_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {series.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <Select value={formData.color_id} onValueChange={(v) => setFormData({ ...formData, color_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {colors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={formData.size_id} onValueChange={(v) => setFormData({ ...formData, size_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {sizes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Material</Label>
          <Select value={formData.material_id} onValueChange={(v) => setFormData({ ...formData, material_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={formData.style_id} onValueChange={(v) => setFormData({ ...formData, style_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {styles.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pack Type</Label>
        <Select value={formData.pack_type} onValueChange={(v) => setFormData({ ...formData, pack_type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="2_pack">2 Pack</SelectItem>
            <SelectItem value="3_pack">3 Pack</SelectItem>
            <SelectItem value="4_pack">4 Pack</SelectItem>
            <SelectItem value="6_pack">6 Pack</SelectItem>
            <SelectItem value="8_pack">8 Pack</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Amazon FNSKU</Label>
          <Input
            value={formData.amazon_fnsku}
            onChange={(e) => setFormData({ ...formData, amazon_fnsku: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Flipkart FNSKU</Label>
          <Input
            value={formData.flipkart_fnsku}
            onChange={(e) => setFormData({ ...formData, flipkart_fnsku: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Warehouse Barcode</Label>
          <Input
            value={formData.warehouse_barcode}
            onChange={(e) => setFormData({ ...formData, warehouse_barcode: e.target.value })}
          />
        </div>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Current Stock</Label>
          <Input
            type="number"
            min="0"
            value={formData.current_stock}
            onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Reorder Point</Label>
          <Input
            type="number"
            min="0"
            value={formData.reorder_point}
            onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cost Price</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Selling Price</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.selling_price}
            onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : sku ? "Update SKU" : "Create SKU"}
      </Button>
    </form>
  );
}