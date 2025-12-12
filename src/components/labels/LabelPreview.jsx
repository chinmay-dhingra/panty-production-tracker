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
            padding: '4px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Top Section - Logo & MRP */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
            {config.showLogo && config.logo && (
              <img
                src={config.logo}
                alt="Logo"
                style={{
                  maxWidth: '35px',
                  maxHeight: '18px',
                  objectFit: 'contain'
                }}
              />
            )}
            {config.showMRP && config.mrp && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: `${config.mrpFontSize}px`, fontWeight: 'bold', color: '#000' }}>
                  MRP: ₹{config.mrp}
                </div>
              </div>
            )}
          </div>

          {/* Middle Section - SKU Info */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
            <div style={{ flex: 1 }}>
              {config.layout === 'minimal' ? (
                <>
                  <div style={{ fontSize: `${config.fontSize + 2}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                    {sku.sku_code}
                  </div>
                  <div style={{ fontSize: `${config.fontSize}px`, marginTop: '2px', lineHeight: 1.1 }}>
                    Size: {sku.size_name}
                  </div>
                </>
              ) : config.layout === 'detailed' ? (
                <>
                  <div style={{ fontSize: `${config.fontSize + 2}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                    {sku.sku_code}
                  </div>
                  <div style={{ fontSize: `${config.fontSize - 1}px`, marginTop: '2px', lineHeight: 1.1 }}>
                    Size: {sku.size_name}
                  </div>
                  <div style={{ fontSize: `${config.fontSize - 1}px`, lineHeight: 1.1 }}>
                    Pack: {sku.pack_type?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: `${config.fontSize - 2}px`, marginTop: '2px', color: '#666', lineHeight: 1.1 }}>
                    Batch: {sku.batch_number}
                  </div>
                  {config.showWebsite && config.website && (
                    <div style={{ fontSize: `${config.fontSize - 2}px`, color: '#666', lineHeight: 1.1 }}>
                      {config.website}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: `${config.fontSize + 2}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
                    {sku.sku_code}
                  </div>
                  <div style={{ fontSize: `${config.fontSize - 1}px`, marginTop: '2px', lineHeight: 1.1 }}>
                    Size: {sku.size_name} • {sku.pack_type?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: `${config.fontSize - 2}px`, marginTop: '2px', color: '#666', lineHeight: 1.1 }}>
                    Batch: {sku.batch_number}
                  </div>
                </>
              )}
            </div>

            {/* Data Matrix Code */}
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: '45px',
                maxHeight: '45px',
                imageRendering: 'pixelated'
              }}
            />
          </div>

          {/* Bottom Section - Website (if not in detailed mode) */}
          {config.showWebsite && config.website && config.layout !== 'detailed' && (
            <div style={{ fontSize: `${config.fontSize - 2}px`, color: '#666', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '2px' }}>
              {config.website}
            </div>
          )}
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