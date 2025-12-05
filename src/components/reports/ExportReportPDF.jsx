import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportReportPDF({ stageRecords, workers, title = "Production Report" }) {
  const [exporting, setExporting] = useState(false);

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      
      // Overall Stats
      const totalPass = stageRecords.reduce((s, r) => s + (r.qc_pass || 0), 0);
      const totalFail = stageRecords.reduce((s, r) => s + (r.qc_fail || 0), 0);
      const totalAlt = stageRecords.reduce((s, r) => s + (r.alteration || 0), 0);
      const total = totalPass + totalFail + totalAlt;
      const passRate = total > 0 ? ((totalPass / total) * 100).toFixed(1) : 0;
      
      doc.setFontSize(12);
      doc.text("Overall Statistics:", 14, 38);
      doc.autoTable({
        startY: 42,
        body: [
          ["Total Pieces", total.toLocaleString()],
          ["QC Pass", `${totalPass.toLocaleString()} (${passRate}%)`],
          ["QC Fail", totalFail.toLocaleString()],
          ["Alterations", totalAlt.toLocaleString()]
        ],
        theme: "plain",
        styles: { fontSize: 10 }
      });
      
      // Stage Breakdown
      let yPos = doc.lastAutoTable.finalY + 10;
      doc.text("Stage Breakdown:", 14, yPos);
      
      const stages = ["counting", "cleaning", "stamping", "ironing", "packaging"];
      const stageData = stages.map(stage => {
        const records = stageRecords.filter(r => r.stage === stage);
        return [
          stage.charAt(0).toUpperCase() + stage.slice(1),
          records.reduce((s, r) => s + (r.qc_pass || 0), 0),
          records.reduce((s, r) => s + (r.qc_fail || 0), 0),
          records.reduce((s, r) => s + (r.alteration || 0), 0)
        ];
      });
      
      doc.autoTable({
        startY: yPos + 4,
        head: [["Stage", "Pass", "Fail", "Alteration"]],
        body: stageData,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59] }
      });
      
      // Worker Performance
      if (workers && workers.length > 0) {
        doc.addPage();
        doc.setFontSize(12);
        doc.text("Worker Performance:", 14, 20);
        
        const workerData = workers.map(w => {
          const wRecords = stageRecords.filter(r => r.completed_by === w.id);
          const pass = wRecords.reduce((s, r) => s + (r.qc_pass || 0), 0);
          const fail = wRecords.reduce((s, r) => s + (r.qc_fail || 0), 0);
          const alt = wRecords.reduce((s, r) => s + (r.alteration || 0), 0);
          const wTotal = pass + fail + alt;
          const wRate = wTotal > 0 ? ((pass / wTotal) * 100).toFixed(1) : 0;
          
          return [
            w.name,
            w.employee_id || "-",
            wRecords.length,
            wTotal,
            `${wRate}%`
          ];
        }).filter(w => w[2] > 0);
        
        doc.autoTable({
          startY: 24,
          head: [["Worker", "ID", "Entries", "Total Pcs", "Pass Rate"]],
          body: workerData,
          theme: "striped",
          headStyles: { fillColor: [30, 41, 59] }
        });
      }
      
      doc.save(`production_report_${Date.now()}.pdf`);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={exportPDF} disabled={exporting} variant="outline">
      {exporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      Export PDF
    </Button>
  );
}