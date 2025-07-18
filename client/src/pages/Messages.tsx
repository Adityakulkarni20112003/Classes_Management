import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Mail,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  Clock,
  Check,
  User,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Message, Student, Teacher, Course, Batch } from "../../../../types";
import AddMessageDialog from "@/components/AddMessageDialog";

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    initialData: [],
  });
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    initialData: [],
  });
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
    initialData: [],
  });
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    initialData: [],
  });
  const { data: batches } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
    initialData: [],
  });

  const { data: parents } = useQuery({
    queryKey: ["/api/students/parents"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      const students: Student[] = await res.json();
      return students
        .filter((student) => student.parentName && student.parentPhone)
        .map((student) => ({
          id: student.id,
          name: student.parentName,
          phone: student.parentPhone,
          studentName: `${student.firstName} ${student.lastName}`,
        }));
    },
    initialData: [],
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/messages/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      // Optional: add queryClient.invalidateQueries if you use it from context for invalidation
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const filteredMessages = messages?.filter((message: Message) => {
    const matchesSearch =
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sentBy?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || message.type === typeFilter;
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100";
      case "draft": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "announcement": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "absent_students": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "fees_reminder": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "results": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getRecipientDisplay = (message: Message) => {
    if (message.recipientType === "all") { return "All Users"; }
    if (message.recipientType === "student") {
      return message.recipientId
        ? students?.find((s: Student) => s.id === message.recipientId)?.firstName + " " +
        students?.find((s: Student) => s.id === message.recipientId)?.lastName || "Student"
        : "All Students";
    }
    if (message.recipientType === "teacher") {
      return message.recipientId
        ? teachers?.find((t: Teacher) => t.id === message.recipientId)?.firstName + " " +
        teachers?.find((t: Teacher) => t.id === message.recipientId)?.lastName || "Teacher"
        : "All Teachers";
    }
    if (message.recipientType === "parent") {
      return message.recipientId
        ? parents?.find((p: any) => p.id === message.recipientId)?.name +
        ` (Parent of ${parents?.find((p: any) => p.id === message.recipientId)?.studentName})` || "Parent"
        : "All Parents";
    }
    return "Unknown";
  };

  if (messagesLoading) {
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
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messaging Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Communicate with students, teachers, and parents
          </p>
        </div>
        <AddMessageDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          students={students || []}
          teachers={teachers || []}
          courses={courses || []}
          batches={batches || []}
          parents={parents || []}
          toast={toast}
        >
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
            <Plus size={16} className="mr-2" />
            New Message
          </Button>
        </AddMessageDialog>
      </div>

      {/* Messages List */}
      <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Message History</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredMessages.length} messages
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="absent_students">Absent Students</SelectItem>
                  <SelectItem value="fees_reminder">Fees Reminder</SelectItem>
                  <SelectItem value="results">Results</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sent By
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMessages.map((message: Message) => (
                    <tr
                      key={message.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
                            <Mail size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {message.subject}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={`${getTypeColor(message.type || "announcement")} px-2 py-1 text-xs font-medium rounded-full`}>
                          {message.type === "absent_students" ? "Absent Students" :
                            message.type === "fees_reminder" ? "Fees Reminder" :
                              message.type === "results" ? "Results" :
                                "Announcement"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {message.recipientType === "all" && <Users size={16} className="text-gray-400 mr-2" />}
                          {message.recipientType === "student" && <User size={16} className="text-gray-400 mr-2" />}
                          {message.recipientType === "teacher" && <User size={16} className="text-gray-400 mr-2" />}
                          {message.recipientType === "parent" && <User size={16} className="text-gray-400 mr-2" />}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getRecipientDisplay(message)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {message.sentBy || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {message.sentAt ? new Date(message.sentAt).toLocaleDateString() : "Not sent"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {message.status === "sent" && <Check size={16} className="text-emerald-500 mr-2" />}
                          {message.status === "draft" && <Clock size={16} className="text-amber-500 mr-2" />}
                          {message.status === "failed" && <AlertCircle size={16} className="text-red-500 mr-2" />}
                          <Badge className={`${getStatusColor(message.status || "sent")} px-2 py-1 text-xs font-medium rounded-full`}>
                            {message.status || "sent"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMessageMutation.mutate(message.id)}
                            disabled={deleteMessageMutation.isPending}
                            className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No messages found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by composing your first message."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus size={16} className="mr-2" />
                  New Message
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
