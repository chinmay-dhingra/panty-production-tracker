import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Factory, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const typeColors = {
  fabricator: "bg-blue-100 text-blue-700 border-blue-200",
  supplier: "bg-purple-100 text-purple-700 border-purple-200",
  vendor: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

export default function BatchVendor({ batch, vendors = [], onChange, isLoading }) {
  const options = vendors.filter(v => v.is_active || v.id === batch.vendor_id);
  const current = vendors.find(v => v.id === batch.vendor_id);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-slate-500" />
          Fabricator / Supplier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          value={batch.vendor_id || "none"}
          onValueChange={(value) => {
            const vendor = vendors.find(v => v.id === value);
            onChange({
              vendor_id: vendor?.id || "",
              vendor_name: vendor?.name || "",
              vendor_type: vendor?.type || ""
            });
          }}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select fabricator or supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No vendor</SelectItem>
            {options.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
          </p>
        )}

        {current && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={typeColors[current.type] || typeColors.vendor}>
              {current.type}
            </Badge>
            {current.contact_person && (
              <span className="text-xs text-slate-500">{current.contact_person}</span>
            )}
            {current.phone && <span className="text-xs text-slate-500">• {current.phone}</span>}
          </div>
        )}

        {vendors.length === 0 && (
          <Link
            to={createPageUrl("Vendors")}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add a fabricator or supplier
          </Link>
        )}
      </CardContent>
    </Card>
  );
}