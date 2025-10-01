import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, MailOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_id: string | null;
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("recipient_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const handleMarkAsRead = async (message: Message) => {
    if (!message.is_read) {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", message.id);

      if (!error) {
        setMessages(messages.map(m => m.id === message.id ? { ...m, is_read: true } : m));
      }
    }
    setSelectedMessage(message);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Private messages and insider tips from admins</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Messages List */}
          <Card className="lg:col-span-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Inbox
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMarkAsRead(message)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedMessage?.id === message.id
                        ? "bg-primary/10 border border-primary"
                        : message.is_read
                        ? "bg-muted/30 border border-transparent hover:border-border"
                        : "bg-primary/5 border border-primary/30 hover:border-primary"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.is_read ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground mt-1" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium text-sm truncate ${!message.is_read ? 'font-bold' : ''}`}>
                            {message.title}
                          </h4>
                          {!message.is_read && (
                            <Badge variant="default" className="text-xs bg-primary">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {message.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card className="lg:col-span-3 border-border">
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedMessage ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a message to view details</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-2xl font-bold">{selectedMessage.title}</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Received {formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
