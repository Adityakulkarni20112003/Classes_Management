import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAttendanceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Attendance, Batch, Student } from "@shared/schema";
import { z } from "zod";

const attendanceFormSchema = insertAttendanceSchema.extend({
  studentId: z.number().min(1, "Student is required"),
  batchId: z.number().min(1, "Batch is required"),
  status: z.string().min(1, "Status is required"),
});

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance"],
  });

  const { data: batches } = useQuery({
    queryKey: ["/api/batches"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const form = useForm<z.infer<typeof attendanceFormSchema>>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      studentId: undefined,
      batchId: undefined,
      status: "",
      remarks: "",
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof attendanceFormSchema>) => {
      const attendanceData = {
        ...data,
        date: new Date(selectedDate),
      };
      const response = await apiRequest("POST", "/api/attendance", attendanceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setIsMarkDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof attendanceFormSchema>) => {
    markAttendanceMutation.mutate(data);
  };

  // Filter attendance by selected date
  const selectedDateAttendance = attendance?.filter((record: Attendance) => {
    if (!record.date) return false;
    const recordDate = new Date(record.date).toISOString().split('T')[0];
    return recordDate === selectedDate;
  }) || [];

  // Filter by search term
  const filteredAttendance = selectedDateAttendance.filter((record: Attendance) => {
    const student = students?.find((s: Student) => s.id === record.studentId);
    const batch = batches?.find((b: Batch) => b.id === record.batchId);
    return (
      `${student?.firstName} ${student?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate attendance statistics
  const totalRecords = selectedDateAttendance.length;
  const presentCount = selectedDateAttendance.filter((r: Attendance) => r.status === "present").length;
  const absentCount = selectedDateAttendance.filter((r: Attendance) => r.status === "absent").length;
  const lateCount = selectedDateAttendance.filter((r: Attendance) => r.status === "late").length;
  const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(1) : 0;

  if (attendanceLoading) {
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
          <h1 className="text-2xl font-bold text-slate-900">Attendance Management</h1>
          <p className="text-slate-600 mt-1">Track and manage student attendance across all batches.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                <Plus size={16} className="mr-2" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="batchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a batch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {batches?.map((batch: Batch) => (
                                <SelectItem key={batch.id} value={batch.id.toString()}>
                                  {batch.name}
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
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students?.map((student: Student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.firstName} {student.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center pt-6">
                      <p className="text-sm text-slate-600">
                        Date: {new Date(selectedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end space-x-4 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsMarkDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={markAttendanceMutation.isPending}
                    >
                      {markAttendanceMutation.isPending ? "Marking..." : "Mark Attendance"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{totalRecords}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Present</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{presentCount}</p>
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
                <p className="text-slate-600 text-sm font-medium">Absent</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{absentCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <XCircle className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{attendanceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card className="glass-card rounded-2xl shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>
              Attendance for {new Date(selectedDate).toLocaleDateString()} ({filteredAttendance.length} records)
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search students..."
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
          {filteredAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Batch</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.map((record: Attendance) => {
                    const student = students?.find((s: Student) => s.id === record.studentId);
                    const batch = batches?.find((b: Batch) => b.id === record.batchId);
                    
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                              {student?.firstName?.[0]}{student?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {student ? `${student.firstName} ${student.lastName}` : "Unknown"}
                              </p>
                              <p className="text-sm text-slate-500">
                                ID: STU{student?.id.toString().padStart(3, '0')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-900">{batch?.name || "N/A"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={
                              record.status === "present" ? "default" :
                              record.status === "late" ? "secondary" :
                              "destructive"
                            }
                          >
                            <div className="flex items-center space-x-1">
                              {record.status === "present" && <CheckCircle size={12} />}
                              {record.status === "absent" && <XCircle size={12} />}
                              {record.status === "late" && <Clock size={12} />}
                              <span className="capitalize">{record.status}</span>
                            </div>
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-600">
                            {record.date ? new Date(record.date).toLocaleTimeString() : "N/A"}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-600">{record.remarks || "No remarks"}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 
                  "Try adjusting your search criteria." : 
                  `No attendance has been marked for ${new Date(selectedDate).toLocaleDateString()}.`
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  onClick={() => setIsMarkDialogOpen(true)}
                >
                  <Plus size={16} className="mr-2" />
                  Mark First Attendance
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
