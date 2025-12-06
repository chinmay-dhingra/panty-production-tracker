import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportBatchPDF({ batch, stageRecords, skus }) {
  const [exporting, setExporting] = useState(false);

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(18);
      doc.text(`Batch Report: ${batch.batch_number}`, 14, 20);
      
      // Batch Info
      doc.setFontSize(11);
      doc.text(`Status: ${batch.status}`, 14, 30);
      doc.text(`Created: ${new Date(batch.created_date).toLocaleDateString()}`, 14, 36);
      
      // Expected Products
      doc.setFontSize(12);
      doc.text("Expected Products:", 14, 46);
      const products = batch.expected_products || [];
      const productData = products.map(p => [
        p.series_name,
        p.color_name,
        p.size_name
      ]);
      doc.autoTable({
        startY: 50,
        head: [["Series", "Color", "Size"]],
        body: productData,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59] }
      });
      
      // Stage Records
      let yPos = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text("Stage Records:", 14, yPos);
      
      const stages = ["counting", "cleaning", "stamping", "ironing", "packaging"];
      stages.forEach(stage => {
        const stageData = stageRecords.filter(r => r.stage === stage);
        if (stageData.length > 0) {
          yPos += 6;
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(11);
          doc.text(stage.toUpperCase(), 14, yPos);
          
          const records = stageData.map(r => [
            `${r.series_name}-${r.color_name}-${r.size_name}`,
            r.qc_pass || 0,
            r.qc_fail || 0,
            r.alteration || 0,
            r.completed_by_name || "",
            r.id.slice(0, 8)
          ]);
          
          doc.autoTable({
            startY: yPos + 2,
            head: [["Product", "Pass", "Fail", "Alt", "Worker", "ID"]],
            body: records,
            theme: "striped",
            headStyles: { fillColor: [100, 116, 139], fontSize: 9 },
            bodyStyles: { fontSize: 8 }
          });
          yPos = doc.lastAutoTable.finalY;
        }
      });
      
      // Packaging SKUs
      if (skus.length > 0) {
        yPos += 10;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(12);
        doc.text("Packaging Summary:", 14, yPos);
        
        const skuData = skus.map(s => [
          `${s.series_name}-${s.color_name}-${s.size_name}`,
          s.pack_type.replace("_", " "),
          s.quantity,
          s.total_pieces,
          s.id.slice(0, 8)
        ]);
        
        doc.autoTable({
          startY: yPos + 4,
          head: [["Product", "Pack Type", "Quantity", "Total Pcs", "ID"]],
          body: skuData,
          theme: "grid",
          headStyles: { fillColor: [139, 92, 246] }
        });
      }
      
      // Save
      doc.save(`${batch.batch_number}_report.pdf`);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button 
      onClick={exportPDF} 
      disabled={exporting}
      className="bg-slate-800 hover:bg-slate-700 text-white"
      size="sm"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4 mr-2" /> Export PDF
        </>
      )}
    </Button>
  );
}