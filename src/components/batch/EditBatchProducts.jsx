import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function EditBatchProducts({ currentProducts, onUpdate, isLoading }) {
  const [open, setOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [products, setProducts] = useState(currentProducts || []);

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

  const { data: materials = [] } = useQuery({
    queryKey: ["productMaterials"],
    queryFn: () => base44.entities.ProductMaterial.filter({ is_active: true })
  });

  const { data: styles = [] } = useQuery({
    queryKey: ["productStyles"],
    queryFn: () => base44.entities.ProductStyle.filter({ is_active: true })
  });

  const handleOpen = () => {
    setProducts(currentProducts || []);
    setOpen(true);
  };

  const addProductCombination = () => {
    if (selectedSeries.length === 0 || selectedColors.length === 0 || selectedSizes.length === 0) {
      alert("Please select at least Series, Color, and Size");
      return;
    }

    const newProducts = [];
    selectedSeries.forEach(seriesId => {
      selectedColors.forEach(colorId => {
        selectedSizes.forEach(sizeId => {
          if (selectedMaterials.length === 0 && selectedStyles.length === 0) {
            const s = series.find(x => x.id === seriesId);
            const c = colors.find(x => x.id === colorId);
            const sz = sizes.find(x => x.id === sizeId);
            newProducts.push({
              series_id: seriesId,
              series_name: s?.name,
              color_id: colorId,
              color_name: c?.name,
              size_id: sizeId,
              size_name: sz?.name
            });
          } else if (selectedMaterials.length > 0 && selectedStyles.length === 0) {
            selectedMaterials.forEach(materialId => {
              const s = series.find(x => x.id === seriesId);
              const c = colors.find(x => x.id === colorId);
              const sz = sizes.find(x => x.id === sizeId);
              const m = materials.find(x => x.id === materialId);
              newProducts.push({
                series_id: seriesId,
                series_name: s?.name,
                color_id: colorId,
                color_name: c?.name,
                size_id: sizeId,
                size_name: sz?.name,
                material_id: materialId,
                material_name: m?.name
              });
            });
          } else if (selectedMaterials.length === 0 && selectedStyles.length > 0) {
            selectedStyles.forEach(styleId => {
              const s = series.find(x => x.id === seriesId);
              const c = colors.find(x => x.id === colorId);
              const sz = sizes.find(x => x.id === sizeId);
              const st = styles.find(x => x.id === styleId);
              newProducts.push({
                series_id: seriesId,
                series_name: s?.name,
                color_id: colorId,
                color_name: c?.name,
                size_id: sizeId,
                size_name: sz?.name,
                style_id: styleId,
                style_name: st?.name
              });
            });
          } else {
            selectedMaterials.forEach(materialId => {
              selectedStyles.forEach(styleId => {
                const s = series.find(x => x.id === seriesId);
                const c = colors.find(x => x.id === colorId);
                const sz = sizes.find(x => x.id === sizeId);
                const m = materials.find(x => x.id === materialId);
                const st = styles.find(x => x.id === styleId);
                newProducts.push({
                  series_id: seriesId,
                  series_name: s?.name,
                  color_id: colorId,
                  color_name: c?.name,
                  size_id: sizeId,
                  size_name: sz?.name,
                  material_id: materialId,
                  material_name: m?.name,
                  style_id: styleId,
                  style_name: st?.name
                });
              });
            });
          }
        });
      });
    });

    setProducts([...products, ...newProducts]);
    setSelectedSeries([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSelectedStyles([]);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (products.length === 0) {
      alert("Please add at least one product");
      return;
    }
    onUpdate({ expected_products: products });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" onClick={handleOpen} className="gap-2">
          <Edit className="w-4 h-4" /> Edit Products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Batch Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <div>
              <Label>Series *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {series.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedSeries.includes(s.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSeries([...selectedSeries, s.id]);
                        } else {
                          setSelectedSeries(selectedSeries.filter(id => id !== s.id));
                        }
                      }}
                    />
                    <span className="text-sm">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Colors *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedColors.includes(c.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedColors([...selectedColors, c.id]);
                        } else {
                          setSelectedColors(selectedColors.filter(id => id !== c.id));
                        }
                      }}
                    />
                    <span className="text-sm">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Sizes *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sizes.map((sz) => (
                  <div key={sz.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedSizes.includes(sz.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSizes([...selectedSizes, sz.id]);
                        } else {
                          setSelectedSizes(selectedSizes.filter(id => id !== sz.id));
                        }
                      }}
                    />
                    <span className="text-sm">{sz.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Materials (Optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedMaterials.includes(m.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMaterials([...selectedMaterials, m.id]);
                        } else {
                          setSelectedMaterials(selectedMaterials.filter(id => id !== m.id));
                        }
                      }}
                    />
                    <span className="text-sm">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Styles (Optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {styles.map((st) => (
                  <div key={st.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedStyles.includes(st.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStyles([...selectedStyles, st.id]);
                        } else {
                          setSelectedStyles(selectedStyles.filter(id => id !== st.id));
                        }
                      }}
                    />
                    <span className="text-sm">{st.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={addProductCombination} type="button" variant="outline" className="w-full">
              Add Selected Combinations
            </Button>
          </div>

          {/* Current Products */}
          <div>
            <Label>Current Products ({products.length})</Label>
            <div className="mt-2 border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {products.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No products added</p>
              ) : (
                products.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{p.series_name}</Badge>
                      <Badge variant="outline">{p.color_name}</Badge>
                      <Badge variant="outline">{p.size_name}</Badge>
                      {p.material_name && <Badge variant="outline">{p.material_name}</Badge>}
                      {p.style_name && <Badge variant="outline">{p.style_name}</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(idx)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || products.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
              </>
            ) : (
              "Update Products"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}