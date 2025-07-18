import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  GraduationCap,
  Users,
  Award,
  Plus,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Course, Batch, Student, Enrollment, Teacher } from "@shared/schema";
import AddCourseDialog from "@/components/AddCourseDialog";
import AddBatchDialog from "@/components/AddBatchDialog";

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [batchStatusFilter, setBatchStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("courses");
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: courses = [], isLoading: coursesLoading } = useQuery({ queryKey: ["/api/courses"] });
  const { data: batches = [], isLoading: batchesLoading } = useQuery({ queryKey: ["/api/batches"] });
  const { data: teachers = [] } = useQuery({ queryKey: ["/api/teachers"] });
  const { data: enrollments = [] } = useQuery({ queryKey: ["/api/enrollments"] });

  // --- Stats ---
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.isActive).length;
  const totalBatches = batches.length;
  const totalStudents = enrollments.length;

  // --- Filters ---
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase())
      || course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && course.isActive) ||
      (statusFilter === "inactive" && !course.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name?.toLowerCase().includes(batchSearchTerm.toLowerCase());
    const matchesStatus =
      batchStatusFilter === "all" ||
      (batchStatusFilter === "active" && batch.isActive) ||
      (batchStatusFilter === "inactive" && !batch.isActive);
    return matchesSearch && matchesStatus;
  });

  // Utility for tables
  const getCourseBatches = (courseId: number) => batches.filter((b: Batch) => b.courseId === courseId);
  const getCourseStudents = (courseId: number) => {
    const courseBatchIds = getCourseBatches(courseId).map(b => b.id);
    return enrollments.filter(e => courseBatchIds.includes(e.batchId!));
  };
  const getBatchStudents = (batchId: number) =>
    enrollments.filter(e => e.batchId === batchId);

  // Loading skeleton (modern, with cards after header)
  if (coursesLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses & Batches</h1>
          <p className="text-sm text-gray-500">
            Manage your courses and organize students into batches
          </p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <AddCourseDialog
            open={isCourseDialogOpen}
            onOpenChange={setIsCourseDialogOpen}
            teachers={teachers}
            toast={toast}
          >
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              onClick={() => setIsCourseDialogOpen(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Course
            </Button>
          </AddCourseDialog>
          <AddBatchDialog
            open={isBatchDialogOpen}
            onOpenChange={setIsBatchDialogOpen}
            courses={courses}
            teachers={teachers}
            toast={toast}
          >
            <Button
              variant="outline"
              className="border-purple-200 hover:bg-purple-50 text-purple-600 hover:text-purple-700"
              onClick={() => setIsBatchDialogOpen(true)}
            >
              <GraduationCap size={16} className="mr-2" />
              Add Batch
            </Button>
          </AddBatchDialog>
        </div>
      </div>

      {/* Stats Cards (NOW LIKE OTHER PAGES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Courses</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCourses}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Award className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Batches</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalBatches}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <GraduationCap className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700 transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Enrollments</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Users className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:text-blue-600"> 
            <BookOpen size={16} className="mr-2" />Courses
          </TabsTrigger>
          <TabsTrigger value="batches" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">
            <GraduationCap size={16} className="mr-2" />Batches
          </TabsTrigger>
        </TabsList>
        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">All Courses</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Showing {filteredCourses.length} courses</p>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16}/>
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCourses.length > 0 ? (
                <div className="overflow-x-auto">
                  {/* table and rows here - left to your template */}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No courses found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? "Try adjusting your search criteria."
                      : "Get started by creating your first course."
                    }
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsCourseDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                    >
                      <Plus size={16} className="mr-2"/> Add Course
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">All Batches</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Showing {filteredBatches.length} batches</p>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16}/>
                    <Input
                      placeholder="Search batches..."
                      value={batchSearchTerm}
                      onChange={e => setBatchSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-64"
                    />
                  </div>
                  <Select value={batchStatusFilter} onValueChange={setBatchStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                </div>
              ) : filteredBatches.length > 0 ? (
                <div className="overflow-x-auto">
                  {/* table and rows here - left to your template */}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No batches found</h3>
                  <p className="text-gray-500 mb-6">
                    {batchSearchTerm
                      ? "Try adjusting your search criteria."
                      : "Get started by creating your first batch."
                    }
                  </p>
                  {!batchSearchTerm && (
                    <Button
                      onClick={() => setIsBatchDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                    >
                      <Plus size={16} className="mr-2"/> Add Batch
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
