import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, Loader2, Layers, X } from "lucide-react";

const PACK_TYPES = [
  { value: "single", label: "Single Pack", pieces: 1 },
  { value: "2_pack", label: "2 Pack", pieces: 2 },
  { value: "3_pack", label: "3 Pack", pieces: 3 },
  { value: "4_pack", label: "4 Pack", pieces: 4 },
  { value: "6_pack", label: "6 Pack", pieces: 6 },
  { value: "8_pack", label: "8 Pack", pieces: 8 }
];

export default function PackagingForm({ workers, products, availableStock, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    selected_products: [],
    pack_type: "",
    quantity: "",
    packed_by: ""
  });
  const [productQuantities, setProductQuantities] = useState({});
  const [skuInput, setSkuInput] = useState("");
  const [recordedSkus, setRecordedSkus] = useState([]);

  const packType = PACK_TYPES.find(p => p.value === formData.pack_type);
  const totalPieces = packType ? packType.pieces * (parseInt(formData.quantity) || 0) : 0;

  const handleSkuKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (skuInput.trim()) {
        setRecordedSkus([...recordedSkus, skuInput.trim()]);
        setSkuInput("");
      }
    }
  };

  const removeSkuRecord = (index) => {
    setRecordedSkus(recordedSkus.filter((_, i) => i !== index));
  };

  const toggleProduct = (productKey) => {
    if (formData.selected_products.includes(productKey)) {
      setFormData({
        ...formData,
        selected_products: formData.selected_products.filter(p => p !== productKey)
      });
      const newQuantities = { ...productQuantities };
      delete newQuantities[productKey];
      setProductQuantities(newQuantities);
    } else {
      setFormData({
        ...formData,
        selected_products: [...formData.selected_products, productKey]
      });
      setProductQuantities({ ...productQuantities, [productKey]: "" });
    }
  };

  const updateProductQuantity = (productKey, quantity) => {
    setProductQuantities({ ...productQuantities, [productKey]: quantity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.selected_products.length === 0) {
      alert("Please select at least one product");
      return;
    }

    const worker = workers.find(w => w.id === formData.packed_by);

    // Create entries for each selected product
    for (const productKey of formData.selected_products) {
      const selectedProduct = products.find(p => 
        `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}` === productKey
      );

      const productQty = parseInt(productQuantities[productKey]) || 0;
      if (selectedProduct && productQty > 0) {
        await onSubmit({
          series_id: selectedProduct.series_id,
          series_name: selectedProduct.series_name,
          color_id: selectedProduct.color_id,
          color_name: selectedProduct.color_name,
          size_id: selectedProduct.size_id,
          size_name: selectedProduct.size_name,
          material_id: selectedProduct.material_id || "",
          material_name: selectedProduct.material_name || "",
          style_id: selectedProduct.style_id || "",
          style_name: selectedProduct.style_name || "",
          pack_type: formData.pack_type,
          quantity: parseInt(formData.quantity),
          total_pieces: productQty,
          packed_by: formData.packed_by,
          packed_by_name: worker?.name || "",
          sku_records: recordedSkus
        });
      }
    }

    setFormData({
      selected_products: [],
      pack_type: "",
      quantity: "",
      packed_by: ""
    });
    setProductQuantities({});
    setRecordedSkus([]);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Add Packaging Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection - Multiple checkboxes with quantity */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Layers className="w-3 h-3" /> Select Products ({formData.selected_products.length} selected)
            </Label>
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {products.map((p) => {
                const productKey = `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}`;
                const available = availableStock[productKey] || 0;
                const isSelected = formData.selected_products.includes(productKey);
                return (
                  <div key={productKey} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProduct(productKey)}
                    />
                    <span className="text-sm flex-1">
                      {p.series_name} - {p.color_name} - {p.size_name}
                      {p.material_name && ` - ${p.material_name}`}
                      {p.style_name && ` - ${p.style_name}`}
                    </span>
                    {isSelected && (
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={productQuantities[productKey] || ""}
                        onChange={(e) => updateProductQuantity(productKey, e.target.value)}
                        className="w-20 h-8"
                      />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {available} avail
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SKU Recording */}
          <div className="space-y-2">
            <Label>Record SKU Codes</Label>
            <Input
              type="text"
              placeholder="Scan or type SKU, press Enter to record"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              onKeyDown={handleSkuKeyDown}
            />
            {recordedSkus.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
                {recordedSkus.map((sku, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {sku}
                    <button
                      type="button"
                      onClick={() => removeSkuRecord(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Pack Type & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pack Type</Label>
              <Select
                value={formData.pack_type}
                onValueChange={(value) => setFormData({ ...formData, pack_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pack type" />
                </SelectTrigger>
                <SelectContent>
                  {PACK_TYPES.map((pack) => (
                    <SelectItem key={pack.value} value={pack.value}>
                      {pack.label} ({pack.pieces} pc)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Packs</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>

          {totalPieces > 0 && (
            <div className={`p-3 rounded-lg text-center ${totalPieces > available ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <span className={`font-medium ${totalPieces > available ? 'text-red-700' : 'text-emerald-700'}`}>
                Total Pieces: {totalPieces} {totalPieces > available && '(Exceeds available!)'}
              </span>
            </div>
          )}

          {/* Worker */}
          <div className="space-y-2">
            <Label>Packed By</Label>
            <Select
              value={formData.packed_by}
              onValueChange={(value) => setFormData({ ...formData, packed_by: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isLoading || formData.selected_products.length === 0 || !formData.pack_type || !formData.quantity || !formData.packed_by}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Add Packaging Entry"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}