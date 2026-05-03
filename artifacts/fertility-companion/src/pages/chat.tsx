import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetChatHistory, getGetChatHistoryQueryKey,
  useSendChatMessage,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Sparkles, Heart, HelpCircle, Wind, Feather, Anchor, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STARTERS = [
  { text: "What is happening in my body right now?", icon: HelpCircle },
  { text: "I've been Googling my symptoms and I'm spiraling.", icon: Wind },
  { text: "I just feel so alone in this journey.", icon: Heart },
  { text: "Can you help me understand my TWW symptoms?", icon: Sparkles },
  { text: "I need something to calm me down.", icon: Wind },
  { text: "I'm struggling to let go of control over this process.", icon: Feather },
  { text: "How do I trust my body when it feels like it's failing me?", icon: Anchor },
  { text: "Help me surrender to the uncertainty without losing hope.", icon: Star },
];

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<{ role: string; content: string; id: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading } = useGetChatHistory(
    { limit: 50 },
    { query: { queryKey: getGetChatHistoryQueryKey({ limit: 50 }) } }
  );
  const sendMessage = useSendChatMessage();

  const allMessages = [
    ...(history ?? []).map((m) => ({ ...m, id: String(m.id) })),
    ...optimisticMessages,
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sendMessage.isPending) return;

    const optimisticId = `opt-${Date.now()}`;
    setOptimisticMessages((prev) => [...prev, { role: "user", content: msg, id: optimisticId }]);
    setInput("");

    sendMessage.mutate(
      { data: { message: msg } },
      {
        onSuccess: (data) => {
          setOptimisticMessages([]);
          queryClient.setQueryData(
            getGetChatHistoryQueryKey({ limit: 50 }),
            (old: typeof history) => [
              ...(old ?? []),
              data.userMessage,
              data.assistantMessage,
            ]
          );
        },
        onError: () => {
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] animate-in fade-in duration-300">
      {/* Header */}
      <div className="shrink-0 pb-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(345,48%,88%) 0%, hsl(345,48%,80%) 100%)" }}
          >
            <Sparkles size={15} className="text-primary" />
          </div>
          <h1
            className="text-[1.6rem] text-foreground leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Bloom Companion
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Your private space to ask anything about your body, symptoms, or feelings.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4 min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-3/4" />)}
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: "linear-gradient(135deg, hsl(345,48%,92%) 0%, hsl(345,48%,84%) 100%)",
                boxShadow: "var(--shadow)",
              }}
            >
              <Sparkles size={26} className="text-primary" />
            </div>
            <p
              className="text-lg text-foreground mb-1"
              style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
            >
              I am here with you
            </p>
            <p className="text-sm text-muted-foreground mb-7 max-w-xs leading-relaxed">
              Ask me anything — what your symptoms mean, how to calm your mind, or just talk.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {STARTERS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.text}
                    onClick={() => handleSend(s.text)}
                    data-testid={`starter-${s.text.slice(0, 20)}`}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/18 transition-colors">
                      <Icon size={13} className="text-primary" />
                    </span>
                    <span className="text-sm text-foreground/80 font-medium">{s.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {allMessages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`message-${msg.role}`}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  )}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, hsl(345,48%,58%) 0%, hsl(345,48%,50%) 100%)" }
                      : { boxShadow: "var(--shadow-sm)" }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div
                  className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Enter to send)"
            className="resize-none min-h-[44px] max-h-[120px] rounded-xl"
            rows={1}
            disabled={sendMessage.isPending}
          />
          <Button
            data-testid="button-send-chat"
            onClick={() => handleSend()}
            disabled={!input.trim() || sendMessage.isPending}
            size="icon"
            className="shrink-0 h-11 w-11 rounded-xl"
          >
            <Send size={15} />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-2 text-center">
          Bloom is not a medical provider. Always consult your doctor for medical concerns.
        </p>
      </div>
    </div>
  );
}
