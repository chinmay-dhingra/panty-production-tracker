import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, Loader2, Layers, X, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const PACK_TYPES = [
  { value: "single", label: "Single Pack", pieces: 1 },
  { value: "2_pack", label: "2 Pack", pieces: 2 },
  { value: "3_pack", label: "3 Pack", pieces: 3 },
  { value: "4_pack", label: "4 Pack", pieces: 4 },
  { value: "6_pack", label: "6 Pack", pieces: 6 },
  { value: "8_pack", label: "8 Pack", pieces: 8 }
];

export default function PackagingForm({ workers, products, availableStock, onSubmit, isLoading, sizes }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    selected_products: [],
    pack_type: "",
    quantity: "",
    packed_by: "",
    sku_code: "",
    sku_size_id: ""
  });
  const [productQuantities, setProductQuantities] = useState({});

  const packType = PACK_TYPES.find(p => p.value === formData.pack_type);
  const requiredPieces = packType ? packType.pieces * (parseInt(formData.quantity) || 0) : 0;
  
  const totalSelectedPieces = formData.selected_products.reduce((sum, productKey) => {
    return sum + (parseInt(productQuantities[productKey]) || 0);
  }, 0);

  const piecesMismatch = requiredPieces > 0 && totalSelectedPieces !== requiredPieces;

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

    if (piecesMismatch) {
      alert(`Total pieces selected (${totalSelectedPieces}) must equal required pieces (${requiredPieces})`);
      return;
    }

    if (!formData.sku_code.trim()) {
      alert("Please enter an SKU code");
      return;
    }

    if (!formData.sku_size_id) {
      alert("Please select the size for this SKU");
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    const worker = workers.find(w => w.id === formData.packed_by);
    const skuSize = sizes.find(s => s.id === formData.sku_size_id);

    if (!skuSize) return;

    // Get first product for series/color/material/style info
    const firstProduct = products[0];

    // Submit data with SKU details and source products
    await onSubmit({
      size_id: skuSize.id,
      size_name: skuSize.name,
      pack_type: formData.pack_type,
      quantity: parseInt(formData.quantity),
      total_pieces: requiredPieces,
      packed_by: formData.packed_by,
      packed_by_name: worker?.name || "",
      sku_code: formData.sku_code.trim(),
      source_products: formData.selected_products.map(productKey => {
        const p = products.find(prod => 
          `${prod.series_id}-${prod.color_id}-${prod.size_id}-${prod.material_id || ''}-${prod.style_id || ''}` === productKey
        );
        return {
          series_id: p.series_id,
          series_name: p.series_name,
          color_id: p.color_id,
          color_name: p.color_name,
          size_id: p.size_id,
          size_name: p.size_name,
          material_id: p.material_id || "",
          material_name: p.material_name || "",
          style_id: p.style_id || "",
          style_name: p.style_name || "",
          quantity: parseInt(productQuantities[productKey]) || 0
        };
      })
    });

    setFormData({
      selected_products: [],
      pack_type: "",
      quantity: "",
      packed_by: "",
      sku_code: "",
      sku_size_id: ""
    });
    setProductQuantities({});
    setShowConfirm(false);
  };

  const getPackTypeLabel = () => {
    const pack = PACK_TYPES.find(p => p.value === formData.pack_type);
    return pack ? pack.label : "";
  };

  const getWorkerDisplay = () => {
    const worker = workers.find(w => w.id === formData.packed_by);
    return worker ? worker.name : "";
  };

  const getSelectedProductsDisplay = () => {
    return formData.selected_products.map(productKey => {
      const product = products.find(p => 
        `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}` === productKey
      );
      const qty = productQuantities[productKey] || 0;
      return {
        name: product ? `${product.series_name} - ${product.color_name} - ${product.size_name}${product.material_name ? ` - ${product.material_name}` : ''}${product.style_name ? ` - ${product.style_name}` : ''}` : "",
        qty
      };
    });
  };

  const getSkuSizeDisplay = () => {
    const size = sizes.find(s => s.id === formData.sku_size_id);
    return size ? size.name : "";
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Create Final SKU Bundle
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FINAL SKU DETAILS SECTION */}
          <div className="bg-violet-50 border-2 border-violet-300 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-violet-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Final SKU Bundle Details
            </h3>

            {/* SKU Code */}
            <div className="space-y-2">
              <Label className="text-violet-900">SKU Code *</Label>
              <Input
                type="text"
                placeholder="e.g., SBP09_M"
                value={formData.sku_code}
                onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
                className="border-violet-300 focus:border-violet-500"
              />
            </div>

            {/* SKU Size Selection */}
            <div className="space-y-2">
              <Label className="text-violet-900">SKU Size *</Label>
              <Select
                value={formData.sku_size_id}
                onValueChange={(value) => setFormData({ ...formData, sku_size_id: value })}
              >
                <SelectTrigger className="border-violet-300 focus:border-violet-500">
                  <SelectValue placeholder="Select size for this SKU" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pack Type & Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-violet-900">Pack Type *</Label>
                <Select
                  value={formData.pack_type}
                  onValueChange={(value) => setFormData({ ...formData, pack_type: value })}
                >
                  <SelectTrigger className="border-violet-300 focus:border-violet-500">
                    <SelectValue placeholder="Select type" />
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
                <Label className="text-violet-900">Number of Bundles *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  className="border-violet-300 focus:border-violet-500"
                />
              </div>
            </div>

            {formData.quantity && formData.pack_type && (
              <div className="bg-white p-3 rounded border-2 border-violet-400 text-center">
                <p className="text-sm text-violet-700">Creating</p>
                <p className="text-2xl font-bold text-violet-900">
                  {formData.quantity} SKU Bundle{parseInt(formData.quantity) > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-violet-600 mt-1">
                  ({getPackTypeLabel()})
                </p>
              </div>
            )}
          </div>

          {/* RAW PRODUCTS CONSUMED SECTION */}
          <div className="border-2 border-slate-300 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Raw Products Consumed ({formData.selected_products.length} selected)
            </h3>
            
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2 bg-slate-50">
              {products.map((p) => {
                const productKey = `${p.series_id}-${p.color_id}-${p.size_id}-${p.material_id || ''}-${p.style_id || ''}`;
                const available = availableStock[productKey] || 0;
                const isSelected = formData.selected_products.includes(productKey);
                return (
                  <div key={productKey} className="flex items-center gap-2 p-2 bg-white hover:bg-slate-100 rounded border">
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
                        onWheel={(e) => e.target.blur()}
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

          {requiredPieces > 0 && (
            <div className={`p-3 rounded-lg ${piecesMismatch ? 'bg-red-50 border-2 border-red-300' : 'bg-emerald-50 border-2 border-emerald-300'}`}>
              <div className="text-center space-y-1">
                <p className={`text-sm font-semibold ${piecesMismatch ? 'text-red-700' : 'text-emerald-700'}`}>
                  Required: {requiredPieces} pieces
                </p>
                <p className={`text-lg font-bold ${piecesMismatch ? 'text-red-700' : 'text-emerald-700'}`}>
                  Selected: {totalSelectedPieces} pieces
                </p>
                {piecesMismatch && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠ Mismatch! Adjust quantities to match required pieces
                  </p>
                )}
              </div>
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
            disabled={isLoading || formData.selected_products.length === 0 || !formData.pack_type || !formData.quantity || !formData.packed_by || piecesMismatch || !formData.sku_code.trim() || !formData.sku_size_id}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview & Confirm
          </Button>
        </form>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Packaging</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-2">
              <div className="bg-violet-600 text-white p-3 rounded text-center">
                <p className="text-xs font-bold uppercase">Creating Final SKU Bundle</p>
              </div>
              
              {/* Final SKU Info - Highlighted */}
              <div className="bg-violet-100 border-2 border-violet-400 p-3 rounded">
                <p className="text-xs text-violet-700 font-bold mb-1">SKU Code</p>
                <p className="text-2xl font-bold text-violet-900">{formData.sku_code}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-violet-50 p-2 rounded border border-violet-200">
                  <p className="text-xs text-violet-700">Size</p>
                  <p className="font-bold text-violet-900">{getSkuSizeDisplay()}</p>
                </div>
                <div className="bg-violet-50 p-2 rounded border border-violet-200">
                  <p className="text-xs text-violet-700">Pack Type</p>
                  <p className="font-bold text-violet-900">{getPackTypeLabel()}</p>
                </div>
              </div>

              <div className="bg-violet-100 border-2 border-violet-400 p-3 rounded text-center">
                <p className="text-xs text-violet-700 font-bold">Number of Bundles</p>
                <p className="text-3xl font-bold text-violet-900">{formData.quantity}</p>
              </div>

              <div className="bg-emerald-100 p-2 rounded text-center border border-emerald-200">
                <p className="text-xs text-emerald-700">Total Raw Pieces Needed</p>
                <p className="text-xl font-bold text-emerald-700">{requiredPieces} pcs</p>
              </div>

              {/* Raw Products Section */}
              <div className="bg-slate-50 p-3 rounded border-2 border-slate-300">
                <p className="text-xs text-slate-600 font-bold mb-2 uppercase">Raw Products Consumed:</p>
                <div className="space-y-1">
                  {getSelectedProductsDisplay().map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs bg-white p-2 rounded border">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-bold text-slate-900">{item.qty} pcs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-100 p-2 rounded">
                <p className="text-xs text-slate-600">Packed By</p>
                <p className="font-semibold text-sm">{getWorkerDisplay()}</p>
              </div>
            </div>
            <AlertDialogFooter className="mt-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSubmit} disabled={isLoading} className="bg-violet-600 hover:bg-violet-700">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}