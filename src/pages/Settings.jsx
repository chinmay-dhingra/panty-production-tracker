import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Layers, Palette, Ruler, Scissors, Shirt, Plus, Loader2, Edit2, Trash2, Save, X, Shield } from "lucide-react";
import { AdminOnly } from "../components/admin/AdminGuard";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("permissions");

  // Fetch all product attributes
  const { data: series = [] } = useQuery({
    queryKey: ["productSeries"],
    queryFn: () => base44.entities.ProductSeries.list()
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["productColors"],
    queryFn: () => base44.entities.ProductColor.list()
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["productSizes"],
    queryFn: () => base44.entities.ProductSize.list()
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["productMaterials"],
    queryFn: () => base44.entities.ProductMaterial.list()
  });

  const { data: styles = [] } = useQuery({
    queryKey: ["productStyles"],
    queryFn: () => base44.entities.ProductStyle.list()
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Product Configuration</h1>
          <p className="text-slate-500 mt-1">Manage product series, colors, sizes, materials, and styles</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="permissions">
              <Shield className="w-4 h-4 mr-2" /> Permissions
            </TabsTrigger>
            <TabsTrigger value="series">
              <Layers className="w-4 h-4 mr-2" /> Series
            </TabsTrigger>
            <TabsTrigger value="colors">
              <Palette className="w-4 h-4 mr-2" /> Colors
            </TabsTrigger>
            <TabsTrigger value="sizes">
              <Ruler className="w-4 h-4 mr-2" /> Sizes
            </TabsTrigger>
            <TabsTrigger value="materials">
              <Scissors className="w-4 h-4 mr-2" /> Materials
            </TabsTrigger>
            <TabsTrigger value="styles">
              <Shirt className="w-4 h-4 mr-2" /> Styles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-500" />
                  Staff Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="font-semibold text-emerald-900 mb-2">✓ Currently Enabled for All Staff</h3>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li>• Edit stage records (counting, cleaning, stamping, ironing)</li>
                    <li>• Delete stage records</li>
                    <li>• Edit packaging SKU entries</li>
                    <li>• Delete packaging SKU entries</li>
                    <li>• View audit logs of all changes</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">ℹ️ Admin Only Permissions</h3>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li>• Edit batch numbers</li>
                    <li>• Change batch status</li>
                    <li>• Delete entire batches</li>
                    <li>• Add/remove products from batches</li>
                    <li>• Manage product attributes (series, colors, sizes, etc.)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📝 Note</h3>
                  <p className="text-sm text-blue-700">
                    All edits and deletions are automatically logged in the audit system. View the audit log in the Workers page under "Date Tracker" tab.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="series">
            <AttributeManager 
              title="Product Series"
              entityName="ProductSeries"
              items={series}
              icon={Layers}
              queryKey="productSeries"
            />
          </TabsContent>

          <TabsContent value="colors">
            <AttributeManager 
              title="Product Colors"
              entityName="ProductColor"
              items={colors}
              icon={Palette}
              queryKey="productColors"
              hasHexCode
            />
          </TabsContent>

          <TabsContent value="sizes">
            <AttributeManager 
              title="Product Sizes"
              entityName="ProductSize"
              items={sizes}
              icon={Ruler}
              queryKey="productSizes"
            />
          </TabsContent>

          <TabsContent value="materials">
            <AttributeManager 
              title="Product Materials"
              entityName="ProductMaterial"
              items={materials}
              icon={Scissors}
              queryKey="productMaterials"
            />
          </TabsContent>

          <TabsContent value="styles">
            <AttributeManager 
              title="Product Styles"
              entityName="ProductStyle"
              items={styles}
              icon={Shirt}
              queryKey="productStyles"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AttributeManager({ title, entityName, items, icon: Icon, queryKey, hasHexCode }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", hex_code: "", is_active: true });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities[entityName].create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setShowAdd(false);
      setFormData({ name: "", code: "", hex_code: "", is_active: true });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[entityName].update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities[entityName].delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    }
  });

  const handleAdd = () => {
    createMutation.mutate(formData);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      code: item.code || "",
      hex_code: item.hex_code || "",
      is_active: item.is_active
    });
  };

  const saveEdit = () => {
    updateMutation.mutate({ id: editingId, data: formData });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-500" />
          {title}
        </CardTitle>
        <AdminOnly>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add New
          </Button>
        </AdminOnly>
      </CardHeader>
      <CardContent>
        {showAdd && (
          <AdminOnly>
            <div className="p-4 bg-slate-50 rounded-lg mb-4 space-y-3">
              <Input
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="Code (optional)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              {hasHexCode && (
                <Input
                  placeholder="Hex Code (e.g., #FF0000)"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                />
              )}
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!formData.name || createMutation.isPending}>
                  {createMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                  ) : (
                    "Add"
                  )}
                </Button>
                <Button variant="ghost" onClick={() => {
                  setShowAdd(false);
                  setFormData({ name: "", code: "", hex_code: "", is_active: true });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </AdminOnly>
        )}

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No items yet. Add your first {title.toLowerCase()}.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                {editingId === item.id ? (
                  <div className="flex-1 space-y-2 mr-2">
                    <Input
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                      placeholder="Code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                    {hasHexCode && (
                      <Input
                        placeholder="Hex Code"
                        value={formData.hex_code}
                        onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {hasHexCode && item.hex_code && (
                      <div
                        className="w-6 h-6 rounded-full border-2 border-slate-300"
                        style={{ backgroundColor: item.hex_code }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.code && <p className="text-xs text-slate-500">Code: {item.code}</p>}
                    </div>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                )}
                
                <AdminOnly>
                  <div className="flex gap-1">
                    {editingId === item.id ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateMutation.isPending}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(item)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete ${item.name}?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </AdminOnly>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}