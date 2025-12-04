import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Loader2, Layers, Palette, Ruler } from "lucide-react";

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
    series_id: "",
    color_id: "",
    size_id: "",
    pack_type: "",
    quantity: "",
    packed_by: ""
  });

  // Get unique values from products
  const uniqueSeries = [...new Map(products.map(p => [p.series_id, p])).values()];
  const uniqueColors = [...new Map(products.map(p => [p.color_id, p])).values()];
  const uniqueSizes = [...new Map(products.map(p => [p.size_id, p])).values()];

  // Calculate available pieces for selected product
  const getAvailable = () => {
    if (!formData.series_id || !formData.color_id || !formData.size_id) return 0;
    const key = `${formData.series_id}-${formData.color_id}-${formData.size_id}`;
    return availableStock[key] || 0;
  };

  const available = getAvailable();
  const packType = PACK_TYPES.find(p => p.value === formData.pack_type);
  const totalPieces = packType ? packType.pieces * (parseInt(formData.quantity) || 0) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (totalPieces > available) {
      alert(`Not enough pieces available. You have ${available} but need ${totalPieces}`);
      return;
    }

    const selectedProduct = products.find(p => 
      p.series_id === formData.series_id &&
      p.color_id === formData.color_id &&
      p.size_id === formData.size_id
    );

    const worker = workers.find(w => w.id === formData.packed_by);

    onSubmit({
      series_id: formData.series_id,
      series_name: selectedProduct?.series_name,
      color_id: formData.color_id,
      color_name: selectedProduct?.color_name,
      size_id: formData.size_id,
      size_name: selectedProduct?.size_name,
      pack_type: formData.pack_type,
      quantity: parseInt(formData.quantity),
      total_pieces: totalPieces,
      packed_by: formData.packed_by,
      packed_by_name: worker?.name || ""
    });

    setFormData({
      series_id: "",
      color_id: "",
      size_id: "",
      pack_type: "",
      quantity: "",
      packed_by: ""
    });
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
          {/* Product Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Layers className="w-3 h-3" /> Series
              </Label>
              <Select
                value={formData.series_id}
                onValueChange={(value) => setFormData({ ...formData, series_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select series" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSeries.map((p) => (
                    <SelectItem key={p.series_id} value={p.series_id}>
                      {p.series_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Palette className="w-3 h-3" /> Color
              </Label>
              <Select
                value={formData.color_id}
                onValueChange={(value) => setFormData({ ...formData, color_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueColors.map((p) => (
                    <SelectItem key={p.color_id} value={p.color_id}>
                      {p.color_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Size
              </Label>
              <Select
                value={formData.size_id}
                onValueChange={(value) => setFormData({ ...formData, size_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSizes.map((p) => (
                    <SelectItem key={p.size_id} value={p.size_id}>
                      {p.size_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available Stock */}
          {formData.series_id && formData.color_id && formData.size_id && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                Available after Ironing: <span className="text-xl font-bold">{available}</span> pieces
              </p>
            </div>
          )}

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
            disabled={isLoading || !formData.series_id || !formData.color_id || !formData.size_id || !formData.pack_type || !formData.quantity || !formData.packed_by || totalPieces > available}
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