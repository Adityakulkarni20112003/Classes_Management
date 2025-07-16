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

  const courseForm = useForm<z.infer<typeof courseFormSchema>>({    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: undefined,
      fee: "",
      isActive: true,
    },
  });
  
  const batchForm = useForm<z.infer<typeof batchFormSchema>>({    resolver: zodResolver(batchFormSchema),
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-8">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
          </TabsList>
        </div>
        
        {activeTab === "courses" ? (
            <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus size={16} className="mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
        ) : (
          <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus size={16} className="mr-2" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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

                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        )}

        <TabsContent value="courses">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
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

          <Card className="glass-card">
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

          <Card className="glass-card">
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

          <Card className="glass-card">
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

        {/* Courses List */}
        <Card className="glass-card rounded-2xl shadow-lg mt-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-60"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course: Course) => {
                  const courseBatches = getCourseBatches(course.id);
                  const courseStudents = getCourseStudents(course.id);
                  
                  return (
                    <Card key={course.id} className="glass-card border border-gray-200 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {course.name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{course.name}</h3>
                              <p className="text-sm text-slate-500">CRS{course.id.toString().padStart(3, '0')}</p>
                            </div>
                          </div>
                          <Badge variant={course.isActive ? "default" : "secondary"}>
                            {course.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-600 line-clamp-2">{course.description || "No description available"}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="text-slate-400" size={16} />
                            <span className="text-sm text-slate-600">{course.duration || 0} months</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="text-slate-400" size={16} />
                            <span className="text-sm text-slate-600">₹{course.fee || "0"}</span>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-slate-900">{courseBatches.length}</p>
                              <p className="text-sm text-slate-500">Batches</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-slate-900">{courseStudents.length}</p>
                              <p className="text-sm text-slate-500">Students</p>
                            </div>
                          </div>
                        </div>

                        {/* Student List Preview */}
                        {courseStudents.length > 0 && (
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-slate-700">Enrolled Students</h4>
                              <span className="text-xs text-slate-500">Recent</span>
                            </div>
                            <div className="space-y-2 max-h-20 overflow-y-auto">
                              {courseStudents.slice(0, 3).map((enrollment: Enrollment) => {
                                const student = students?.find((s: Student) => s.id === enrollment.studentId);
                                const batch = batches?.find((b: Batch) => b.id === enrollment.batchId);
                                
                                return (
                                  <div key={enrollment.id} className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                      {student?.firstName?.charAt(0) || 'S'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {student?.firstName} {student?.lastName}
                                      </p>
                                      <p className="text-xs text-slate-500">{batch?.name}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              {courseStudents.length > 3 && (
                                <p className="text-xs text-slate-500 text-center">
                                  +{courseStudents.length - 3} more students
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
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
                              onClick={() => deleteCourseMutation.mutate(course.id)}
                              disabled={deleteCourseMutation.isPending}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                          <div className="text-xs text-slate-500">
                            {courseBatches.length} batches
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
      
      <TabsContent value="batches">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
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
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Batches</p>
                  <p className="text-2xl font-bold text-green-600">
                    {batches?.filter((batch: Batch) => batch.isActive).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Students</p>
                  <p className="text-2xl font-bold text-orange-600">{totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Teachers</p>
                  <p className="text-2xl font-bold text-blue-600">{teachers?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="glass-card rounded-2xl shadow-lg mt-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Batches</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-60"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
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
              <div className="text-center py-10">Loading batches...</div>
            ) : batches?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first batch."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsBatchDialogOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Batch
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-medium text-slate-700">Name</th>
                      <th className="py-3 px-4 text-left font-medium text-slate-700">Course</th>
                      <th className="py-3 px-4 text-left font-medium text-slate-700">Teacher</th>
                      <th className="py-3 px-4 text-left font-medium text-slate-700">Schedule</th>
                      <th className="py-3 px-4 text-left font-medium text-slate-700">Capacity</th>
                      <th className="py-3 px-4 text-left font-medium text-slate-700">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches?.filter((batch: Batch) => {
                      const matchesSearch = batch.name?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === "all" || 
                                          (statusFilter === "active" && batch.isActive) ||
                                          (statusFilter === "inactive" && !batch.isActive);
                      return matchesSearch && matchesStatus;
                    }).map((batch: Batch) => {
                      const course = courses?.find((c: Course) => c.id === batch.courseId);
                      const teacher = teachers?.find((t: Teacher) => t.id === batch.teacherId);
                      const batchEnrollments = enrollments?.filter((e: Enrollment) => e.batchId === batch.id) || [];
                      
                      return (
                        <tr key={batch.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{batch.name}</td>
                          <td className="py-3 px-4 text-slate-700">{course?.name || "--"}</td>
                          <td className="py-3 px-4 text-slate-700">{teacher?.name || "--"}</td>
                          <td className="py-3 px-4 text-slate-700">{batch.schedule || "--"}</td>
                          <td className="py-3 px-4 text-slate-700">
                            {batchEnrollments.length}/{batch.capacity || 30}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={batch.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {batch.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-1">
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
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}