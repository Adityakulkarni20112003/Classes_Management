import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  UserCheck, 
  Search, 
  Filter,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAttendanceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Attendance, Student, Batch, Course, Enrollment } from "@shared/schema";
import { z } from "zod";

const attendanceFormSchema = insertAttendanceSchema.extend({
  // studentId field removed from form but will be set programmatically
  courseId: z.number().optional(),
  batchId: z.number().min(1, "Batch is required"),
  // status field removed from form but will be set to default value
  date: z.date(),
});

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [batchStudents, setBatchStudents] = useState<Student[]>([]);
  const { toast } = useToast();

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: batches } = useQuery({
    queryKey: ["/api/batches"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  const { data: enrollments } = useQuery({
    queryKey: ["/api/enrollments"],
  });

  const form = useForm<z.infer<typeof attendanceFormSchema>>({    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      // studentId removed from form
      courseId: undefined,
      batchId: undefined,
      // status removed from form
      date: new Date(),
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof attendanceFormSchema> & { studentId: number, status: string }) => {
      const response = await apiRequest("POST", "/api/attendance", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Attendance record created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create attendance record",
        variant: "destructive",
      });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/attendance/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Success",
        description: "Attendance status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update attendance status",
        variant: "destructive",
      });
    },
  });

  // Function to get students enrolled in a batch
  const getStudentsForBatch = (batchId: number) => {
    if (!enrollments || !students) return [];
    
    // Find enrollments for the selected batch
    const batchEnrollments = enrollments.filter((enrollment: Enrollment) => 
      enrollment.batchId === batchId && enrollment.status === "active"
    );
    
    // Get student details for each enrollment
    const batchStudents = batchEnrollments.map((enrollment: Enrollment) => {
      return students.find((student: Student) => student.id === enrollment.studentId);
    }).filter(Boolean) as Student[];
    
    return batchStudents;
  };
  
  // Update students list when batch changes
  useEffect(() => {
    if (selectedBatchId) {
      const studentsInBatch = getStudentsForBatch(selectedBatchId);
      setBatchStudents(studentsInBatch);
    } else {
      setBatchStudents([]);
    }
  }, [selectedBatchId, enrollments, students]);

  const onSubmit = (data: z.infer<typeof attendanceFormSchema>) => {
    // Form submission is now only used to select batch and date
    // Individual student attendance is marked via buttons in the student list
    // This function is kept for form validation and potential future use
    return false; // Prevent default form submission
  };

  // Filter attendance records
  const selectedDateAttendance = attendance?.filter((record: Attendance) => {
    const recordDate = new Date(record.date || '').toISOString().split('T')[0];
    return recordDate === selectedDate;
  }) || [];

  const filteredAttendance = selectedDateAttendance.filter((record: Attendance) => {
    const student = students?.find((s: Student) => s.id === record.studentId);
    const batch = batches?.find((b: Batch) => b.id === record.batchId);
    const course = courses?.find((c: Course) => c.id === batch?.courseId);
    
    const matchesSearch = 
      student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = batchFilter === "all" || batch?.id === parseInt(batchFilter);
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesBatch && matchesStatus;
  });

  // Calculate statistics for selected date
  const presentCount = selectedDateAttendance.filter((r: Attendance) => r.status === "present").length;
  const absentCount = selectedDateAttendance.filter((r: Attendance) => r.status === "absent").length;
  const lateCount = selectedDateAttendance.filter((r: Attendance) => r.status === "late").length;
  const totalCount = selectedDateAttendance.length;
  const attendanceRate = totalCount > 0 ? ((presentCount + lateCount) / totalCount * 100).toFixed(1) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "text-green-600 bg-green-100";
      case "absent": return "text-red-600 bg-red-100";
      case "late": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle size={16} className="text-green-600" />;
      case "absent": return <XCircle size={16} className="text-red-600" />;
      case "late": return <Clock size={16} className="text-yellow-600" />;
      default: return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
                <div className="grid grid-cols-2 gap-6">
                  {/* Student and Status fields removed */}
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Optionally reset batch selection when course changes
                            form.setValue("batchId", undefined);
                            setSelectedBatchId(null);
                          }}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses?.map((course: Course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.name}
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
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const batchId = parseInt(value);
                            field.onChange(batchId);
                            setSelectedBatchId(batchId);
                          }}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {batches
                              ?.filter((batch: Batch) =>
                                form.getValues().courseId
                                  ? batch.courseId === form.getValues().courseId
                                  : true
                              )
                              .map((batch: Batch) => {
                                const course = courses?.find((c: Course) => c.id === batch.courseId);
                                return (
                                  <SelectItem key={batch.id} value={batch.id.toString()}>
                                    {batch.name} - {course?.name}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Student List Table */}
                  {selectedBatchId && batchStudents.length > 0 && (
                    <div className="col-span-2 mt-4">
                      <h3 className="text-lg font-medium mb-2">Students in Selected Batch</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mark Attendance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {batchStudents.map((student, index) => (
                              <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-sm">{index + 1}</td>
                                <td className="px-4 py-3 text-sm">{student.firstName} {student.lastName}</td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex space-x-2">
                                    <Button 
                                      type="button" 
                                      size="sm" 
                                      variant="outline" 
                                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                      onClick={() => {
                                        const attendanceData = {
                                          studentId: student.id,
                                          batchId: selectedBatchId,
                                          date: form.getValues().date,
                                          status: "present"
                                        };
                                        createAttendanceMutation.mutate(attendanceData);
                                      }}
                                    >
                                      Present
                                    </Button>
                                    <Button 
                                      type="button" 
                                      size="sm" 
                                      variant="outline" 
                                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                      onClick={() => {
                                        const attendanceData = {
                                          studentId: student.id,
                                          batchId: selectedBatchId,
                                          date: form.getValues().date,
                                          status: "absent"
                                        };
                                        createAttendanceMutation.mutate(attendanceData);
                                      }}
                                    >
                                      Absent
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Selector and Statistics */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar size={20} className="text-slate-600" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="text-sm text-slate-600">
          Showing attendance for {new Date(selectedDate).toLocaleDateString()}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Late card removed */}

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-slate-900">{attendanceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card className="glass-card rounded-2xl shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records ({filteredAttendance.length})</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-60"
                />
              </div>
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches?.map((batch: Batch) => (
                    <SelectItem key={batch.id} value={batch.id.toString()}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Course/Batch</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Remarks</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.map((record: Attendance) => {
                    const student = students?.find((s: Student) => s.id === record.studentId);
                    const batch = batches?.find((b: Batch) => b.id === record.batchId);
                    const course = courses?.find((c: Course) => c.id === batch?.courseId);
                    
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                              {student?.firstName?.[0]}{student?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{student?.firstName} {student?.lastName}</p>
                              <p className="text-sm text-slate-500">{student?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-sm text-slate-900 font-medium">{course?.name || "Unknown Course"}</p>
                            <p className="text-sm text-slate-500">{batch?.name || "Unknown Batch"}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(record.status || "present")}
                            <Badge className={getStatusColor(record.status || "present")}>
                              {record.status || "present"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-600">{record.remarks || "-"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Select 
                              value={record.status || "present"}
                              onValueChange={(value) => updateAttendanceMutation.mutate({ id: record.id, status: value })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by marking attendance for students."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Mark Attendance
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}