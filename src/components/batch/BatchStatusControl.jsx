import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings2 } from "lucide-react";
import { AdminOnly } from "../admin/AdminGuard";

export default function BatchStatusControl({ currentStatus, onStatusChange }) {
  return (
    <AdminOnly>
      <div className="flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-slate-500" />
        <Select value={currentStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </AdminOnly>
  );
}