import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  GraduationCap, 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  AlertCircle,
  TrendingUp
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
import { insertBatchSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Batch, Course, Teacher, Student, Enrollment } from "@shared/schema";
import { z } from "zod";

const batchFormSchema = insertBatchSchema.extend({
  name: z.string().min(1, "Batch name is required"),
  courseId: z.number().min(1, "Course is required"),
  teacherId: z.number().min(1, "Teacher is required"),
  capacity: z.number().min(1, "Capacity is required"),
});

export default function Batches() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ["/api/batches"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: teachers } = useQuery({
    queryKey: ["/api/teachers"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: enrollments } = useQuery({
    queryKey: ["/api/enrollments"],
  });

  const form = useForm<z.infer<typeof batchFormSchema>>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      courseId: undefined,
      teacherId: undefined,
      capacity: 30,
      schedule: "",
      startDate: new Date(),
      endDate: undefined,
      isActive: true,
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof batchFormSchema>) => {
      const response = await apiRequest("POST", "/api/batches", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      setIsDialogOpen(false);
      form.reset();
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

  const deleteBatchMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/batches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete batch",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof batchFormSchema>) => {
    createBatchMutation.mutate(data);
  };

  const filteredBatches = batches?.filter((batch: Batch) => {
    const course = courses?.find((c: Course) => c.id === batch.courseId);
    const teacher = teachers?.find((t: Teacher) => t.id === batch.teacherId);
    
    const matchesSearch = 
      batch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && batch.isActive) ||
                         (statusFilter === "inactive" && !batch.isActive);

    const matchesCourse = courseFilter === "all" || batch.courseId === parseInt(courseFilter);

    return matchesSearch && matchesStatus && matchesCourse;
  }) || [];

  // Calculate batch statistics
  const getBatchStudents = (batchId: number) => {
    return enrollments?.filter((enrollment: Enrollment) => enrollment.batchId === batchId) || [];
  };

  const totalBatches = batches?.length || 0;
  const activeBatches = batches?.filter((b: Batch) => b.isActive).length || 0;
  const totalEnrollments = enrollments?.length || 0;
  const averageEnrollment = totalBatches > 0 ? Math.round(totalEnrollments / totalBatches) : 0;

  if (batchesLoading) {
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
          <h1 className="text-2xl font-bold text-slate-900">Batch Management</h1>
          <p className="text-slate-600 mt-1">Manage class batches, track enrollment, and monitor student progress.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus size={16} className="mr-2" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
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
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers?.map((teacher: Teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.firstName} {teacher.lastName}
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
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="30" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="schedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule</FormLabel>
                        <FormControl>
                          <Input placeholder="Mon, Wed, Fri 10:00 AM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
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
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
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
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBatchMutation.isPending}>
                    {createBatchMutation.isPending ? "Creating..." : "Create Batch"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Batches</p>
                <p className="text-2xl font-bold text-slate-900">{totalBatches}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Batches</p>
                <p className="text-2xl font-bold text-green-600">{activeBatches}</p>
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
                <p className="text-sm text-slate-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-purple-600">{totalEnrollments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg. Enrollment</p>
                <p className="text-2xl font-bold text-orange-600">{averageEnrollment}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batches List */}
      <Card className="glass-card rounded-2xl shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Batches ({filteredBatches.length})</CardTitle>
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
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses?.map((course: Course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBatches.map((batch: Batch) => {
                const course = courses?.find((c: Course) => c.id === batch.courseId);
                const teacher = teachers?.find((t: Teacher) => t.id === batch.teacherId);
                const batchStudents = getBatchStudents(batch.id);
                const enrollmentPercentage = batch.capacity ? Math.round((batchStudents.length / batch.capacity) * 100) : 0;
                
                return (
                  <Card key={batch.id} className="glass-card border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {batch.name?.charAt(0) || 'B'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{batch.name}</h3>
                            <p className="text-sm text-slate-500">BTH{batch.id.toString().padStart(3, '0')}</p>
                          </div>
                        </div>
                        <Badge variant={batch.isActive ? "default" : "secondary"}>
                          {batch.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="text-slate-400" size={16} />
                          <span className="text-sm text-slate-600">{course?.name || "Unknown Course"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="text-slate-400" size={16} />
                          <span className="text-sm text-slate-600">{teacher?.firstName} {teacher?.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="text-slate-400" size={16} />
                          <span className="text-sm text-slate-600">
                            {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="text-slate-400" size={16} />
                          <span className="text-sm text-slate-600">{batch.schedule || "Schedule not set"}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">Enrollment</span>
                          <span className="text-sm font-medium text-slate-900">
                            {batchStudents.length}/{batch.capacity || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(enrollmentPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>{enrollmentPercentage}% filled</span>
                          <span>{(batch.capacity || 0) - batchStudents.length} slots left</span>
                        </div>
                      </div>

                      {/* Student List Preview */}
                      {batchStudents.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-700">Students</h4>
                            <span className="text-xs text-slate-500">Active</span>
                          </div>
                          <div className="space-y-2 max-h-20 overflow-y-auto">
                            {batchStudents.slice(0, 3).map((enrollment: Enrollment) => {
                              const student = students?.find((s: Student) => s.id === enrollment.studentId);
                              
                              return (
                                <div key={enrollment.id} className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {student?.firstName?.charAt(0) || 'S'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                      {student?.firstName} {student?.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : "Unknown"}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            {batchStudents.length > 3 && (
                              <p className="text-xs text-slate-500 text-center">
                                +{batchStudents.length - 3} more students
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
                            onClick={() => deleteBatchMutation.mutate(batch.id)}
                            disabled={deleteBatchMutation.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="text-xs text-slate-500">
                          {batchStudents.length} enrolled
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first batch."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Create Batch
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}