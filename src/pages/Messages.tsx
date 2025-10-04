import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Mail, MailOpen, Send, Plus, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";
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
  message_type: 'support' | 'general' | 'urgent' | 'admin_broadcast';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  sender_profile?: {
    full_name: string;
    team_code: string | null;
  };
  recipient_profile?: {
    full_name: string;
    team_code: string | null;
  };
}

interface User {
  id: string;
  full_name: string;
  team_code: string | null;
  role: string;
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: "",
    message_type: "support" as const,
    recipient_id: ""
  });
  const [replyContent, setReplyContent] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    setIsAdmin(profile?.role === 'admin');

    await Promise.all([fetchMessages(), fetchUsers()]);
  };

  const fetchMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let query = supabase
      .from("messages")
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey(full_name, team_code),
        recipient_profile:profiles!messages_recipient_id_fkey(full_name, team_code)
      `)
      .order("created_at", { ascending: false });

    if (isAdmin) {
      // Admins see all messages
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
    } else {
      // Regular users see messages sent to them or sent by them
      const { data, error } = await query
        .or(`recipient_id.eq.${session.user.id},sender_id.eq.${session.user.id}`);
      
      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, team_code, role')
      .order('full_name');

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setUsers(data || []);
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

  const handleSendMessage = async () => {
    if (!newMessage.title.trim() || !newMessage.content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isAdmin && !newMessage.recipient_id) {
      // For non-admin users, send to admin
      const adminUser = users.find(u => u.role === 'admin');
      if (!adminUser) {
        toast.error("No admin found to send message to");
        return;
      }
      newMessage.recipient_id = adminUser.id;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          title: newMessage.title,
          content: newMessage.content,
          message_type: newMessage.message_type,
          sender_id: currentUserId,
          recipient_id: newMessage.recipient_id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setNewMessage({ title: "", content: "", message_type: "support", recipient_id: "" });
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleReply = async (originalMessage: Message) => {
    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          title: `Re: ${originalMessage.title}`,
          content: replyContent,
          message_type: 'general',
          sender_id: currentUserId,
          recipient_id: originalMessage.sender_id,
          status: 'pending'
        });

      if (error) throw error;

      // Update original message status if admin is replying
      if (isAdmin) {
        await supabase
          .from('messages')
          .update({ status: 'in_progress' })
          .eq('id', originalMessage.id);
      }

      toast.success("Reply sent successfully!");
      setReplyContent("");
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to send reply");
    }
  };

  const handleUpdateStatus = async (messageId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status })
        .eq('id', messageId);

      if (error) throw error;

      toast.success("Message status updated");
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;
  const inboxMessages = messages.filter(m => m.recipient_id === currentUserId);
  const sentMessages = messages.filter(m => m.sender_id === currentUserId);

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'support':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'admin_broadcast':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600 border-blue-300"><MessageSquare className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="text-gray-600 border-gray-300">Closed</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Manage participant communications" : "Contact support and view responses"}
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send New Message</DialogTitle>
              </DialogHeader>
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
                
                {isAdmin && (
                  <div>
                    <Label htmlFor="recipient">Recipient</Label>
                    <select
                      id="recipient"
                      value={newMessage.recipient_id}
                      onChange={(e) => setNewMessage({ ...newMessage, recipient_id: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select recipient</option>
                      {users.filter(u => u.role !== 'admin').map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.team_code || 'Individual'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="type">Message Type</Label>
                  <select
                    id="type"
                    value={newMessage.message_type}
                    onChange={(e) => setNewMessage({ ...newMessage, message_type: e.target.value as any })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="support">Support Request</option>
                    <option value="general">General Question</option>
                    <option value="urgent">Urgent Issue</option>
                    {isAdmin && <option value="admin_broadcast">Admin Broadcast</option>}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    placeholder="Enter your message..."
                    rows={6}
                  />
                </div>
                
                <Button onClick={handleSendMessage} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inbox">
              Inbox ({inboxMessages.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentMessages.length})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="all">
                All Messages ({messages.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="inbox">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Inbox
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inboxMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No messages yet</p>
                  ) : (
                    <div className="space-y-3">
                      {inboxMessages.map((message) => (
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
                          <div className="flex items-start gap-3">
                            {getMessageTypeIcon(message.message_type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate">{message.title}</h3>
                                {getStatusBadge(message.status)}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {message.content}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-muted-foreground">
                                  From: {message.sender_profile?.full_name || 'Unknown'}
                                  {message.sender_profile?.team_code && ` (${message.sender_profile.team_code})`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Message Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMessage ? (
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-bold">{selectedMessage.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          {getMessageTypeIcon(selectedMessage.message_type)}
                          {getStatusBadge(selectedMessage.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          From: {selectedMessage.sender_profile?.full_name || 'Unknown'}
                          {selectedMessage.sender_profile?.team_code && ` (${selectedMessage.sender_profile.team_code})`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <p>{selectedMessage.content}</p>
                      </div>
                      
                      {isAdmin && selectedMessage.sender_id !== currentUserId && (
                        <div className="pt-4 border-t">
                          <Label htmlFor="reply">Reply</Label>
                          <Textarea
                            id="reply"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Type your reply..."
                            rows={3}
                            className="mt-1"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button onClick={() => handleReply(selectedMessage)} size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Send Reply
                            </Button>
                            <Button 
                              onClick={() => handleUpdateStatus(selectedMessage.id, 'in_progress')} 
                              variant="outline" 
                              size="sm"
                            >
                              Mark In Progress
                            </Button>
                            <Button 
                              onClick={() => handleUpdateStatus(selectedMessage.id, 'resolved')} 
                              variant="outline" 
                              size="sm"
                            >
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Select a message to view details
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Sent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentMessages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sent messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {sentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start gap-3">
                          {getMessageTypeIcon(message.message_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">{message.title}</h3>
                              {getStatusBadge(message.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">
                                To: {message.recipient_profile?.full_name || 'Unknown'}
                                {message.recipient_profile?.team_code && ` (${message.recipient_profile.team_code})`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="all">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    All Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start gap-3">
                          {getMessageTypeIcon(message.message_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">{message.title}</h3>
                              {getStatusBadge(message.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">
                                {message.sender_id === currentUserId ? 'Sent to' : 'From'}: {
                                  message.sender_id === currentUserId 
                                    ? message.recipient_profile?.full_name || 'Unknown'
                                    : message.sender_profile?.full_name || 'Unknown'
                                }
                                {message.sender_id === currentUserId 
                                  ? message.recipient_profile?.team_code && ` (${message.recipient_profile.team_code})`
                                  : message.sender_profile?.team_code && ` (${message.sender_profile.team_code})`
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Messages;