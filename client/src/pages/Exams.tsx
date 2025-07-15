import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExamSchema, insertExamResultSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Exam, ExamResult, Batch, Student } from "@shared/schema";
import { z } from "zod";

const examFormSchema = insertExamSchema.extend({
  title: z.string().min(1, "Exam title is required"),
  batchId: z.number().min(1, "Batch is required"),
  totalMarks: z.number().min(1, "Total marks must be greater than 0"),
  duration: z.number().min(1, "Duration must be greater than 0"),
});

const resultFormSchema = insertExamResultSchema.extend({
  examId: z.number().min(1, "Exam is required"),
  studentId: z.number().min(1, "Student is required"),
  marksObtained: z.number().min(0, "Marks cannot be negative"),
});

export default function Exams() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const { data: batches } = useQuery({
    queryKey: ["/api/batches"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const examForm = useForm<z.infer<typeof examFormSchema>>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      batchId: undefined,
      totalMarks: undefined,
      duration: undefined,
      type: "",
      instructions: "",
    },
  });

  const resultForm = useForm<z.infer<typeof resultFormSchema>>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      examId: undefined,
      studentId: undefined,
      marksObtained: undefined,
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

  const onExamSubmit = (data: z.infer<typeof examFormSchema>) => {
    createExamMutation.mutate(data);
  };

  const onResultSubmit = (data: z.infer<typeof resultFormSchema>) => {
    createResultMutation.mutate(data);
  };

  const filteredExams = exams?.filter((exam: Exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.type?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredResults = examResults?.filter((result: ExamResult) => {
    const exam = exams?.find((e: Exam) => e.id === result.examId);
    const student = students?.find((s: Student) => s.id === result.studentId);
    return (
      exam?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${student?.firstName} ${student?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

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
          <h1 className="text-2xl font-bold text-slate-900">Exams & Assessment</h1>
          <p className="text-slate-600 mt-1">Manage exams, tests, and track student performance.</p>
        </div>
      </div>

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
                      className="pl-10 w-80"
                    />
                  </div>
                  <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                        <Plus size={16} className="mr-2" />
                        Schedule Exam
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Schedule New Exam</DialogTitle>
                      </DialogHeader>
                      <Form {...examForm}>
                        <form onSubmit={examForm.handleSubmit(onExamSubmit)} className="space-y-6">
                          <FormField
                            control={examForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exam Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Mathematics Mid-term Exam" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={examForm.control}
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
                              control={examForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Exam Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select exam type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="quiz">Quiz</SelectItem>
                                      <SelectItem value="midterm">Mid-term</SelectItem>
                                      <SelectItem value="final">Final</SelectItem>
                                      <SelectItem value="assignment">Assignment</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                                  <Input placeholder="Exam instructions..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsExamDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-primary-600 hover:bg-primary-700"
                              disabled={createExamMutation.isPending}
                            >
                              {createExamMutation.isPending ? "Scheduling..." : "Schedule Exam"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
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
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Batch</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Total Marks</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Duration</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredExams.map((exam: Exam) => {
                        const batch = batches?.find((b: Batch) => b.id === exam.batchId);
                        
                        return (
                          <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-medium">
                                  <ClipboardCheck size={18} />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{exam.title}</p>
                                  <p className="text-sm text-slate-500">ID: EX{exam.id.toString().padStart(3, '0')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-900">{batch?.name || "N/A"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline">
                                {exam.type || "General"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-900">{exam.totalMarks || "N/A"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-1">
                                <Clock size={14} className="text-slate-400" />
                                <span className="text-sm text-slate-900">{exam.duration || "N/A"} min</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">
                                {exam.examDate ? new Date(exam.examDate).toLocaleDateString() : "Not scheduled"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye size={14} />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit size={14} />
                                </Button>
                                <Button variant="ghost" size="sm">
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
                  <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Try adjusting your search criteria." : "Get started by scheduling your first exam."}
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                      onClick={() => setIsExamDialogOpen(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Schedule First Exam
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
                      className="pl-10 w-80"
                    />
                  </div>
                  <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                        <Plus size={16} className="mr-2" />
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
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    value={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an exam" />
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
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select grade" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="A+">A+</SelectItem>
                                      <SelectItem value="A">A</SelectItem>
                                      <SelectItem value="B+">B+</SelectItem>
                                      <SelectItem value="B">B</SelectItem>
                                      <SelectItem value="C+">C+</SelectItem>
                                      <SelectItem value="C">C</SelectItem>
                                      <SelectItem value="D">D</SelectItem>
                                      <SelectItem value="F">F</SelectItem>
                                    </SelectContent>
                                  </Select>
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
                                  <Input placeholder="Optional remarks..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsResultDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-primary-600 hover:bg-primary-700"
                              disabled={createResultMutation.isPending}
                            >
                              {createResultMutation.isPending ? "Adding..." : "Add Result"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
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
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Performance</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Remarks</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredResults.map((result: ExamResult) => {
                        const exam = exams?.find((e: Exam) => e.id === result.examId);
                        const student = students?.find((s: Student) => s.id === result.studentId);
                        const percentage = exam?.totalMarks ? 
                          ((result.marksObtained || 0) / exam.totalMarks * 100).toFixed(1) : 0;
                        
                        return (
                          <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                  {student?.firstName?.[0]}{student?.lastName?.[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {student ? `${student.firstName} ${student.lastName}` : "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-900">{exam?.title || "N/A"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-900">
                                {result.marksObtained}/{exam?.totalMarks}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <Badge 
                                variant={
                                  result.grade === "A+" || result.grade === "A" ? "default" :
                                  result.grade === "B+" || result.grade === "B" ? "secondary" :
                                  "outline"
                                }
                              >
                                {result.grade || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      Number(percentage) >= 90 ? "bg-green-500" :
                                      Number(percentage) >= 75 ? "bg-yellow-500" :
                                      Number(percentage) >= 60 ? "bg-orange-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-700">{percentage}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">{result.remarks || "No remarks"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye size={14} />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit size={14} />
                                </Button>
                                <Button variant="ghost" size="sm">
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
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Try adjusting your search criteria." : "Get started by adding exam results."}
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                      onClick={() => setIsResultDialogOpen(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Add First Result
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
