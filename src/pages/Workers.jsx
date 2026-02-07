import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, Plus, Loader2, User, Pencil, Search, 
  UserCheck, UserX, BarChart3, Calendar, Layers
} from "lucide-react";
import WorkerPerformance from "../components/workers/WorkerPerformance";
import DailyPerformance from "../components/workers/DailyPerformance";
import StageWisePerformance from "../components/workers/StageWisePerformance";
import DetailedPerformance from "../components/workers/DetailedPerformance";
import AuditLogViewer from "../components/reports/AuditLogViewer";



export default function Workers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const [formData, setFormData] = useState({
    name: "",
    employee_id: "",
    role: "",
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => base44.entities.Worker.list("-created_date")
  });

  const { data: stageRecords = [] } = useQuery({
    queryKey: ["stageRecords"],
    queryFn: () => base44.entities.StageRecord.list()
  });

  const { data: skus = [] } = useQuery({
    queryKey: ["skus"],
    queryFn: () => base44.entities.PackagingSKU.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Worker.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Worker.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({ name: "", employee_id: "", role: "", is_active: true });
    setEditingWorker(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWorker) {
      updateMutation.mutate({ id: editingWorker.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      employee_id: worker.employee_id || "",
      role: worker.role || "",
      is_active: worker.is_active !== false
    });
    setDialogOpen(true);
  };

  const toggleActive = (worker) => {
    updateMutation.mutate({
      id: worker.id,
      data: { is_active: !worker.is_active }
    });
  };

  const filteredWorkers = workers.filter(w => 
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  const activeWorkers = filteredWorkers.filter(w => w.is_active !== false);
  const inactiveWorkers = filteredWorkers.filter(w => w.is_active === false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Workers</h1>
            <p className="text-slate-500 mt-1">Manage your production team</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" /> Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingWorker ? "Edit Worker" : "Add New Worker"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter worker name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input
                    placeholder="e.g., EMP001"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    placeholder="e.g., Production Worker, QC Specialist"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active Status</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full bg-slate-800 hover:bg-slate-700"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {editingWorker ? "Update Worker" : "Add Worker"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="list" className="gap-2">
              <Users className="w-4 h-4" /> Workers List
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Performance
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2">
              <Calendar className="w-4 h-4" /> Daily Tracking
            </TabsTrigger>
            <TabsTrigger value="stagewise" className="gap-2">
              <Layers className="w-4 h-4" /> Stage-wise
            </TabsTrigger>
          </TabsList>

          {/* Workers List Tab */}
          <TabsContent value="list" className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search workers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{activeWorkers.length}</p>
                    <p className="text-sm text-slate-500">Active Workers</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <UserX className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{inactiveWorkers.length}</p>
                    <p className="text-sm text-slate-500">Inactive</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workers List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredWorkers.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600">No workers found</h3>
                  <p className="text-slate-400 mt-1">Add your first worker to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredWorkers.map((worker) => (
                  <Card 
                    key={worker.id} 
                    className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                      worker.is_active === false ? "opacity-60" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            worker.is_active === false ? "bg-slate-100" : "bg-slate-800"
                          }`}>
                            <User className={`w-6 h-6 ${
                              worker.is_active === false ? "text-slate-400" : "text-white"
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{worker.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {worker.employee_id && (
                                <span className="text-sm text-slate-500">{worker.employee_id}</span>
                              )}
                              {worker.role && (
                                <Badge variant="outline" className="text-xs">
                                  {worker.role}
                                </Badge>
                              )}
                              {worker.is_active === false && (
                                <Badge variant="outline" className="text-slate-400">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(worker)}
                          >
                            {worker.is_active === false ? (
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <UserX className="w-4 h-4 text-slate-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(worker)}
                          >
                            <Pencil className="w-4 h-4 text-slate-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <WorkerPerformance workers={workers} stageRecords={stageRecords} skus={skus} />
          </TabsContent>

          {/* Daily Performance Tab */}
          <TabsContent value="daily">
            <DailyPerformance workers={workers} stageRecords={stageRecords} skus={skus} />
          </TabsContent>

          {/* Stage-wise Performance Tab */}
          <TabsContent value="stagewise">
            <StageWisePerformance workers={workers} stageRecords={stageRecords} skus={skus} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}