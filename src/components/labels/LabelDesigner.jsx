import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Upload, Ruler } from "lucide-react";

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
      <CardContent className="space-y-4">
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

        {/* MRP */}
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

        {/* Font Size */}
        <div>
          <Label className="text-xs">Font Size (pt)</Label>
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
          <div className="mt-1">
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
          </div>
        </div>

        {/* Border Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Border</Label>
          <Switch
            checked={config.showBorder}
            onCheckedChange={(checked) => onChange({ ...config, showBorder: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}