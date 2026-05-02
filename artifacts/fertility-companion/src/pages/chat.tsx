import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetChatHistory,
  getGetChatHistoryQueryKey,
  useSendChatMessage,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const STARTERS = [
  "What is happening in my body right now?",
  "I've been Googling my symptoms and I'm spiraling.",
  "I just feel so alone in this journey.",
  "Can you help me understand my TWW symptoms?",
  "I need something to calm me down.",
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
      <div className="shrink-0 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h1 className="text-2xl font-serif text-foreground">Bloom Companion</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Your private space to ask anything about your body, symptoms, or feelings.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-3/4" />)}
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={22} className="text-primary" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">I am here with you</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Ask me anything — what your symptoms mean, how to calm your anxiety, or just talk about how you are feeling.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  data-testid={`starter-${s.slice(0, 20)}`}
                  className="text-left text-sm px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-foreground/80"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {allMessages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`message-${msg.role}`}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
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
            className="resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={sendMessage.isPending}
          />
          <Button
            data-testid="button-send-chat"
            onClick={() => handleSend()}
            disabled={!input.trim() || sendMessage.isPending}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Bloom is not a medical provider. Always consult your doctor for medical concerns.
        </p>
      </div>
    </div>
  );
}
