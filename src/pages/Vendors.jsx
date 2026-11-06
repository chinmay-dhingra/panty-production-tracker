import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Factory, Plus, Loader2, Pencil, Trash2, Phone, Mail, User, X, Save
} from "lucide-react";

const typeColors = {
  fabricator: "bg-blue-100 text-blue-700 border-blue-200",
  supplier: "bg-purple-100 text-purple-700 border-purple-200",
  vendor: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

const emptyForm = {
  name: "",
  type: "fabricator",
  contact_person: "",
  phone: "",
  email: "",
  notes: "",
  is_active: true
};

export default function Vendors() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => base44.entities.Vendor.list("name")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vendor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setForm(emptyForm);
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vendor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setEditingId(null);
      setForm(emptyForm);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Vendor.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] })
  });

  const startEdit = (vendor) => {
    setEditingId(vendor.id);
    setShowForm(false);
    setForm({
      name: vendor.name || "",
      type: vendor.type || "fabricator",
      contact_person: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      notes: vendor.notes || "",
      is_active: vendor.is_active !== false
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    createMutation.mutate({ ...form, name: form.name.trim() });
  };

  const handleSave = () => {
    updateMutation.mutate({ id: editingId, data: { ...form, name: form.name.trim() } });
  };

  const formFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Name *</Label>
          <Input
            placeholder="Vendor / fabricator name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fabricator">Fabricator</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Contact Person</Label>
          <Input
            placeholder="Optional"
            value={form.contact_person}
            onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input
            placeholder="Optional"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            placeholder="Optional"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Textarea
          placeholder="Delivery terms, quality history, remarks..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="min-h-16"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={editingId ? handleSave : handleAdd}
          disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {editingId ? "Save Changes" : "Add Vendor"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setShowForm(false);
            cancelEdit();
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Vendors & Fabricators</h1>
            <p className="text-slate-500 mt-1">
              Manage the fabricators and suppliers you receive deliveries from
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(!showForm);
            }}
            className="bg-slate-800 hover:bg-slate-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Vendor
          </Button>
        </div>

        {showForm && !editingId && (
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Factory className="w-5 h-5 text-slate-500" /> New Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>{formFields}</CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : vendors.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <Factory className="w-14 h-14 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">No vendors yet</h3>
              <p className="text-slate-400 mt-1">
                Add a fabricator or supplier to assign it to your batches
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <Card key={vendor.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {editingId === vendor.id ? (
                    formFields
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Factory className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-800">{vendor.name}</p>
                            <Badge className={typeColors[vendor.type] || typeColors.vendor}>
                              {vendor.type || "vendor"}
                            </Badge>
                            {vendor.is_active === false && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                            {vendor.contact_person && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {vendor.contact_person}
                              </span>
                            )}
                            {vendor.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {vendor.phone}
                              </span>
                            )}
                            {vendor.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {vendor.email}
                              </span>
                            )}
                          </div>
                          {vendor.notes && (
                            <p className="text-xs text-slate-400 mt-1">{vendor.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(vendor)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400"
                          title={vendor.is_active === false ? "Activate" : "Deactivate"}
                          onClick={() =>
                            updateMutation.mutate({
                              id: vendor.id,
                              data: { is_active: vendor.is_active === false }
                            })
                          }
                        >
                          {vendor.is_active === false ? (
                            <Save className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (window.confirm(`Delete ${vendor.name}? Batches keep their saved vendor name.`)) {
                              deleteMutation.mutate(vendor.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}