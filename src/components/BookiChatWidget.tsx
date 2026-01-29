import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  Send,
  MessageCircle,
  Loader2,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { format } from "date-fns";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface BookiChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
}

export function BookiChatWidget({
  isOpen,
  onClose,
  onToggleMinimize,
  isMinimized = false,
}: BookiChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm **Booki**, your AI sales assistant. I can help you with:\n\n• Checking hall availability\n• Finding booking information\n• Payment follow-up reminders\n• Converting soft reservations\n• Sales insights and tips\n\nHow can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: bookings = [] } = trpc.bookings.list.useQuery();
  const { data: halls = [] } = trpc.banquetHalls.list.useQuery();

  const chatMutation = trpc.booki.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I apologize, but I encountered an issue. Please try again or rephrase your question.",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);

    // Build context for Booki
    const context = {
      totalBookings: bookings.length,
      softReservations: bookings.filter(
        (b) => (b.status as string) === "soft_reservation" || (b.status as string) === "soft reservation"
      ).length,
      confirmedBookings: bookings.filter((b) => b.status === "confirmed").length,
      halls: halls.map((h) => ({ name: h.name, capacity: h.capacity })),
      recentBookings: bookings.slice(0, 5).map((b) => ({
        clientName: b.clientName,
        eventDate: b.eventDate,
        status: b.status,
        amount: b.totalAmount,
      })),
    };

    chatMutation.mutate({
      message: userMessage,
      context: JSON.stringify(context),
      conversationHistory: messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? "w-72 h-14" : "w-96 h-[500px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Booki</h3>
            <p className="text-gray-400 text-xs">AI Sales Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/10"
              onClick={onToggleMinimize}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm max-w-none">
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {format(message.timestamp, "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">
                        Booki is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Booki anything..."
                className="flex-1 rounded-xl border-gray-200"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-xl bg-gray-900 hover:bg-gray-800"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Booki can help with bookings, availability & sales insights
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Floating trigger button
export function BookiChatTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-2 border-white/20"
    >
      <div className="relative">
        <MessageCircle className="h-6 w-6 text-white drop-shadow-md" />
        <Sparkles className="h-3 w-3 text-yellow-200 absolute -top-1 -right-1 animate-pulse" />
      </div>
    </Button>
  );
}
