import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  FileText, 
  Search, 
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Users,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExamSchema, insertExamResultSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Exam, ExamResult, Student, Batch, Course } from "@shared/schema";
import { z } from "zod";

const examFormSchema = insertExamSchema.extend({
  title: z.string().min(1, "Exam title is required"),
  batchId: z.number().min(1, "Batch is required"),
  examDate: z.date(),
  totalMarks: z.number().min(1, "Total marks is required"),
});

const resultFormSchema = insertExamResultSchema.extend({
  examId: z.number().min(1, "Exam is required"),
  studentId: z.number().min(1, "Student is required"),
  marksObtained: z.number().min(0, "Marks obtained is required"),
});

export default function Exams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("exams");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: examResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/exam-results"],
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

  const examForm = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      type: "written",
      batchId: undefined,
      examDate: new Date(),
      duration: 120,
      totalMarks: 100,
      instructions: "",
    },
  });

  const resultForm = useForm<z.infer<typeof resultFormSchema>>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      examId: undefined,
      studentId: undefined,
      marksObtained: 0,
      grade: "",
      remarks: "",
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof examFormSchema>) => {
      const response = await apiRequest("POST", "/api/exams", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      setIsExamDialogOpen(false);
      examForm.reset();
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create exam",
        variant: "destructive",
      });
    },
  });

  const createResultMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resultFormSchema>) => {
      const response = await apiRequest("POST", "/api/exam-results", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-results"] });
      setIsResultDialogOpen(false);
      resultForm.reset();
      toast({
        title: "Success",
        description: "Exam result added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add exam result",
        variant: "destructive",
      });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive",
      });
    },
  });

  const onExamSubmit = (data: z.infer<typeof examFormSchema>) => {
    createExamMutation.mutate(data);
  };

  const onResultSubmit = (data: z.infer<typeof resultFormSchema>) => {
    createResultMutation.mutate(data);
  };

  const filteredExams = exams?.filter((exam: Exam) => {
    const batch = batches?.find((b: Batch) => b.id === exam.batchId);
    const course = courses?.find((c: Course) => c.id === batch?.courseId);
    
    const matchesSearch = 
      exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = batchFilter === "all" || batch?.id === parseInt(batchFilter);

    return matchesSearch && matchesBatch;
  }) || [];

  const filteredResults = examResults?.filter((result: ExamResult) => {
    const exam = exams?.find((e: Exam) => e.id === result.examId);
    const student = students?.find((s: Student) => s.id === result.studentId);
    const batch = batches?.find((b: Batch) => b.id === exam?.batchId);
    
    const matchesSearch = 
      student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = batchFilter === "all" || batch?.id === parseInt(batchFilter);

    return matchesSearch && matchesBatch;
  }) || [];

  // Calculate statistics
  const totalExams = exams?.length || 0;
  const upcomingExams = exams?.filter((e: Exam) => new Date(e.examDate || '') > new Date()).length || 0;
  const completedExams = exams?.filter((e: Exam) => new Date(e.examDate || '') <= new Date()).length || 0;
  const totalResults = examResults?.length || 0;
  const averageScore = totalResults > 0 ? 
    (examResults?.reduce((sum: number, result: ExamResult) => sum + (result.marksObtained || 0), 0) / totalResults).toFixed(1) : 0;

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "A": return "text-green-600 bg-green-100";
      case "B": return "text-blue-600 bg-blue-100";
      case "C": return "text-yellow-600 bg-yellow-100";
      case "D": return "text-orange-600 bg-orange-100";
      case "F": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (examsLoading || resultsLoading) {
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
          <h1 className="text-2xl font-bold text-slate-900">Exam Management</h1>
          <p className="text-slate-600 mt-1">Manage exams, results, and student performance tracking.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus size={16} className="mr-2" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <Form {...examForm}>
                <form onSubmit={examForm.handleSubmit(onExamSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={examForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Mid-term Exam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={examForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="written">Written</SelectItem>
                              <SelectItem value="oral">Oral</SelectItem>
                              <SelectItem value="practical">Practical</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={examForm.control}
                      name="batchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select batch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {batches?.map((batch: Batch) => {
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
                      control={examForm.control}
                      name="examDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Date</FormLabel>
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
                    <FormField
                      control={examForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="120" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={examForm.control}
                      name="totalMarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Marks</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={examForm.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter exam instructions..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end space-x-4 pt-6">
                    <Button type="button" variant="outline" onClick={() => setIsExamDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createExamMutation.isPending}>
                      {createExamMutation.isPending ? "Creating..." : "Create Exam"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Award size={16} className="mr-2" />
                Add Result
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Exam Result</DialogTitle>
              </DialogHeader>
              <Form {...resultForm}>
                <form onSubmit={resultForm.handleSubmit(onResultSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={resultForm.control}
                      name="examId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exam" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {exams?.map((exam: Exam) => (
                                <SelectItem key={exam.id} value={exam.id.toString()}>
                                  {exam.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resultForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
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
                    <FormField
                      control={resultForm.control}
                      name="marksObtained"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marks Obtained</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="85" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resultForm.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <FormControl>
                            <Input placeholder="A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={resultForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter remarks..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end space-x-4 pt-6">
                    <Button type="button" variant="outline" onClick={() => setIsResultDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createResultMutation.isPending}>
                      {createResultMutation.isPending ? "Adding..." : "Add Result"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Exams</p>
                <p className="text-2xl font-bold text-slate-900">{totalExams}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming</p>
                <p className="text-2xl font-bold text-orange-600">{upcomingExams}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedExams}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Results</p>
                <p className="text-2xl font-bold text-slate-900">{totalResults}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Average Score</p>
                <p className="text-2xl font-bold text-slate-900">{averageScore}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-yellow-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Exams and Results */}
      <Tabs defaultValue="exams" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-6">
          <Card className="glass-card rounded-2xl shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>All Exams ({filteredExams.length})</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      placeholder="Search exams..."
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExams.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Exam</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Course/Batch</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Duration</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Total Marks</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredExams.map((exam: Exam) => {
                        const batch = batches?.find((b: Batch) => b.id === exam.batchId);
                        const course = courses?.find((c: Course) => c.id === batch?.courseId);
                        
                        return (
                          <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{exam.title}</p>
                                  <p className="text-sm text-slate-500">ID: EXM{exam.id.toString().padStart(3, '0')}</p>
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
                              <p className="text-sm text-slate-600">
                                {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "Not set"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">{exam.duration || 0} mins</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">{exam.totalMarks || 0} marks</p>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="secondary">
                                {exam.type || "written"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye size={14} />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit size={14} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteExamMutation.mutate(exam.id)}
                                  disabled={deleteExamMutation.isPending}
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
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first exam."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsExamDialogOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Create Exam
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card className="glass-card rounded-2xl shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Exam Results ({filteredResults.length})</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      placeholder="Search results..."
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Exam</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Marks</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Grade</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Percentage</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Remarks</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredResults.map((result: ExamResult) => {
                        const exam = exams?.find((e: Exam) => e.id === result.examId);
                        const student = students?.find((s: Student) => s.id === result.studentId);
                        const percentage = exam?.totalMarks ? ((result.marksObtained || 0) / exam.totalMarks * 100).toFixed(1) : 0;
                        
                        return (
                          <tr key={result.id} className="hover:bg-gray-50 transition-colors">
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
                              <p className="text-sm text-slate-900 font-medium">{exam?.title || "Unknown Exam"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">{result.marksObtained || 0}/{exam?.totalMarks || 0}</p>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={getGradeColor(result.grade || "")}>
                                {result.grade || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">{percentage}%</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">{result.remarks || "-"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye size={14} />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit size={14} />
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Try adjusting your search criteria." : "Get started by adding exam results."}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsResultDialogOpen(true)}>
                      <Award size={16} className="mr-2" />
                      Add Result
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