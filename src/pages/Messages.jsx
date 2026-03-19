import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import EmptyState from "../components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(true);
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const convIdFromUrl = urlParams.get("conversation");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);

    const allConvs = await base44.entities.Conversation.list("-last_message_date");
    const myConvs = allConvs.filter((c) => c.participants?.includes(u.email));
    setConversations(myConvs);

    if (convIdFromUrl) {
      const conv = myConvs.find((c) => c.id === convIdFromUrl);
      if (conv) {
        setActiveConv(conv);
        setShowList(false);
        await loadMessages(conv.id);
      }
    }
    setLoading(false);
  };

  const loadMessages = async (convId) => {
    const msgs = await base44.entities.Message.filter({ conversation_id: convId }, "created_date");
    setMessages(msgs);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    setShowList(false);
    await loadMessages(conv.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;
    setSending(true);
    const myProfile = (await base44.entities.FounderProfile.filter({ user_email: user.email }))[0];

    const msg = await base44.entities.Message.create({
      conversation_id: activeConv.id,
      sender_email: user.email,
      sender_name: myProfile?.full_name || user.full_name,
      content: newMessage.trim(),
    });

    await base44.entities.Conversation.update(activeConv.id, {
      last_message: newMessage.trim().slice(0, 100),
      last_message_date: new Date().toISOString(),
      last_sender: user.email,
    });

    setMessages([...messages, msg]);
    setNewMessage("");
    setSending(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const getOtherName = (conv) => {
    if (!user || !conv.participants) return "Unknown";
    const idx = conv.participants.indexOf(user.email);
    const otherIdx = idx === 0 ? 1 : 0;
    return conv.participant_names?.[otherIdx] || conv.participants[otherIdx] || "Unknown";
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const otherName = getOtherName(c);
    return otherName.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="flex gap-4 h-[600px]">
          <div className="w-80 space-y-2">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
          <Skeleton className="flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">Messages</h1>

      <Card className="overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={cn(
            "w-full sm:w-80 border-r border-border flex flex-col",
            !showList && "hidden sm:flex"
          )}>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length > 0 ? (
                filteredConvs.map((conv) => {
                  const otherName = getOtherName(conv);
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-muted/50",
                        isActive && "bg-primary/5 border-r-2 border-r-primary"
                      )}
                    >
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-foreground font-semibold text-sm shrink-0">
                        {getInitials(otherName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground truncate">{otherName}</span>
                          {conv.last_message_date && (
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              {format(new Date(conv.last_message_date), "MMM d")}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.last_sender === user?.email ? "You: " : ""}{conv.last_message}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col",
            showList && !activeConv && "hidden sm:flex"
          )}>
            {activeConv ? (
              <>
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-8 w-8"
                    onClick={() => setShowList(true)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-foreground font-semibold text-sm">
                    {getInitials(getOtherName(activeConv))}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{getOtherName(activeConv)}</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/20">
                  {messages.map((msg) => {
                    const isMe = msg.sender_email === user?.email;
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border border-border rounded-bl-md"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={cn(
                            "text-[10px] mt-1",
                            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.created_date), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-card">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 h-11 bg-muted/50"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || sending}
                      className="h-11 w-11 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the list or start a new one from a founder's profile"
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}