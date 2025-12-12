import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Ruler, QrCode, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LabelDesigner({ config, onChange }) {
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...config, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="border-0 shadow-lg mt-2">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          Label Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
        {/* Dimensions */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-700">Label Dimensions (mm)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={config.width}
                onChange={(e) => onChange({ ...config, width: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={config.height}
                onChange={(e) => onChange({ ...config, height: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Layout Style */}
        <div>
          <Label className="text-xs font-bold text-slate-700">Layout Style</Label>
          <Select
            value={config.layout}
            onValueChange={(value) => onChange({ ...config, layout: value })}
          >
            <SelectTrigger className="h-8 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact - Dense info</SelectItem>
              <SelectItem value="detailed">Detailed - All info visible</SelectItem>
              <SelectItem value="minimal">Minimal - Essential only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Product Information */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-700">Product Information</Label>
          
          <div>
            <Label className="text-xs">MRP (₹)</Label>
            <Input
              type="text"
              placeholder="e.g., 299.00"
              value={config.mrp}
              onChange={(e) => onChange({ ...config, mrp: e.target.value })}
              className="h-8"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Show MRP on Label</Label>
            <Switch
              checked={config.showMRP}
              onCheckedChange={(checked) => onChange({ ...config, showMRP: checked })}
            />
          </div>

          {config.showMRP && (
            <div>
              <Label className="text-xs">MRP Font Size (pt)</Label>
              <Input
                type="number"
                min="6"
                max="20"
                value={config.mrpFontSize}
                onChange={(e) => onChange({ ...config, mrpFontSize: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
          )}

          <div>
            <Label className="text-xs">Website</Label>
            <Input
              type="text"
              placeholder="e.g., www.yourcompany.com"
              value={config.website}
              onChange={(e) => onChange({ ...config, website: e.target.value })}
              className="h-8"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Website on Label</Label>
            <Switch
              checked={config.showWebsite}
              onCheckedChange={(checked) => onChange({ ...config, showWebsite: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Data Matrix Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-violet-600" />
            <Label className="text-xs font-bold text-slate-700">Data Matrix Content</Label>
          </div>
          <p className="text-xs text-slate-500">Select what information to encode in the Data Matrix</p>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dm-sku"
                checked={config.dataMatrixFields.sku}
                onCheckedChange={(checked) => 
                  onChange({ 
                    ...config, 
                    dataMatrixFields: { ...config.dataMatrixFields, sku: checked }
                  })
                }
              />
              <Label htmlFor="dm-sku" className="text-xs cursor-pointer">SKU Code</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dm-batch"
                checked={config.dataMatrixFields.batch}
                onCheckedChange={(checked) => 
                  onChange({ 
                    ...config, 
                    dataMatrixFields: { ...config.dataMatrixFields, batch: checked }
                  })
                }
              />
              <Label htmlFor="dm-batch" className="text-xs cursor-pointer">Batch Number</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dm-size"
                checked={config.dataMatrixFields.size}
                onCheckedChange={(checked) => 
                  onChange({ 
                    ...config, 
                    dataMatrixFields: { ...config.dataMatrixFields, size: checked }
                  })
                }
              />
              <Label htmlFor="dm-size" className="text-xs cursor-pointer">Size</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dm-pack"
                checked={config.dataMatrixFields.pack}
                onCheckedChange={(checked) => 
                  onChange({ 
                    ...config, 
                    dataMatrixFields: { ...config.dataMatrixFields, pack: checked }
                  })
                }
              />
              <Label htmlFor="dm-pack" className="text-xs cursor-pointer">Pack Type</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Visual Settings */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visual Settings
          </Label>

          <div>
            <Label className="text-xs">General Font Size (pt)</Label>
            <Input
              type="number"
              min="6"
              max="16"
              value={config.fontSize}
              onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value) })}
              className="h-8"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <Label className="text-xs">Company Logo</Label>
            <div className="mt-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => document.getElementById('logo-upload').click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {config.logo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              {config.logo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-red-600"
                  onClick={() => onChange({ ...config, logo: null })}
                >
                  Remove Logo
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Logo on Label</Label>
            <Switch
              checked={config.showLogo}
              onCheckedChange={(checked) => onChange({ ...config, showLogo: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Border</Label>
            <Switch
              checked={config.showBorder}
              onCheckedChange={(checked) => onChange({ ...config, showBorder: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}