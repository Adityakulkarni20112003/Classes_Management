import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Plus,
  UserPlus,
  TrendingUp
} from "lucide-react";
import AddStudentDialog from "@/components/AddStudentDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  // --- Stats Calculation ---
  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter(s => s.isActive).length || 0;
  const inactiveStudents = totalStudents - activeStudents;
  // New students this month (optional)
  const newThisMonth = students
    ? students.filter(s => {
        if (!s.enrollmentDate) return false;
        const enrolled = new Date(s.enrollmentDate);
        const now = new Date();
        return enrolled.getMonth() === now.getMonth() && enrolled.getFullYear() === now.getFullYear();
      }).length
    : 0;

  const filteredStudents = students?.filter((student) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // --- Modern loading skeleton (cards & table) ---
  if (isLoading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header Section - now consistent with Teachers page */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all students in your institute.</p>
        </div>
        <div className="flex items-center space-x-2">
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
          <AddStudentDialog>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
              <Plus size={16} className="mr-2" />
              Add Student
            </Button>
          </AddStudentDialog>
        </div>
      </div>

      {/* Statistics Cards - moved BELOW header, consistent font */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Students</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeStudents}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <UserPlus className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Students</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{inactiveStudents}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Users className="text-red-600 dark:text-red-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">New This Month</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{newThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Table & etc, unchanged */}
      <Card className="dark:bg-gray-800/40 rounded-2xl shadow-lg border-none">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Student</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Contact</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Parent Info</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Enrollment Date</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{student.firstName} {student.lastName}</div>
                            <div className="text-gray-500 dark:text-gray-400">ID: STU{student.id.toString().padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="text-gray-900 dark:text-gray-300">{student.email}</div>
                        <div>{student.phone}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>{student.parentName || "-"}</div>
                        <div>{student.parentPhone || "-"}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <Badge variant={student.isActive ? "success" : "secondary"}>
                          {student.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end space-x-1">
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><Eye size={14} /></Button>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><Edit size={14} /></Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteStudentMutation.mutate(student.id)}
                            disabled={deleteStudentMutation.isPending}
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
            <div className="text-center py-16 px-6">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No students found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? "Try adjusting your search or filter." : "Get started by adding your first student."}
              </p>
              {!searchTerm && (
                 <AddStudentDialog>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                    <UserPlus size={16} className="mr-2" />
                    Add Student
                  </Button>
                </AddStudentDialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
