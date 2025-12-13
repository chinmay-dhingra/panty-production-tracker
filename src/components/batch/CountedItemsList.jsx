import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Layers } from "lucide-react";

export default function CountedItemsList({ stageRecords }) {
  // Get counting stage records and aggregate by product
  const countingRecords = stageRecords.filter(r => r.stage === "counting");
  
  if (countingRecords.length === 0) {
    return null;
  }

  // Aggregate counts by product
  const productCounts = {};
  countingRecords.forEach(record => {
    const key = `${record.series_name}-${record.color_name}-${record.size_name}${record.material_name ? `-${record.material_name}` : ''}${record.style_name ? `-${record.style_name}` : ''}`;
    
    if (!productCounts[key]) {
      productCounts[key] = {
        series_name: record.series_name,
        color_name: record.color_name,
        size_name: record.size_name,
        material_name: record.material_name || "",
        style_name: record.style_name || "",
        totalCounted: 0,
        pass: 0,
        fail: 0,
        alteration: 0
      };
    }
    
    productCounts[key].pass += record.qc_pass || 0;
    productCounts[key].fail += record.qc_fail || 0;
    productCounts[key].alteration += record.alteration || 0;
    productCounts[key].totalCounted += (record.qc_pass || 0) + (record.qc_fail || 0) + (record.alteration || 0);
  });

  const productList = Object.values(productCounts).sort((a, b) => b.totalCounted - a.totalCounted);
  const grandTotal = productList.reduce((sum, p) => sum + p.totalCounted, 0);

  return (
    <Card className="border-2 border-blue-200 shadow-lg bg-blue-50">
      <CardHeader className="bg-blue-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Counted Items Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Grand Total */}
        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-blue-300">
          <div className="text-center">
            <p className="text-sm text-blue-700 font-bold uppercase mb-1">Total Pieces Counted</p>
            <p className="text-4xl font-bold text-blue-900">{grandTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-2">
          {productList.map((product, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-medium">
                      {product.series_name}
                    </Badge>
                    <Badge variant="outline">
                      {product.color_name}
                    </Badge>
                    <Badge variant="outline">
                      {product.size_name}
                    </Badge>
                    {product.material_name && (
                      <Badge variant="outline">
                        {product.material_name}
                      </Badge>
                    )}
                    {product.style_name && (
                      <Badge variant="outline">
                        {product.style_name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">{product.totalCounted}</p>
                  <p className="text-xs text-slate-500">pieces</p>
                </div>
              </div>
              
              {/* Quality Breakdown */}
              <div className="flex gap-3 text-xs mt-2 pt-2 border-t">
                <span className="text-emerald-600 font-medium">
                  ✓ {product.pass} Pass
                </span>
                <span className="text-red-600 font-medium">
                  ✗ {product.fail} Fail
                </span>
                <span className="text-amber-600 font-medium">
                  ⚡ {product.alteration} Alt
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}