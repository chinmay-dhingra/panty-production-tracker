import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PRESETS = [
  {
    id: "standard",
    name: "Standard Label",
    description: "25mm × 50mm - Default configuration",
    config: {
      width: 50,
      height: 25,
      fontSize: 8,
      showBorder: true,
      preset: "standard"
    }
  },
  {
    id: "compact",
    name: "Compact Label",
    description: "20mm × 40mm - Smaller format",
    config: {
      width: 40,
      height: 20,
      fontSize: 7,
      showBorder: true,
      preset: "compact"
    }
  },
  {
    id: "large",
    name: "Large Label",
    description: "30mm × 60mm - Larger format with more space",
    config: {
      width: 60,
      height: 30,
      fontSize: 10,
      showBorder: true,
      preset: "large"
    }
  },
  {
    id: "premium",
    name: "Premium Label",
    description: "35mm × 70mm - Premium product label",
    config: {
      width: 70,
      height: 35,
      fontSize: 11,
      showBorder: false,
      preset: "premium"
    }
  }
];

export default function LabelPresets({ onSelectPreset }) {
  return (
    <Card className="border-0 shadow-lg mt-2">
      <CardContent className="p-4 space-y-3">
        {PRESETS.map((preset) => (
          <div
            key={preset.id}
            className="p-3 border-2 border-slate-200 rounded-lg hover:border-violet-400 transition-all cursor-pointer"
            onClick={() => onSelectPreset(preset.config)}
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="font-semibold text-sm text-slate-900">{preset.name}</p>
                <p className="text-xs text-slate-600">{preset.description}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {preset.config.width}×{preset.config.height}mm
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}