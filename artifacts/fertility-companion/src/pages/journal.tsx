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
import { BookHeart, Trash2, PenLine, Sparkles, ChevronDown, ChevronUp, Feather } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { SURRENDER_PROMPTS, PROMPT_CATEGORIES } from "@/data/surrender-prompts";

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; activeBg: string; activeText: string }> = {
  "Surrender":        { bg: "bg-rose-50",    border: "border-rose-200",   text: "text-rose-700",   activeBg: "bg-rose-500",   activeText: "text-white" },
  "Letting Go":       { bg: "bg-pink-50",    border: "border-pink-200",   text: "text-pink-700",   activeBg: "bg-pink-500",   activeText: "text-white" },
  "Trusting Yourself":{ bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700",  activeBg: "bg-amber-500",  activeText: "text-white" },
  "Trusting Your Body":{ bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  activeBg: "bg-green-600",  activeText: "text-white" },
  "The Two-Week Wait":{ bg: "bg-fuchsia-50", border: "border-fuchsia-200",text: "text-fuchsia-700",activeBg: "bg-fuchsia-500",activeText: "text-white" },
  "Releasing Control":{ bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-700", activeBg: "bg-violet-500", activeText: "text-white" },
  "Self-Compassion":  { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-700",    activeBg: "bg-red-500",    activeText: "text-white" },
  "Fear & Anxiety":   { bg: "bg-slate-50",   border: "border-slate-200",  text: "text-slate-700",  activeBg: "bg-slate-500",  activeText: "text-white" },
  "Hope & Becoming":  { bg: "bg-yellow-50",  border: "border-yellow-200", text: "text-yellow-700", activeBg: "bg-yellow-500", activeText: "text-white" },
  "Grief & Acceptance":{ bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   activeBg: "bg-blue-500",   activeText: "text-white" },
};

function PromptsLibrary({ onSelect }: { onSelect: (text: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<string>(PROMPT_CATEGORIES[0]);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filtered = SURRENDER_PROMPTS.filter(p => p.category === activeCategory);
  const visible = showAll ? filtered : filtered.slice(0, 4);
  const colors = CATEGORY_COLORS[activeCategory];

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Feather size={12} className="text-primary/70" />
          <span className="label-caps" style={{ color: "hsl(var(--primary))" }}>
            200 surrender & letting-go prompts
          </span>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-muted-foreground/60" />
          : <ChevronDown size={14} className="text-muted-foreground/60" />}
      </button>

      {expanded && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_CATEGORIES.map(cat => {
              const c = CATEGORY_COLORS[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setShowAll(false); }}
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all",
                    isActive
                      ? `${c.activeBg} ${c.activeText} border-transparent`
                      : `${c.bg} ${c.border} ${c.text} hover:opacity-80`
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {visible.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => onSelect(`${prompt.question}\n\n${prompt.starter}`)}
                data-testid={`prompt-${prompt.id}`}
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all group",
                  "hover:border-primary/25 hover:bg-primary/5",
                  colors.bg, colors.border
                )}
              >
                <p className={cn("text-xs font-semibold leading-snug mb-1", colors.text)}>
                  {prompt.question}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                  {prompt.starter}
                </p>
              </button>
            ))}
          </div>

          {filtered.length > 4 && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="text-xs text-primary font-semibold hover:underline underline-offset-2"
            >
              {showAll ? `Show fewer` : `Show all ${filtered.length} prompts in this category`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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

          {/* 200 prompts library — always visible, collapsed by default */}
          <PromptsLibrary onSelect={(t) => { setText(t); }} />

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
