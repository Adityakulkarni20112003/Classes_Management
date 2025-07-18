import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  UserCheck, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Star,
  Plus,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  TrendingUp
} from "lucide-react";
import AddTeacherDialog from "@/components/AddTeacherDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Teacher, Course, Batch } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: batches } = useQuery({
    queryKey: ["/api/batches"],
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete teacher",
        variant: "destructive",
      });
    },
  });

  const filteredTeachers = teachers?.filter((teacher) => {
    const matchesSearch = 
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && teacher.isActive) ||
                         (statusFilter === "inactive" && !teacher.isActive);

    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate statistics
  const totalTeachers = teachers?.length || 0;
  const activeTeachers = teachers?.filter((t: Teacher) => t.isActive).length || 0;
  const inactiveTeachers = totalTeachers - activeTeachers;
  const avgExperience = teachers?.reduce((sum, t) => sum + (t.experience || 0), 0) / Math.max(totalTeachers, 1) || 0;

  // Get teacher courses and batches
  const getTeacherCourses = (teacherId: number) => {
    return courses?.filter((course: Course) => course.teacherId === teacherId) || [];
  };

  const getTeacherBatches = (teacherId: number) => {
    return batches?.filter((batch: Batch) => batch.teacherId === teacherId) || [];
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100" : 
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  };

  // --- Attendance/Fees-style loading skeleton ---
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage all teachers in your institute
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <Button 
            variant="outline" 
            className="border-gray-300 hover:bg-gray-50"
          >
            <Upload size={16} className="mr-2" />
            Import
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-300 hover:bg-gray-50"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <AddTeacherDialog>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
              <Plus size={16} className="mr-2" />
              Add Teacher
            </Button>
          </AddTeacherDialog>
        </div>
      </div>

      {/* Statistics Cards (attendance/fees style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Teachers</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <UserCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Teachers</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{inactiveTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Star className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Experience</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgExperience.toFixed(1)} yrs</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">All Teachers</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredTeachers.length} teachers
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Experience
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Courses
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Batches
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
                  {filteredTeachers.map((teacher: Teacher) => {
                    const teacherCourses = getTeacherCourses(teacher.id);
                    const teacherBatches = getTeacherBatches(teacher.id);

                    return (
                      <tr 
                        key={teacher.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {teacher.firstName} {teacher.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                TCH{teacher.id.toString().padStart(3, '0')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {teacher.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {teacher.phone || "No phone"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {teacher.specialization || "General"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {teacher.qualification || "Not specified"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {teacher.experience || 0} years
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="text-blue-600 dark:text-blue-400" size={16} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {teacherCourses.length}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="text-purple-600 dark:text-purple-400" size={16} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {teacherBatches.length}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge className={`${getStatusColor(teacher.isActive)} px-2 py-1 text-xs font-medium rounded-full`}>
                            {teacher.isActive ? "Active" : "Inactive"}
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
                              onClick={() => deleteTeacherMutation.mutate(teacher.id)}
                              disabled={deleteTeacherMutation.isPending}
                              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No teachers found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by adding your first teacher."}
              </p>
              {!searchTerm && (
                <AddTeacherDialog>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                    <Plus size={16} className="mr-2" />
                    Add Teacher
                  </Button>
                </AddTeacherDialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
