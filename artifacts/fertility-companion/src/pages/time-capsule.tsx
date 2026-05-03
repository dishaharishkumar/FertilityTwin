import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays, isPast, isToday } from "date-fns";
import { Lock, Unlock, Clock, Plus, Trash2, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Capsule {
  id: number;
  title: string | null;
  message: string;
  unlockDate: string;
  isOpened: boolean;
  createdAt: string;
}

function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

function isUnlocked(dateStr: string): boolean {
  const d = parseISO(dateStr);
  return isPast(d) || isToday(d);
}

function CapsuleCard({
  capsule,
  onOpen,
  onDelete,
}: {
  capsule: Capsule;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const unlocked = isUnlocked(capsule.unlockDate);
  const days = daysUntil(capsule.unlockDate);
  const title = capsule.title || "A note to future me";

  if (!unlocked) {
    return (
      <Card className="p-5 flex items-start gap-4" style={{ background: "hsl(345,12%,97%)" }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "hsl(345,30%,90%)" }}
        >
          <Lock size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground text-sm">{title}</p>
            <button
              onClick={() => onDelete(capsule.id)}
              className="text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0 p-0.5"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock size={10} />
              Unlocks in {days} day{days !== 1 ? "s" : ""}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(capsule.unlockDate), "MMMM d, yyyy")}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  if (!capsule.isOpened) {
    return (
      <Card
        className="p-5 border-2 cursor-pointer group"
        style={{ borderColor: "hsl(345,48%,70%)", background: "hsl(345,40%,98%)" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
            style={{ background: "hsl(345,48%,88%)" }}
          >
            <Sparkles size={16} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Written on {format(parseISO(capsule.createdAt), "MMMM d, yyyy")} · Ready to open
            </p>
            <Button
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => { onOpen(capsule.id); setRevealed(true); }}
            >
              <Unlock size={13} />
              Open your capsule
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" style={{ background: "hsl(38,40%,98%)", border: "1px solid hsl(38,30%,88%)" }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/30">
        <div>
          <p className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--app-font-serif)" }}>{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Written {format(parseISO(capsule.createdAt), "MMMM d, yyyy")} · Opened {format(parseISO(capsule.unlockDate), "MMMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={() => onDelete(capsule.id)}
          className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="px-5 py-4">
        <p
          className="text-foreground leading-loose text-sm whitespace-pre-wrap"
          style={{ fontFamily: "Georgia, serif", color: "hsl(345,20%,22%)" }}
        >
          {capsule.message}
        </p>
      </div>
    </Card>
  );
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [error, setError] = useState("");

  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/time-capsules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, message, unlockDate }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-capsules"] });
      onDone();
    },
    onError: () => setError("Something went wrong. Please try again."),
  });

  function submit() {
    setError("");
    if (!message.trim()) { setError("Write something to your future self."); return; }
    if (!unlockDate) { setError("Choose an unlock date."); return; }
    create.mutate();
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Card className="p-5 space-y-4" style={{ background: "hsl(345,20%,98%)", border: "1px solid hsl(345,25%,88%)" }}>
      <p className="label-caps">Write a new capsule</p>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Title (optional)</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Before my next cycle, After the test…"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Your message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Dear future me…"
          rows={6}
          maxLength={5000}
          style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", lineHeight: "1.8" }}
        />
        <p className="text-xs text-muted-foreground text-right">{message.length}/5000</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Unlock on</label>
        <Input
          type="date"
          value={unlockDate}
          min={minDate}
          onChange={(e) => setUnlockDate(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          The message will be sealed until this date.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button onClick={submit} disabled={create.isPending} className="gap-2 flex-1">
          <Lock size={13} />
          {create.isPending ? "Sealing…" : "Seal capsule"}
        </Button>
        <Button variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </Card>
  );
}

export default function TimeCapsulePage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: capsules = [], isLoading } = useQuery<Capsule[]>({
    queryKey: ["time-capsules"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/time-capsules`);
      return res.json();
    },
  });

  const openMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/time-capsules/${id}/open`, { method: "PATCH" });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-capsules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/time-capsules/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time-capsules"] }),
  });

  const locked = capsules.filter((c) => !isUnlocked(c.unlockDate));
  const ready = capsules.filter((c) => isUnlocked(c.unlockDate) && !c.isOpened);
  const opened = capsules.filter((c) => c.isOpened);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Cycle Time Capsule
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Write a note to your future self. It stays sealed until the date you choose — then it unlocks, waiting for you to open it.
        </p>
      </div>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2 w-full">
          <Plus size={15} />
          Write a new capsule
        </Button>
      )}

      {showForm && <CreateForm onDone={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : capsules.length === 0 && !showForm ? (
        <Card className="p-10 text-center border-dashed">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "hsl(345,30%,92%)" }}
          >
            <Lock size={26} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No capsules yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Write your first note to future you — during the TWW, before a doctor's appointment, at the start of a new cycle.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {ready.length > 0 && (
            <div className="space-y-3">
              <p className="label-caps text-primary">Ready to open ({ready.length})</p>
              {ready.map((c) => (
                <CapsuleCard
                  key={c.id}
                  capsule={c}
                  onOpen={(id) => openMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {locked.length > 0 && (
            <div className="space-y-3">
              <p className="label-caps">Sealed ({locked.length})</p>
              {locked.map((c) => (
                <CapsuleCard
                  key={c.id}
                  capsule={c}
                  onOpen={(id) => openMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {opened.length > 0 && (
            <div className="space-y-3">
              <p className="label-caps text-muted-foreground">Opened ({opened.length})</p>
              {opened.map((c) => (
                <CapsuleCard
                  key={c.id}
                  capsule={c}
                  onOpen={(id) => openMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
