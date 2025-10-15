import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Mail, MailOpen, Send, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  title: string;
  content: string;
  is_read: boolean | null;
  created_at: string;
  sender_id: string | null;
  recipient_id: string | null;
  sender_profile?: {
    full_name: string;
    team_code: string | null;
  };
  recipient_profile?: {
    full_name: string;
    team_code: string | null;
  };
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: ""
  });

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setCurrentUserId(session.user.id);

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    setIsAdmin(userRole?.role === 'admin' || userRole?.role === 'owner');

    await fetchMessages();
  };

  const fetchMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey(full_name, team_code),
        recipient_profile:profiles!messages_recipient_id_fkey(full_name, team_code)
      `)
      .or(`recipient_id.eq.${session.user.id},sender_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }
    
    setMessages((data || []) as Message[]);
  };

  const handleMarkAsRead = async (message: Message) => {
    if (!message.is_read) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", message.id);
      
      fetchMessages();
    }
    setSelectedMessage(message);
  };

  const handleSendMessage = async () => {
    if (!newMessage.title || !newMessage.content) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // Find an admin to send to
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'owner'])
        .limit(1);

      const recipientId = adminRoles?.[0]?.user_id;

      if (!recipientId) {
        toast.error("No admin found to send message to");
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          title: newMessage.title,
          content: newMessage.content,
          sender_id: currentUserId,
          recipient_id: recipientId
        });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setNewMessage({ title: "", content: "" });
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const unreadCount = messages.filter(m => !m.is_read && m.recipient_id === currentUserId).length;
  const inboxMessages = messages.filter(m => m.recipient_id === currentUserId);
  const sentMessages = messages.filter(m => m.sender_id === currentUserId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with administrators
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {unreadCount} Unread
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <Card className="lg:col-span-1 card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inboxMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No messages yet</p>
                </div>
              ) : (
                inboxMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleMarkAsRead(message)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedMessage?.id === message.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.is_read ? (
                        <MailOpen className="h-4 w-4 mt-1 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 mt-1 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{message.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Message Detail / New Message */}
          <Card className="lg:col-span-2 card-enhanced">
            {selectedMessage ? (
              <>
                <CardHeader>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold">{selectedMessage.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      From: {selectedMessage.sender_profile?.full_name || 'Unknown'} • 
                      {formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    New Message to Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Subject</Label>
                      <Input
                        id="title"
                        value={newMessage.title}
                        onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                        placeholder="Enter message subject"
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Message</Label>
                      <Textarea
                        id="content"
                        value={newMessage.content}
                        onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                        placeholder="Type your message here..."
                        rows={8}
                      />
                    </div>

                    <Button onClick={handleSendMessage} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
