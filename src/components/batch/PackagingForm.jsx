import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Loader2, Plus, Trash2 } from "lucide-react";

const PACK_TYPES = [
  { value: "single", label: "Single Pack", pieces: 1 },
  { value: "2_pack", label: "2 Pack", pieces: 2 },
  { value: "3_pack", label: "3 Pack", pieces: 3 },
  { value: "4_pack", label: "4 Pack", pieces: 4 },
  { value: "6_pack", label: "6 Pack", pieces: 6 },
  { value: "8_pack", label: "8 Pack", pieces: 8 }
];

export default function PackagingForm({ workers, onSubmit, isLoading, availablePieces }) {
  const [skus, setSkus] = useState([{ pack_type: "", quantity: "", packed_by: "" }]);

  const addSKU = () => {
    setSkus([...skus, { pack_type: "", quantity: "", packed_by: "" }]);
  };

  const removeSKU = (index) => {
    setSkus(skus.filter((_, i) => i !== index));
  };

  const updateSKU = (index, field, value) => {
    const newSkus = [...skus];
    newSkus[index][field] = value;
    setSkus(newSkus);
  };

  const calculateTotalPieces = () => {
    return skus.reduce((total, sku) => {
      const packType = PACK_TYPES.find(p => p.value === sku.pack_type);
      return total + (packType ? packType.pieces * (parseInt(sku.quantity) || 0) : 0);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalPieces = calculateTotalPieces();
    
    if (totalPieces > availablePieces) {
      alert(`Total pieces (${totalPieces}) cannot exceed available pieces (${availablePieces})`);
      return;
    }

    const validSkus = skus.filter(sku => sku.pack_type && sku.quantity && sku.packed_by);
    if (validSkus.length === 0) {
      alert("Please add at least one valid SKU");
      return;
    }

    const skusWithDetails = validSkus.map(sku => {
      const packType = PACK_TYPES.find(p => p.value === sku.pack_type);
      const worker = workers.find(w => w.id === sku.packed_by);
      return {
        ...sku,
        quantity: parseInt(sku.quantity),
        total_pieces: packType.pieces * parseInt(sku.quantity),
        packed_by_name: worker?.name || ""
      };
    });

    onSubmit(skusWithDetails, totalPieces);
  };

  const totalPieces = calculateTotalPieces();
  const remaining = availablePieces - totalPieces;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Packaging - Convert to SKUs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Available Pieces</p>
              <p className="text-2xl font-bold text-blue-800">{availablePieces}</p>
            </div>
            <div className={`p-4 rounded-lg ${remaining < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <p className={`text-sm font-medium ${remaining < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                Remaining Pieces
              </p>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                {remaining}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {skus.map((sku, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">SKU #{index + 1}</span>
                  {skus.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSKU(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pack Type</Label>
                    <Select
                      value={sku.pack_type}
                      onValueChange={(value) => updateSKU(index, "pack_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pack" />
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
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={sku.quantity}
                      onChange={(e) => updateSKU(index, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Packed By</Label>
                    <Select
                      value={sku.packed_by}
                      onValueChange={(value) => updateSKU(index, "packed_by", value)}
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
                </div>
                {sku.pack_type && sku.quantity && (
                  <p className="text-sm text-slate-500">
                    Total pieces: {PACK_TYPES.find(p => p.value === sku.pack_type)?.pieces * parseInt(sku.quantity) || 0}
                  </p>
                )}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addSKU} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Add Another SKU
          </Button>

          <Button
            type="submit"
            disabled={isLoading || remaining < 0}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              "Complete Packaging"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}