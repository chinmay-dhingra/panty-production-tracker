import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, Plus, Loader2, Pencil, Trash2,
  Layers, Palette, Ruler, Tag
} from "lucide-react";

function ProductManager({ 
  title, 
  icon: Icon, 
  items, 
  isLoading, 
  onAdd, 
  onUpdate, 
  onDelete,
  fields,
  colorField = false
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd({ ...formData, is_active: true });
    }
    resetForm();
  };

  const openEdit = (item) => {
    setEditingItem(item);
    const data = {};
    fields.forEach(f => data[f.key] = item[f.key] || "");
    setFormData(data);
    setDialogOpen(true);
  };

  const openNew = () => {
    const data = {};
    fields.forEach(f => data[f.key] = "");
    setFormData(data);
    setEditingItem(null);
    setDialogOpen(true);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-500" />
          {title}
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} {title.replace(/s$/, "")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  {field.type === "color" ? (
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData[field.key] || "#000000"}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-14 h-10 p-1"
                      />
                      <Input
                        placeholder="#000000"
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      />
                    </div>
                  ) : (
                    <Input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700">
                {editingItem ? "Update" : "Add"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No items yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  item.is_active === false ? "bg-slate-100 opacity-60" : "bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {colorField && item.hex_code && (
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: item.hex_code }}
                    />
                  )}
                  <div>
                    <span className="font-medium">{item.name}</span>
                    {item.code && (
                      <span className="text-sm text-slate-400 ml-2">({item.code})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active !== false}
                    onCheckedChange={(checked) => onUpdate(item.id, { is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();

  // Product Series
  const { data: series = [], isLoading: seriesLoading } = useQuery({
    queryKey: ["productSeries"],
    queryFn: () => base44.entities.ProductSeries.list()
  });
  const createSeries = useMutation({
    mutationFn: (data) => base44.entities.ProductSeries.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productSeries"] })
  });
  const updateSeries = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductSeries.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productSeries"] })
  });

  // Colors
  const { data: colors = [], isLoading: colorsLoading } = useQuery({
    queryKey: ["productColors"],
    queryFn: () => base44.entities.ProductColor.list()
  });
  const createColor = useMutation({
    mutationFn: (data) => base44.entities.ProductColor.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productColors"] })
  });
  const updateColor = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductColor.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productColors"] })
  });

  // Sizes
  const { data: sizes = [], isLoading: sizesLoading } = useQuery({
    queryKey: ["productSizes"],
    queryFn: () => base44.entities.ProductSize.list("sort_order")
  });
  const createSize = useMutation({
    mutationFn: (data) => base44.entities.ProductSize.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productSizes"] })
  });
  const updateSize = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductSize.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productSizes"] })
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your product catalog</p>
        </div>

        <Tabs defaultValue="series" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="series" className="gap-2">
              <Layers className="w-4 h-4" /> Product Series
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="w-4 h-4" /> Colors
            </TabsTrigger>
            <TabsTrigger value="sizes" className="gap-2">
              <Ruler className="w-4 h-4" /> Sizes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="series">
            <ProductManager
              title="Product Series"
              icon={Layers}
              items={series}
              isLoading={seriesLoading}
              onAdd={(data) => createSeries.mutate(data)}
              onUpdate={(id, data) => updateSeries.mutate({ id, data })}
              fields={[
                { key: "name", label: "Series Name", placeholder: "e.g. Classic, Premium", required: true },
                { key: "code", label: "Short Code", placeholder: "e.g. CLS, PRM" }
              ]}
            />
          </TabsContent>

          <TabsContent value="colors">
            <ProductManager
              title="Colors"
              icon={Palette}
              items={colors}
              isLoading={colorsLoading}
              onAdd={(data) => createColor.mutate(data)}
              onUpdate={(id, data) => updateColor.mutate({ id, data })}
              colorField={true}
              fields={[
                { key: "name", label: "Color Name", placeholder: "e.g. Black, White", required: true },
                { key: "code", label: "Short Code", placeholder: "e.g. BLK, WHT" },
                { key: "hex_code", label: "Color", type: "color" }
              ]}
            />
          </TabsContent>

          <TabsContent value="sizes">
            <ProductManager
              title="Sizes"
              icon={Ruler}
              items={sizes}
              isLoading={sizesLoading}
              onAdd={(data) => createSize.mutate(data)}
              onUpdate={(id, data) => updateSize.mutate({ id, data })}
              fields={[
                { key: "name", label: "Size Name", placeholder: "e.g. S, M, L, XL", required: true },
                { key: "sort_order", label: "Sort Order", placeholder: "e.g. 1, 2, 3", type: "number" }
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}