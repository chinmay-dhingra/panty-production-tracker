import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { AdminOnly } from "../admin/AdminGuard";

export default function MoveToInventory({ batch, packagingSKUs, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  // Fetch warehouses when dialog opens
  const handleOpenChange = async (isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      const warehousesList = await base44.entities.Warehouse.filter({ is_active: true });
      setWarehouses(warehousesList);
    }
  };

  // Calculate totals by product variant
  const getInventorySummary = () => {
    const summary = {};
    
    packagingSKUs.forEach(sku => {
      const key = `${sku.series_id}-${sku.color_id}-${sku.size_id}-${sku.material_id || ''}-${sku.style_id || ''}-${sku.pack_type}`;
      
      if (!summary[key]) {
        summary[key] = {
          series_name: sku.series_name,
          color_name: sku.color_name,
          size_name: sku.size_name,
          material_name: sku.material_name,
          style_name: sku.style_name,
          series_id: sku.series_id,
          color_id: sku.color_id,
          size_id: sku.size_id,
          material_id: sku.material_id,
          style_id: sku.style_id,
          pack_type: sku.pack_type,
          total_packs: 0,
          total_pieces: 0
        };
      }
      
      summary[key].total_packs += sku.quantity || 0;
      summary[key].total_pieces += sku.total_pieces || 0;
    });
    
    return Object.values(summary);
  };

  const handleMoveToInventory = async () => {
    if (!selectedWarehouse) {
      alert("Please select a warehouse");
      return;
    }

    setIsMoving(true);
    
    try {
      const user = await base44.auth.me();
      const selectedWarehouseObj = warehouses.find(w => w.id === selectedWarehouse);
      const summary = getInventorySummary();

      // Create or update SKU records in the Sales Inventory system
      for (const item of summary) {
        // Generate SKU code
        const skuCode = `${item.series_name?.substring(0, 3).toUpperCase() || 'PRD'}-${item.color_name?.substring(0, 3).toUpperCase() || 'CLR'}-${item.size_name || 'SZ'}-${item.pack_type.toUpperCase()}`;
        
        // Check if SKU already exists
        const existingSKUs = await base44.entities.SKU.filter({
          series_id: item.series_id,
          color_id: item.color_id,
          size_id: item.size_id,
          material_id: item.material_id || "",
          style_id: item.style_id || "",
          pack_type: item.pack_type,
          warehouse_id: selectedWarehouse
        });

        const packUnits = {
          single: 1, "2_pack": 2, "3_pack": 3, "4_pack": 4, "6_pack": 6, "8_pack": 8
        };

        if (existingSKUs.length > 0) {
          // Update existing SKU
          const existingSKU = existingSKUs[0];
          await base44.entities.SKU.update(existingSKU.id, {
            current_stock: (existingSKU.current_stock || 0) + item.total_packs
          });
        } else {
          // Create new SKU
          await base44.entities.SKU.create({
            sku_code: skuCode,
            product_name: `${item.series_name} ${item.color_name} ${item.size_name}`,
            series_id: item.series_id,
            series_name: item.series_name,
            color_id: item.color_id,
            color_name: item.color_name,
            size_id: item.size_id,
            size_name: item.size_name,
            material_id: item.material_id || "",
            material_name: item.material_name || "",
            style_id: item.style_id || "",
            style_name: item.style_name || "",
            pack_type: item.pack_type,
            units_per_pack: packUnits[item.pack_type] || 1,
            current_stock: item.total_packs,
            warehouse_id: selectedWarehouse,
            warehouse_name: selectedWarehouseObj?.name || "",
            reorder_point: 10,
            is_active: true
          });
        }

        // Log stock movement
        await base44.entities.StockMovement.create({
          movement_type: "production",
          sku_id: existingSKUs[0]?.id || "pending",
          sku_code: skuCode,
          product_name: `${item.series_name} ${item.color_name} ${item.size_name}`,
          quantity: item.total_packs,
          warehouse_id: selectedWarehouse,
          warehouse_name: selectedWarehouseObj?.name || "",
          reference_id: batch.id,
          reference_type: "batch",
          performed_by: user.id,
          performed_by_name: user.full_name,
          notes: `Moved from production batch ${batch.batch_number}`
        });
      }

      // Update batch status to completed
      await base44.entities.Batch.update(batch.id, {
        status: "completed"
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to move to inventory:", error);
      alert("Failed to move to inventory. Please try again.");
    } finally {
      setIsMoving(false);
    }
  };

  const summary = getInventorySummary();
  const totalPacks = summary.reduce((sum, item) => sum + item.total_packs, 0);
  const totalPieces = summary.reduce((sum, item) => sum + item.total_pieces, 0);

  return (
    <AdminOnly>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 w-full">
            <Package className="w-4 h-4 mr-2" />
            Move to Sales Inventory
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Move Production to Sales Inventory
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-500">Batch Number</p>
                <p className="font-bold text-slate-800">{batch.batch_number}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="font-bold text-slate-800">{totalPacks} packs ({totalPieces} pieces)</p>
              </div>
            </div>

            {/* Warehouse Selection */}
            <div className="space-y-2">
              <Label>Select Warehouse *</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose warehouse location" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} {w.code && `(${w.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items Summary */}
            <div>
              <Label className="mb-3 block">Items to Move</Label>
              <div className="space-y-2">
                {summary.map((item, idx) => (
                  <Card key={idx} className="border-0 bg-slate-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{item.series_name}</Badge>
                            <Badge variant="outline">{item.color_name}</Badge>
                            <Badge variant="outline">{item.size_name}</Badge>
                            {item.material_name && (
                              <Badge variant="outline">{item.material_name}</Badge>
                            )}
                            {item.style_name && (
                              <Badge variant="outline">{item.style_name}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            Pack Type: {item.pack_type.replace("_", " ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-800">{item.total_packs}</p>
                          <p className="text-xs text-slate-500">packs ({item.total_pieces} pcs)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isMoving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMoveToInventory}
                disabled={!selectedWarehouse || isMoving}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isMoving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Moving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm & Move
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminOnly>
  );
}