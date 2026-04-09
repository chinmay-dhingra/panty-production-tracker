import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Database, CheckCircle2, XCircle, Loader2, FileJson, FileText } from "lucide-react";
import JSZip from "jszip";

const ENTITIES = [
  { key: "Batch", label: "Batches" },
  { key: "StageRecord", label: "Stage Records" },
  { key: "PackagingSKU", label: "Packaging SKUs" },
  { key: "Worker", label: "Workers" },
  { key: "Inventory", label: "Inventory" },
  { key: "AuditLog", label: "Audit Logs" },
  { key: "ProductSeries", label: "Product Series" },
  { key: "ProductColor", label: "Product Colors" },
  { key: "ProductSize", label: "Product Sizes" },
  { key: "ProductMaterial", label: "Product Materials" },
  { key: "ProductStyle", label: "Product Styles" },
];

function toCSV(data) {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export default function MasterDataManager() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState({});
  const [importResults, setImportResults] = useState([]);
  const [importLog, setImportLog] = useState([]);

  const handleExport = async () => {
    setExporting(true);
    setExportStatus({});
    const zip = new JSZip();
    const allData = {};

    for (const entity of ENTITIES) {
      try {
        setExportStatus(s => ({ ...s, [entity.key]: "loading" }));
        const data = await base44.entities[entity.key].list("-created_date", 10000);
        allData[entity.key] = data;
        zip.file(`${entity.key}.csv`, toCSV(data));
        setExportStatus(s => ({ ...s, [entity.key]: "done" }));
      } catch (e) {
        allData[entity.key] = [];
        setExportStatus(s => ({ ...s, [entity.key]: "error" }));
      }
    }

    // Add combined JSON
    zip.file("ALL_DATA.json", JSON.stringify(allData, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOVIV_Export_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportResults([]);
    setImportLog([]);

    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file("ALL_DATA.json");
      if (!jsonFile) {
        setImportLog(["❌ Error: ALL_DATA.json not found in ZIP. Please use a ZIP exported from this app."]);
        setImporting(false);
        return;
      }

      const jsonText = await jsonFile.async("string");
      const allData = JSON.parse(jsonText);
      const results = [];

      for (const entity of ENTITIES) {
        const records = allData[entity.key];
        if (!records || records.length === 0) {
          results.push({ entity: entity.label, status: "skipped", count: 0 });
          continue;
        }
        try {
          // Strip built-in fields before importing
          const cleaned = records.map(({ id, created_date, updated_date, created_by, ...rest }) => rest);
          await base44.entities[entity.key].bulkCreate(cleaned);
          results.push({ entity: entity.label, status: "success", count: cleaned.length });
        } catch (err) {
          results.push({ entity: entity.label, status: "error", count: 0, error: err.message });
        }
      }

      setImportResults(results);
    } catch (err) {
      setImportLog([`❌ Failed to read ZIP: ${err.message}`]);
    }

    setImporting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Data Manager</h1>
            <p className="text-slate-500 text-sm">Export all app data as ZIP (CSV + JSON) or import from a previous export</p>
          </div>
        </div>

        {/* Export Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" /> Master Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-600 mb-4 text-sm">
              Exports all {ENTITIES.length} entity tables as individual CSV files + one combined <code className="bg-slate-100 px-1 rounded">ALL_DATA.json</code>, bundled in a single ZIP file.
            </p>

            {/* Entity List */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
              {ENTITIES.map(e => (
                <div key={e.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border text-sm">
                  {exportStatus[e.key] === "loading" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
                  {exportStatus[e.key] === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {exportStatus[e.key] === "error" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  {!exportStatus[e.key] && <FileText className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className="text-slate-700">{e.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg border border-violet-200 text-sm">
                <FileJson className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="text-violet-700 font-medium">ALL_DATA.json</span>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-5 text-base"
            >
              {exporting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-5 h-5 mr-2" /> Export All Data as ZIP</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Master Import
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-600 mb-1 text-sm">
              Import from a ZIP file previously exported by this app. Records will be <strong>added</strong> (not replaced) to existing data.
            </p>
            <p className="text-xs text-amber-600 mb-4 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠️ Import appends new records. It does NOT delete or overwrite existing data. To do a full restore, clear the relevant tables first.
            </p>

            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${importing ? "border-slate-200 bg-slate-50 cursor-not-allowed" : "border-blue-300 hover:border-blue-500 hover:bg-blue-50"}`}>
              <Upload className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-slate-600 font-medium">Click to select ZIP file</span>
              <span className="text-slate-400 text-xs mt-1">Must be a ZIP exported from this app</span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                disabled={importing}
                onChange={handleImport}
              />
            </label>

            {importing && (
              <div className="mt-4 flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Importing data...</span>
              </div>
            )}

            {importLog.length > 0 && (
              <div className="mt-4 space-y-1">
                {importLog.map((l, i) => <p key={i} className="text-sm text-red-600">{l}</p>)}
              </div>
            )}

            {importResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-slate-700">Import Results:</p>
                {importResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border text-sm">
                    <span className="text-slate-700">{r.entity}</span>
                    <div className="flex items-center gap-2">
                      {r.status === "success" && <Badge className="bg-emerald-100 text-emerald-700">{r.count} imported</Badge>}
                      {r.status === "skipped" && <Badge variant="outline">Skipped (empty)</Badge>}
                      {r.status === "error" && <Badge className="bg-red-100 text-red-700">Error</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}