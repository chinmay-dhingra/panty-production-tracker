import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, StickyNote, Loader2, Trash2, User } from "lucide-react";
import { format } from "date-fns";

export default function BatchNotes({ batchId, batchNumber }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [noteType, setNoteType] = useState("note");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["batchNotes", batchId],
    queryFn: () => base44.entities.BatchNote.filter({ batch_id: batchId }, "-created_date"),
    enabled: !!batchId
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.BatchNote.create({
        batch_id: batchId,
        batch_number: batchNumber,
        note: text.trim(),
        note_type: noteType,
        author_email: user?.email || "",
        author_name: user?.full_name || user?.email || ""
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batchNotes", batchId] });
      setText("");
      setNoteType("note");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BatchNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batchNotes", batchId] })
  });

  const handleAdd = () => {
    if (!text.trim()) return;
    createMutation.mutate();
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-500" />
          Notes & Comments
          <span className="text-sm font-normal text-slate-400">({notes.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note or comment about this batch..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-20"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={noteType === "note" ? "default" : "outline"}
                className={noteType === "note" ? "bg-slate-800 hover:bg-slate-700" : ""}
                onClick={() => setNoteType("note")}
              >
                <StickyNote className="w-3.5 h-3.5 mr-1" /> Note
              </Button>
              <Button
                type="button"
                size="sm"
                variant={noteType === "comment" ? "default" : "outline"}
                className={noteType === "comment" ? "bg-slate-800 hover:bg-slate-700" : ""}
                onClick={() => setNoteType("comment")}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Comment
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!text.trim() || createMutation.isPending}
              className="bg-slate-800 hover:bg-slate-700"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No notes or comments yet</p>
          ) : (
            notes.map((entry) => (
              <div key={entry.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={
                        entry.note_type === "comment"
                          ? "border-slate-300 text-slate-600"
                          : "border-blue-300 text-blue-700 bg-blue-50"
                      }
                    >
                      {entry.note_type === "comment" ? "Comment" : "Note"}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> {entry.author_name || entry.author_email || "Unknown"}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-slate-300 hover:text-red-600"
                    onClick={() => {
                      if (window.confirm("Delete this note?")) deleteMutation.mutate(entry.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{entry.note}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {entry.created_date ? format(new Date(entry.created_date), "MMM d, yyyy • HH:mm") : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}