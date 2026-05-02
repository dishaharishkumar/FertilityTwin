import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetJournalEntries,
  getGetJournalEntriesQueryKey,
  useCreateJournalEntry,
  useDeleteJournalEntry,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
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
        <h1 className="text-2xl font-serif text-foreground">Private Journal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A space just for you — no one else reads this. Write freely. Bloom will reflect back with warmth.
        </p>
      </div>

      {/* Writing area */}
      <Card className="border-primary/20 bg-primary/5" data-testid="journal-compose-card">
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <PenLine size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {format(new Date(), "EEEE, MMMM d")}
            </span>
          </div>
          <Textarea
            data-testid="journal-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What is on your mind today? Start writing — there is no wrong way..."
            className="resize-none bg-background/60 border-primary/20 min-h-[120px]"
            rows={5}
            disabled={createEntry.isPending}
          />

          {/* Writing prompts */}
          {!text && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Prompts to get you started</p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setText(p + " ")}
                    data-testid={`prompt-${p.slice(0, 15)}`}
                    className="text-xs px-2.5 py-1 rounded-full border border-primary/20 bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
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
            className="w-full gap-2"
            data-testid="button-save-journal"
          >
            <Sparkles size={15} />
            {createEntry.isPending ? "Saving and reflecting..." : "Save Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Past entries */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">Past Entries</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className={cn("overflow-hidden cursor-pointer transition-all", expandedId === entry.id ? "shadow-sm" : "")}
                data-testid={`journal-entry-${entry.id}`}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                <CardContent className="pt-4 pb-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">
                        {format(parseISO(entry.createdAt as unknown as string), "EEEE, MMMM d · h:mm a")}
                      </p>
                      <p className={cn(
                        "text-sm text-foreground leading-relaxed",
                        expandedId !== entry.id ? "line-clamp-2" : ""
                      )}>
                        {entry.content}
                      </p>

                      {expandedId === entry.id && entry.aiResponse && (
                        <div className="mt-3 pt-3 border-t border-border" data-testid={`journal-ai-response-${entry.id}`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles size={12} className="text-primary" />
                            <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">Bloom reflects</span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed italic">
                            {entry.aiResponse}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      data-testid={`button-delete-journal-${entry.id}`}
                      className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <BookHeart size={36} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Your journal is empty. Write your first entry above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
