import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileSignature,
  BookOpen,
  Award,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AddExamDialog from "@/components/AddExamDialog";
import AddResultDialog from "@/components/AddResultDialog";
import type { Exam, Result, Course, Batch, Student, Teacher } from "@shared/schema";

export default function Exams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [resultStatusFilter, setResultStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("exams");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: exams = [], isLoading: examsLoading } = useQuery({ queryKey: ["/api/exams"] });
  const { data: results = [] } = useQuery({ queryKey: ["/api/results"] });
  const { data: courses = [] } = useQuery({ queryKey: ["/api/courses"] });
  const { data: batches = [] } = useQuery({ queryKey: ["/api/batches"] });
  const { data: teachers = [] } = useQuery({ queryKey: ["/api/teachers"] });
  const { data: students = [] } = useQuery({ queryKey: ["/api/students"] });

  // --- Stats ---
  const totalExams = exams.length;
  const totalResults = results.length;
  const totalCourses = courses.length;
  const totalBatches = batches.length;

  // --- Filters ---
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name?.toLowerCase().includes(searchTerm.toLowerCase())
      || (courses.find(c => c.id === exam.courseId)?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && exam.isActive) ||
      (statusFilter === "inactive" && !exam.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredResults = results.filter(result => {
    const student = students.find(s => s.id === result.studentId);
    const matchesSearch = batchSearchTerm.length === 0 || (
      student?.firstName?.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(batchSearchTerm.toLowerCase())
    );
    const matchesStatus =
      resultStatusFilter === "all" ||
      (resultStatusFilter === "pass" && result.status === "pass") ||
      (resultStatusFilter === "fail" && result.status === "fail");
    return matchesSearch && matchesStatus;
  });

  // --- Loading Skeleton ---
  if (examsLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2"></div>
            <div className="w-72 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </div>
        </div>
        {/* Statistic Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-md">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 mb-4 rounded animate-pulse" />
                  <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Tab skeleton */}
        <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exams & Results</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage exams and publish student results
          </p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <AddExamDialog
            open={isExamDialogOpen}
            onOpenChange={setIsExamDialogOpen}
            courses={courses}
            batches={batches}
            teachers={teachers}
            toast={toast}
          >
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              onClick={() => setIsExamDialogOpen(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Exam
            </Button>
          </AddExamDialog>
          <AddResultDialog
            open={isResultDialogOpen}
            onOpenChange={setIsResultDialogOpen}
            exams={exams}
            students={students}
            courses={courses}
            batches={batches}
            toast={toast}
          >
            <Button
              variant="outline"
              className="border-green-200 hover:bg-green-50 text-green-600 hover:text-green-700"
              onClick={() => setIsResultDialogOpen(true)}
            >
              <Award size={16} className="mr-2" />
              Add Result
            </Button>
          </AddResultDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalExams}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <FileSignature className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Results Published</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalResults}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Award className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <BookOpen className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Batches</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalBatches}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <GraduationCap className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger
            value="exams"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600"
          >
            <FileSignature size={16} className="mr-2" />
            Exams
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-white data-[state=active]:text-green-600"
          >
            <Award size={16} className="mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">All Exams</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Showing {filteredExams.length} exams</p>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search exams or course..."
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
                      <SelectItem value="all">All Exams</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExams.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredExams.map((exam: Exam) => {
                        const course = courses.find((c: Course) => c.id === exam.courseId);
                        const batch = batches.find((b: Batch) => b.id === exam.batchId);
                        const teacher = teachers.find((t: Teacher) => t.id === exam.teacherId);
                        return (
                          <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">{exam.name?.charAt(0) || "E"}</div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{exam.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">EXM{exam.id.toString().padStart(3, "0")}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{course?.name || "-"}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{batch?.name || "-"}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {(teacher?.name || `${teacher?.firstName ?? ""} ${teacher?.lastName ?? ""}`) || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <CalendarIcon size={16} className="text-gray-400" />
                                <span className="text-sm">{exam.date ? new Date(exam.date).toLocaleDateString() : "-"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge className={exam.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                                {exam.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                  <Eye size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                  <Edit size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
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
                  <FileSignature className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No exams found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? "Try adjusting your search criteria."
                      : "Get started by creating your first exam."}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsExamDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                    >
                      <Plus size={16} className="mr-2" /> Add Exam
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-100 dark:border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">All Results</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Showing {filteredResults.length} results</p>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search results by student..."
                      value={batchSearchTerm}
                      onChange={e => setBatchSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-64"
                    />
                  </div>
                  <Select value={resultStatusFilter} onValueChange={setResultStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredResults.map((result: Result) => {
                        const student = students.find((s: Student) => s.id === result.studentId);
                        const exam = exams.find((e: Exam) => e.id === result.examId);
                        const course = courses.find((c: Course) => c.id === result.courseId);
                        const batch = batches.find((b: Batch) => b.id === result.batchId);
                        return (
                          <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {student?.firstName?.charAt(0) || "S"}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {student?.firstName} {student?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {student?.email || "-"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{exam?.name || "-"}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{course?.name || "-"}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{batch?.name || "-"}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">{result.marks ?? "-"}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge className={result.status === "pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                {result.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-1">
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                  <Eye size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                  <Edit size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
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
                  <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No results found</h3>
                  <p className="text-gray-500 mb-6">
                    {batchSearchTerm
                      ? "Try adjusting your search criteria."
                      : "Get started by publishing your first result."}
                  </p>
                  {!batchSearchTerm && (
                    <Button
                      onClick={() => setIsResultDialogOpen(true)}
                      className="bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700 text-white shadow-md"
                    >
                      <Plus size={16} className="mr-2" /> Add Result
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
