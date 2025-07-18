import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  UserCheck,
  Search,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AddAttendanceDialog } from "@/components/AddAttendanceDialog";
import type { Attendance, Student, Batch, Course, Enrollment } from "@shared/schema";

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();
  const { data: attendance, isLoading: attendanceLoading } = useQuery({ queryKey: ["/api/attendance"] });
  const { data: students } = useQuery({ queryKey: ["/api/students"] });
  const { data: batches } = useQuery({ queryKey: ["/api/batches"] });
  const { data: courses } = useQuery({ queryKey: ["/api/courses"] });
  const { data: enrollments } = useQuery({ queryKey: ["/api/enrollments"] });

  // Delete mutation for attendance
  const deleteAttendanceMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/attendance/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      });
    },
  });

  // Filter and derived values
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

  const presentCount = selectedDateAttendance.filter((r: Attendance) => r.status === "present").length;
  const absentCount = selectedDateAttendance.filter((r: Attendance) => r.status === "absent").length;
  const totalCount = selectedDateAttendance.length;
  const attendanceRate = totalCount > 0 ? ((presentCount) / totalCount * 100).toFixed(1) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "absent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  if (attendanceLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 dark:bg-gray-700"></div>
          <div className="h-64 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* HEADER SECTION WITH CORRECTED FLEX ROW & BUTTON POSITION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage student attendance records
          </p>
        </div>
        <div className="flex flex-row items-center gap-2">
          {/* You can add Import/Export buttons here in the future just like Teachers page */}
          <AddAttendanceDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            courses={courses || []}
            batches={batches || []}
            students={students || []}
            enrollments={enrollments || []}
            toast={toast}
          >
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              size="lg"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus size={16} className="mr-2" />
              Mark Attendance
            </Button>
          </AddAttendanceDialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing attendance for {new Date(selectedDate).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats cards */}
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{presentCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{attendanceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Records</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredAttendance.length} records
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger className="w-full md:w-40">
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
                <SelectTrigger className="w-full md:w-40">
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
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course/Batch</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAttendance.map((record: Attendance) => {
                    const student = students?.find((s: Student) => s.id === record.studentId);
                    const batch = batches?.find((b: Batch) => b.id === record.batchId);
                    const course = courses?.find((c: Course) => c.id === batch?.courseId);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                              {student?.firstName?.[0]}{student?.lastName?.[0]}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{student?.firstName} {student?.lastName}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{student?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{course?.name || "Unknown Course"}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{batch?.name || "Unknown Batch"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={`${getStatusColor(record.status || "present")} px-2 py-1 text-xs font-medium rounded-full`}>
                            {record.status || "present"}
                          </Badge>
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
                              onClick={() => deleteAttendanceMutation.mutate(record.id)}
                              disabled={deleteAttendanceMutation.isPending}
                              className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </Button>
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
              <UserCheck className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No attendance records found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by marking attendance for students."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                >
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