import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, User, Calendar, Edit, Trash2, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { AdminOnly } from "../admin/AdminGuard";

export default function AuditLogViewer() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 200)
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.batch_number?.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesEntity = filterEntity === "all" || log.entity_type === filterEntity;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const actionColors = {
    create: "bg-green-100 text-green-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700"
  };

  const actionIcons = {
    create: Plus,
    update: Edit,
    delete: Trash2
  };

  return (
    <AdminOnly>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="StageRecord">Stage Record</SelectItem>
                <SelectItem value="PackagingSKU">SKU</SelectItem>
                <SelectItem value="Batch">Batch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-slate-400 text-center py-8">Loading...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No audit logs found</p>
            ) : (
              filteredLogs.map((log) => {
                const Icon = actionIcons[log.action];
                return (
                  <div key={log.id} className="bg-slate-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={actionColors[log.action]}>
                          <Icon className="w-3 h-3 mr-1" />
                          {log.action}
                        </Badge>
                        <Badge variant="outline">{log.entity_type}</Badge>
                        {log.batch_number && (
                          <Badge variant="outline">{log.batch_number}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.created_date), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>

                    <p className="font-medium text-sm mb-2">{log.entity_name}</p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <User className="w-3 h-3" />
                      <span>{log.user_name || log.user_email}</span>
                    </div>

                    {log.action === "update" && log.changed_fields?.length > 0 && (
                      <div className="bg-white p-3 rounded border mt-2">
                        <p className="text-xs font-medium text-slate-600 mb-2">Changed Fields:</p>
                        <div className="space-y-2">
                          {log.changed_fields.map((field, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium text-slate-700">{field}:</span>
                              <div className="ml-2 mt-1 flex items-center gap-2">
                                <span className="text-red-600 line-through">
                                  {JSON.stringify(log.old_data?.[field])}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="text-green-600">
                                  {JSON.stringify(log.new_data?.[field])}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </AdminOnly>
  );
}