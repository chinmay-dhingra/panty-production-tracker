import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function CountedItemsList({ stageRecords, batchNumber }) {
  const [exporting, setExporting] = useState(false);
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text("Counted Items Report", 14, 20);
      
      // Batch info
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      doc.text(`Batch: ${batchNumber || "N/A"}`, 14, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
      doc.text(`Total Pieces Counted: ${grandTotal.toLocaleString()}`, 14, 42);
      
      // Table data
      const tableData = productList.map(p => {
        const productName = [
          p.series_name,
          p.color_name,
          p.size_name,
          p.material_name,
          p.style_name
        ].filter(Boolean).join(" - ");
        
        return [
          productName,
          p.totalCounted.toLocaleString(),
          p.pass.toLocaleString(),
          p.fail.toLocaleString(),
          p.alteration.toLocaleString()
        ];
      });
      
      // Add table
      doc.autoTable({
        startY: 50,
        head: [["Product", "Total", "Pass", "Fail", "Alteration"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9 }
      });
      
      // Save
      doc.save(`counted-items-${batchNumber || "report"}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 shadow-lg bg-blue-50">
      <CardHeader className="bg-blue-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Counted Items Summary
          </CardTitle>
          <Button
            onClick={handleExport}
            disabled={exporting}
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
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