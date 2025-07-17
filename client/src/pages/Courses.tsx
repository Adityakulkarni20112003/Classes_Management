import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  BookOpen, 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Award,
  TrendingUp
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
import { insertCourseSchema, insertBatchSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, Batch, Student, Enrollment, Teacher } from "@shared/schema";
import { z } from "zod";

const courseFormSchema = insertCourseSchema.extend({
  name: z.string().min(1, "Course name is required"),
  teacherId: z.number().min(1, "Teacher is required"),
});

const batchFormSchema = insertBatchSchema.extend({
  name: z.string().min(1, "Batch name is required"),
  courseId: z.number().min(1, "Course is required"),
});

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [batchStatusFilter, setBatchStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("courses");
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ["/api/batches"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: enrollments } = useQuery({
    queryKey: ["/api/enrollments"],
  });
  
  const { data: teachers } = useQuery({
    queryKey: ["/api/teachers"],
  });

  const courseForm = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: undefined,
      fee: "",
      isActive: true,
    },
  });
  
  const batchForm = useForm<z.infer<typeof batchFormSchema>>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      courseId: undefined,
      teacherId: undefined,
      capacity: 30,
      schedule: "",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseFormSchema>) => {
      const response = await apiRequest("POST", "/api/courses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCourseDialogOpen(false);
      courseForm.reset();
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof batchFormSchema>) => {
      return await apiRequest("/api/batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      setIsBatchDialogOpen(false);
      batchForm.reset();
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  const onCourseSubmit = (data: z.infer<typeof courseFormSchema>) => {
    createCourseMutation.mutate(data);
  };
  
  const onBatchSubmit = (data: z.infer<typeof batchFormSchema>) => {
    createBatchMutation.mutate(data);
  };

  const filteredCourses = courses?.filter((course: Course) => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && course.isActive) ||
                         (statusFilter === "inactive" && !course.isActive);

    return matchesSearch && matchesStatus;
  }) || [];
  
  const filteredBatches = batches?.filter((batch: Batch) => {
    const matchesSearch = batch.name?.toLowerCase().includes(batchSearchTerm.toLowerCase());
    
    const matchesStatus = batchStatusFilter === "all" || 
                         (batchStatusFilter === "active" && batch.isActive) ||
                         (batchStatusFilter === "inactive" && !batch.isActive);

    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate course statistics
  const getCourseBatches = (courseId: number) => {
    return batches?.filter((batch: Batch) => batch.courseId === courseId) || [];
  };

  const getCourseStudents = (courseId: number) => {
    const courseBatches = getCourseBatches(courseId);
    const batchIds = courseBatches.map(batch => batch.id);
    return enrollments?.filter((enrollment: Enrollment) => 
      batchIds.includes(enrollment.batchId || 0)
    ) || [];
  };

  const totalCourses = courses?.length || 0;
  const activeCourses = courses?.filter((c: Course) => c.isActive).length || 0;
  const totalBatches = batches?.length || 0;
  const totalStudents = enrollments?.length || 0;

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <div className="flex items-center space-x-3">
            <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus size={16} className="mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <Form {...courseForm}>
                  <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={courseForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter course name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={courseForm.control}
                        name="teacherId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teacher</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {teachers?.map((teacher: Teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                    {teacher.name}
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
                        control={courseForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (months)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter duration" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={courseForm.control}
                        name="fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fee (₹)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter fee amount" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={courseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter course description" 
                              className="resize-none"
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-end space-x-4 pt-6">
                      <Button type="button" variant="outline" onClick={() => setIsCourseDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createCourseMutation.isPending}
                      >
                        {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <GraduationCap size={16} className="mr-2" />
                  Add Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                </DialogHeader>
                <Form {...batchForm}>
                  <form onSubmit={batchForm.handleSubmit(onBatchSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={batchForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter batch name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={batchForm.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={batchForm.control}
                        name="teacherId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teacher</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {teachers?.map((teacher: Teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={batchForm.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter capacity" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={batchForm.control}
                      name="schedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Mon-Fri, 9:00 AM - 12:00 PM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-end space-x-4 pt-6">
                      <Button type="button" variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createBatchMutation.isPending}
                      >
                        {createBatchMutation.isPending ? "Creating..." : "Create Batch"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Courses</p>
                  <p className="text-2xl font-bold text-slate-900">{totalCourses}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Courses</p>
                  <p className="text-2xl font-bold text-green-600">{activeCourses}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Batches</p>
                  <p className="text-2xl font-bold text-purple-600">{totalBatches}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Enrollments</p>
                  <p className="text-2xl font-bold text-orange-600">{totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Courses and Batches */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="space-y-6">
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-60"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
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
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCourses.map((course: Course) => {
                              const courseBatches = getCourseBatches(course.id);
                              const courseStudents = getCourseStudents(course.id);
                              const teacher = teachers?.find((t: Teacher) => t.id === course.teacherId);
                              
                              return (
                                <tr key={course.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                        {course.name?.charAt(0) || 'C'}
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-slate-900">{course.name}</h3>
                                        <p className="text-sm text-slate-500">CRS{course.id.toString().padStart(3, '0')}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">{teacher?.name || "--"}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">{course.duration || 0} months</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">₹{course.fee || "0"}</td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Badge variant={course.isActive ? "default" : "secondary"}>
                                      {course.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <GraduationCap className="text-purple-600" size={16} />
                                      <span className="text-sm font-medium">{courseBatches.length}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <Users className="text-blue-600" size={16} />
                                      <span className="text-sm font-medium">{courseStudents.length}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end space-x-1">
                                      <Button variant="ghost" size="sm">
                                        <Eye size={14} />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Edit size={14} />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => deleteCourseMutation.mutate(course.id)}
                                        disabled={deleteCourseMutation.isPending}
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
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first course."}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsCourseDialogOpen(true)}>
                        <Plus size={16} className="mr-2" />
                        Add Course
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="batches" className="space-y-6">
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>All Batches ({filteredBatches?.length || 0})</CardTitle>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        placeholder="Search batches..."
                        value={batchSearchTerm}
                        onChange={(e) => setBatchSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-60"
                      />
                    </div>
                    <Select value={batchStatusFilter} onValueChange={setBatchStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
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
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : filteredBatches?.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
                    <p className="text-gray-500 mb-6">
                      {batchSearchTerm ? "Try adjusting your search criteria." : "Get started by creating your first batch."}
                    </p>
                    {!batchSearchTerm && (
                      <Button onClick={() => setIsBatchDialogOpen(true)}>
                        <Plus size={16} className="mr-2" />
                        Add Batch
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBatches.map((batch: Batch) => {
                              const course = courses?.find((c: Course) => c.id === batch.courseId);
                              const teacher = teachers?.find((t: Teacher) => t.id === batch.teacherId);
                              const batchEnrollments = enrollments?.filter((e: Enrollment) => e.batchId === batch.id) || [];
                              
                              return (
                                <tr key={batch.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                        {batch.name?.charAt(0) || 'B'}
                                      </div>
                                      <div>
                                        <div className="font-medium text-slate-900">{batch.name}</div>
                                        <div className="text-sm text-slate-500">BTH{batch.id.toString().padStart(3, '0')}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <BookOpen className="text-blue-600" size={16} />
                                      <span className="text-sm text-slate-700">{course?.name || "--"}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <Users className="text-slate-400" size={16} />
                                      <span className="text-sm text-slate-700">{teacher?.name || "--"}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="text-slate-400" size={16} />
                                      <span className="text-sm text-slate-700">{batch.schedule || "--"}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <Users className="text-slate-400" size={16} />
                                      <span className="text-sm text-slate-700">{batchEnrollments.length}/{batch.capacity || 30}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Badge
                                      variant={batch.isActive ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {batch.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-right">
                                    <div className="flex justify-end space-x-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}