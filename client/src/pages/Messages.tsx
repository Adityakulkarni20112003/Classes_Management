import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Send,
  Users,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, Student, Batch } from "@shared/schema";
import { z } from "zod";

const messageFormSchema = insertMessageSchema.extend({
  recipientType: z.string().min(1, "Recipient type is required"),
  recipientId: z.number().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
  type: z.string().min(1, "Message type is required"),
});

const messageTemplates = {
  attendance: {
    subject: "Attendance Alert - {studentName}",
    content: "Dear Parent,\n\nWe wanted to inform you that {studentName} was absent from class today ({date}).\n\nIf there's a valid reason for the absence, please contact us.\n\nBest regards,\nEduPro Team"
  },
  fees: {
    subject: "Fee Payment Reminder - {studentName}",
    content: "Dear Parent,\n\nThis is a friendly reminder that the fee payment for {studentName} is due on {dueDate}.\n\nAmount Due: ₹{amount}\n\nPlease make the payment at your earliest convenience.\n\nThank you,\nEduPro Team"
  },
  results: {
    subject: "Exam Results - {studentName}",
    content: "Dear Parent,\n\nWe're pleased to share {studentName}'s exam results:\n\nExam: {examName}\nMarks: {marks}/{totalMarks}\nGrade: {grade}\n\nCongratulations on the performance!\n\nBest regards,\nEduPro Team"
  },
  announcement: {
    subject: "Important Announcement",
    content: "Dear Students/Parents,\n\nWe have an important announcement to share with you.\n\n[Your announcement here]\n\nThank you for your attention.\n\nBest regards,\nEduPro Team"
  }
};

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("compose");
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const { toast } = useToast();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: batches } = useQuery({
    queryKey: ["/api/batches"],
  });

  const form = useForm<z.infer<typeof messageFormSchema>>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipientType: "",
      recipientId: undefined,
      subject: "",
      content: "",
      type: "",
      sentBy: "Admin",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageFormSchema>) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setIsComposeDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof messageFormSchema>) => {
    sendMessageMutation.mutate(data);
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = messageTemplates[templateKey as keyof typeof messageTemplates];
    if (template) {
      form.setValue("subject", template.subject);
      form.setValue("content", template.content);
    }
  };

  const filteredMessages = messages?.filter((message: Message) =>
    message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.recipientType?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate message statistics
  const totalMessages = messages?.length || 0;
  const sentMessages = messages?.filter((m: Message) => m.status === "sent").length || 0;
  const deliveredMessages = messages?.filter((m: Message) => m.status === "delivered").length || 0;
  const readMessages = messages?.filter((m: Message) => m.status === "read").length || 0;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Message Center</h1>
          <p className="text-slate-600 mt-1">Send announcements, reminders, and communicate with students and parents.</p>
        </div>
        <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary-600 hover:bg-primary-700 text-white">
              <Plus size={16} className="mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="recipientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipient type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Individual Student</SelectItem>
                            <SelectItem value="batch">Entire Batch</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={!form.watch("recipientType")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("recipientType") === "student" && students?.map((student: Student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.firstName} {student.lastName}
                              </SelectItem>
                            ))}
                            {form.watch("recipientType") === "batch" && batches?.map((batch: Batch) => (
                              <SelectItem key={batch.id} value={batch.id.toString()}>
                                {batch.name}
                              </SelectItem>
                            ))}
                            {form.watch("recipientType") === "parent" && students?.map((student: Student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.parentName || `${student.firstName}'s Parent`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select message type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="announcement">Announcement</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                            <SelectItem value="alert">Alert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Message Templates */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message Templates</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(messageTemplates).map(([key, template]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={selectedTemplate === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTemplateSelect(key)}
                        className="text-xs"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter message subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your message here..." 
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsComposeDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary-600 hover:bg-primary-700"
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Message Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Messages</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{totalMessages}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Sent</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{sentMessages}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Send className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Delivered</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{deliveredMessages}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Read</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{readMessages}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Mail className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message History */}
      <Card className="glass-card rounded-2xl shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Message History ({filteredMessages.length})</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length > 0 ? (
            <div className="space-y-4">
              {filteredMessages.map((message: Message) => (
                <div key={message.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                        {message.type === "announcement" && <AlertCircle size={18} />}
                        {message.type === "reminder" && <Clock size={18} />}
                        {message.type === "alert" && <AlertCircle size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-slate-900">{message.subject}</h4>
                          <Badge variant="outline" className="text-xs">
                            {message.type}
                          </Badge>
                          <Badge 
                            variant={
                              message.status === "sent" ? "secondary" :
                              message.status === "delivered" ? "default" :
                              message.status === "read" ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            {message.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{message.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>To: {message.recipientType}</span>
                          <span>By: {message.sentBy}</span>
                          <span>{message.sentAt ? new Date(message.sentAt).toLocaleDateString() : "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <FileText size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by sending your first message."}
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  onClick={() => setIsComposeDialogOpen(true)}
                >
                  <Plus size={16} className="mr-2" />
                  Send First Message
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Attendance Alerts</h4>
                <p className="text-sm text-slate-600 mt-1">Send absence notifications to parents</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="text-white" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Fee Reminders</h4>
                <p className="text-sm text-slate-600 mt-1">Notify parents about pending fees</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="text-white" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Bulk Announcements</h4>
                <p className="text-sm text-slate-600 mt-1">Send messages to entire batches</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="text-white" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
