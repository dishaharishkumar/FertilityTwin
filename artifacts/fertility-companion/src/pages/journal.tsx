import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetJournalEntries, getGetJournalEntriesQueryKey,
  useCreateJournalEntry,
  useDeleteJournalEntry,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookHeart, Trash2, PenLine, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "How am I actually feeling today — not just physically?",
  "What am I afraid to Google but keep thinking about?",
  "What do I wish someone in my life understood?",
  "What would I tell my future self about this moment?",
  "What does my body feel like it's asking for?",
];

export default function JournalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: entries, isLoading } = useGetJournalEntries({
    query: { queryKey: getGetJournalEntriesQueryKey() },
  });
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const handleSubmit = () => {
    if (!text.trim()) return;
    createEntry.mutate(
      { data: { content: text.trim() } },
      {
        onSuccess: () => {
          setText("");
          queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
          toast({ title: "Entry saved", description: "Bloom has reflected on your words." });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not save your entry.", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteEntry.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1
          className="text-[1.85rem] text-foreground leading-tight"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Private Journal
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          A space just for you — no one else reads this. Write freely. Bloom will reflect back with warmth.
        </p>
      </div>

      {/* Writing area */}
      <div
        className="rounded-3xl border border-primary/20 overflow-hidden"
        data-testid="journal-compose-card"
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #fff8fa 100%)",
          boxShadow: "var(--shadow)",
          borderLeft: "4px solid hsl(345,48%,76%)",
        }}
      >
        <div className="px-6 pt-5 pb-6 space-y-4">
          <div className="flex items-center gap-2">
            <PenLine size={13} className="text-primary" />
            <span
              className="label-caps"
              style={{ color: "hsl(var(--primary))" }}
            >
              {format(new Date(), "EEEE, MMMM d")}
            </span>
          </div>

          <Textarea
            data-testid="journal-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What is on your mind today? Start writing — there is no wrong way..."
            className="resize-none bg-transparent border-primary/15 focus:border-primary/35 min-h-[140px] text-sm leading-relaxed placeholder:text-muted-foreground/50"
            rows={6}
            disabled={createEntry.isPending}
          />

          {/* Writing prompts */}
          {!text && (
            <div className="space-y-2">
              <p className="label-caps">Prompts to get you started</p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setText(p + " ")}
                    data-testid={`prompt-${p.slice(0, 15)}`}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/8 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || createEntry.isPending}
            className="w-full gap-2 rounded-xl"
            data-testid="button-save-journal"
          >
            <Sparkles size={14} />
            {createEntry.isPending ? "Saving and reflecting..." : "Save Entry"}
          </Button>
        </div>
      </div>

      {/* Past entries */}
      <div>
        <p className="label-caps mb-3">Past Entries</p>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all hover:border-primary/25",
                  expandedId === entry.id ? "border-primary/20" : ""
                )}
                data-testid={`journal-entry-${entry.id}`}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                style={{ boxShadow: expandedId === entry.id ? "var(--shadow)" : "var(--shadow-xs)" }}
              >
                <div className="px-5 pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="label-caps mb-1.5" style={{ color: "hsl(345,30%,55%)" }}>
                        {format(parseISO(entry.createdAt as unknown as string), "EEEE, MMMM d · h:mm a")}
                      </p>
                      <p className={cn(
                        "text-sm text-foreground leading-relaxed",
                        expandedId !== entry.id ? "line-clamp-2" : ""
                      )}>
                        {entry.content}
                      </p>

                      {expandedId === entry.id && entry.aiResponse && (
                        <div
                          className="mt-4 rounded-xl px-4 py-3"
                          data-testid={`journal-ai-response-${entry.id}`}
                          style={{ background: "linear-gradient(135deg, #fff8fa 0%, #fdf2f8 100%)" }}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles size={11} className="text-primary" />
                            <span className="label-caps" style={{ color: "hsl(var(--primary))" }}>Bloom reflects</span>
                          </div>
                          <p className="text-xs text-foreground/75 leading-relaxed italic" style={{ fontFamily: "var(--app-font-serif)" }}>
                            {entry.aiResponse}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      data-testid={`button-delete-journal-${entry.id}`}
                      className="shrink-0 text-muted-foreground/30 hover:text-destructive transition-colors mt-0.5 p-1 rounded-lg hover:bg-destructive/8"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-14 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, hsl(345,40%,93%) 0%, hsl(345,40%,87%) 100%)" }}
            >
              <BookHeart size={24} className="text-primary/60" />
            </div>
            <p className="text-sm font-medium text-foreground">Your journal is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Write your first entry above</p>
          </div>
        )}
      </div>
    </div>
  );
}
