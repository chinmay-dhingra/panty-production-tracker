import { useEffect, useRef } from "react";
import bwipjs from "bwip-js";

export default function LabelPreview({ sku, config }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && sku) {
      generateDataMatrix();
    }
  }, [sku, config]);

  const generateDataMatrix = () => {
    try {
      // Build data string based on selected fields
      const parts = [];
      if (config.dataMatrixFields.sku) parts.push(`SKU:${sku.sku_code}`);
      if (config.dataMatrixFields.batch) parts.push(`BATCH:${sku.batch_number}`);
      if (config.dataMatrixFields.size) parts.push(`SIZE:${sku.size_name}`);
      if (config.dataMatrixFields.pack) parts.push(`PACK:${sku.pack_type}`);
      
      const dataString = parts.length > 0 ? parts.join('|') : sku.sku_code;
      
      bwipjs.toCanvas(canvasRef.current, {
        bcid: 'datamatrix',
        text: dataString,
        scale: 2,
        height: 10,
        width: 10,
      });
    } catch (e) {
      console.error('Error generating Data Matrix:', e);
    }
  };

  // Convert mm to pixels (assuming 96 DPI)
  const mmToPx = (mm) => (mm * 96) / 25.4;
  
  const widthPx = mmToPx(config.width);
  const heightPx = mmToPx(config.height);

  return (
    <div className="space-y-4">
      {/* Preview Container */}
      <div className="flex items-center justify-center bg-slate-100 p-8 rounded-lg">
        <div
          className="bg-white print-label"
          style={{
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            border: config.showBorder ? '2px solid #000' : 'none',
            padding: '8px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          {/* Company Name - Centered at top */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: `${config.fontSize + 6}px`, fontWeight: 'bold', letterSpacing: '2px' }}>
              SOVIV
            </div>
          </div>

          {/* Main Content - Left text + Right QR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1, gap: '12px' }}>
            {/* Left Side - Product Info */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '3px' }}>
              {config.showMRP && config.mrp && (
                <div style={{ fontSize: `${config.fontSize + 2}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                  MRP: {config.mrp}
                </div>
              )}
              <div style={{ fontSize: `${config.fontSize + 2}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                SIZE: {sku.size_name}
              </div>
              <div style={{ fontSize: `${config.fontSize + 2}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                SKU: {sku.sku_code}
              </div>
              <div style={{ fontSize: `${config.fontSize + 2}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                PACK: {sku.pack_type?.replace('_', ' ').toUpperCase()}
              </div>
              <div style={{ fontSize: `${config.fontSize + 1}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                BATCH: {sku.batch_number}
              </div>
            </div>

            {/* Right Side - Data Matrix + SKU below */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '2px' }}>
              <canvas
                ref={canvasRef}
                style={{
                  width: '55px',
                  height: '55px',
                  imageRendering: 'pixelated'
                }}
              />
              <div style={{ fontSize: `${config.fontSize + 1}px`, fontWeight: 'bold', textAlign: 'center', lineHeight: 1 }}>
                {sku.sku_code}
              </div>
            </div>
          </div>

          {/* Bottom Section - Company Info */}
          <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
            <div style={{ fontSize: `${config.fontSize - 3}px`, marginBottom: '3px', lineHeight: 1.2 }}>
              <strong>Marketed and Sold by:</strong> SOVIV COLLECTIVES LLP
            </div>
            <div style={{ borderTop: '2px solid #000', paddingTop: '3px', marginTop: '2px' }}>
              {config.showWebsite && config.website && (
                <div style={{ fontSize: `${config.fontSize - 1}px`, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
                  Website: {config.website}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Label Info */}
      <div className="text-sm text-slate-600 space-y-1">
        <p>Label Size: {config.width}mm × {config.height}mm</p>
        <p>Data Matrix Contains: {
          Object.entries(config.dataMatrixFields)
            .filter(([_, enabled]) => enabled)
            .map(([field, _]) => field.toUpperCase())
            .join(', ') || 'No data selected'
        }</p>
        <p className="text-xs text-slate-500">Layout: {config.layout}</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-label, .print-label * {
            visibility: visible;
          }
          .print-label {
            position: absolute;
            left: 0;
            top: 0;
            width: ${config.width}mm !important;
            height: ${config.height}mm !important;
          }
          @page {
            size: ${config.width}mm ${config.height}mm;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}