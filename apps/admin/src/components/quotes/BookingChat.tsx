"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  ScrollArea,
  Badge,
} from "@pexjet/ui";
import {
  Send,
  Loader2,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Check,
  CheckCheck,
} from "lucide-react";

interface Message {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  messageType: "UTILITY" | "FREEFORM" | "SYSTEM";
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  createdAt: string;
}

interface BookingChatProps {
  bookingId: string;
  bookingType: "charter" | "empty_leg";
  clientName: string;
  clientPhone: string;
  onMessageSent?: () => void;
}

export default function BookingChat({
  bookingId,
  bookingType,
  clientName,
  clientPhone,
  onMessageSent,
}: BookingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [bookingId, bookingType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/bookings/${bookingId}/messages?type=${bookingType}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          content: newMessage,
          type: bookingType,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
        onMessageSent?.();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "DELIVERED":
      case "READ":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Conversation with {clientName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <section className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </section>
          ) : messages.length === 0 ? (
            <section className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground">
                Messages will appear here when you or the client sends one
              </p>
            </section>
          ) : (
            <section className="space-y-4">
              {Object.entries(messageGroups).map(([dateKey, msgs]) => (
                <section key={dateKey}>
                  <section className="flex justify-center my-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(msgs[0].createdAt)}
                    </Badge>
                  </section>
                  <section className="space-y-2">
                    {msgs.map((msg) => (
                      <section
                        key={msg.id}
                        className={`flex ${
                          msg.direction === "OUTBOUND"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <article
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.direction === "OUTBOUND"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.mediaUrl && (
                            <section className="mb-2">
                              {msg.mediaType?.startsWith("image/") ? (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={msg.mediaUrl}
                                    alt="Attachment"
                                    className="max-w-full rounded max-h-48 object-cover"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm underline"
                                >
                                  <FileText className="h-4 w-4" />
                                  View Document
                                </a>
                              )}
                            </section>
                          )}
                          {msg.content && (
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          )}
                          <section
                            className={`flex items-center gap-1 mt-1 ${
                              msg.direction === "OUTBOUND"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <span
                              className={`text-xs ${
                                msg.direction === "OUTBOUND"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.direction === "OUTBOUND" &&
                              getStatusIcon(msg.status)}
                          </section>
                        </article>
                      </section>
                    ))}
                  </section>
                </section>
              ))}
            </section>
          )}
        </ScrollArea>

        <section className="p-3 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </section>
      </CardContent>
    </Card>
  );
}
