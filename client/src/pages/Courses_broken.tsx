import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Clock
} from "lucide-react";
import AddCourseDialog from "@/components/AddCourseDialog";
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
import { insertCourseSchema, insertBatchSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, Batch, Teacher } from "@shared/schema";
import { z } from "zod";

const courseFormSchema = insertCourseSchema.extend({
  name: z.string().min(1, "Course name is required"),
  fee: z.string().min(1, "Fee is required"),
});

const batchFormSchema = insertBatchSchema.extend({
  name: z.string().min(1, "Batch name is required"),
  courseId: z.number().min(1, "Course is required"),
  teacherId: z.number().min(1, "Teacher is required"),
});

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
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
      const response = await apiRequest("POST", "/api/batches", data);
      return response.json();
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

  const onCourseSubmit = (data: z.infer<typeof courseFormSchema>) => {
    createCourseMutation.mutate(data);
  };

  const onBatchSubmit = (data: z.infer<typeof batchFormSchema>) => {
    createBatchMutation.mutate(data);
  };

  const filteredCourses = courses?.filter((course: Course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredBatches = batches?.filter((batch: Batch) => {
    const course = courses?.find((c: Course) => c.id === batch.courseId);
    const teacher = teachers?.find((t: Teacher) => t.id === batch.teacherId);
    return (
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${teacher?.firstName} ${teacher?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  if (coursesLoading || batchesLoading) {
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
          <h1 className="text-2xl font-bold text-slate-900">Course & Batch Management</h1>
          <p className="text-slate-600 mt-1">Manage courses, batches, and student enrollments.</p>
        </div>
      </div>

      <Tabs defaultValue="courses" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <Card className="glass-card rounded-2xl shadow-lg">
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
                      className="pl-10 w-80"
                    />
                  </div>
                  <AddCourseDialog />
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Course</DialogTitle>
                      </DialogHeader>
                      <Form {...courseForm}>
                        <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-6">
                          <FormField
                            control={courseForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Course Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Advanced JavaScript Mastery" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={courseForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="Course description..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={courseForm.control}
                              name="duration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Duration (weeks)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="12" 
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
                                    <Input placeholder="5000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsCourseDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-primary-600 hover:bg-primary-700"
                              disabled={createCourseMutation.isPending}
                            >
                              {createCourseMutation.isPending ? "Creating..." : "Create Course"}
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
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course: Course) => (
                    <Card key={course.id} className="glass-card rounded-xl hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <BookOpen className="text-white" size={20} />
                          </div>
                          <Badge variant={course.isActive ? "default" : "secondary"}>
                            {course.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 mb-2">{course.name}</h3>
                        <p className="text-sm text-slate-600 mb-4">{course.description || "No description available"}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-slate-600">
                            <Clock size={14} className="mr-2" />
                            {course.duration || "N/A"} weeks
                          </div>
                          <div className="flex items-center text-sm text-slate-600">
                            <DollarSign size={14} className="mr-2" />
                            ₹{course.fee || "0"}
                          </div>
                        </div>

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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first course."}
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                      onClick={() => setIsCourseDialogOpen(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Create First Course
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
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
                      className="pl-10 w-80"
                    />
                  </div>
                  <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary-600 hover:bg-primary-700 text-white">
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
                          <FormField
                            control={batchForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Batch Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Math A - Morning" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={batchForm.control}
                              name="courseId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Course</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    value={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a course" />
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
                              control={batchForm.control}
                              name="teacherId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Teacher</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    value={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a teacher" />
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
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={batchForm.control}
                              name="capacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Capacity</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="30" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={batchForm.control}
                              name="schedule"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Schedule</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Mon-Fri 10:00-12:00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsBatchDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-primary-600 hover:bg-primary-700"
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
            </CardHeader>
            <CardContent>
              {filteredBatches.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Batch</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Course</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Teacher</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Schedule</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Enrollment</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBatches.map((batch: Batch) => {
                        const course = courses?.find((c: Course) => c.id === batch.courseId);
                        const teacher = teachers?.find((t: Teacher) => t.id === batch.teacherId);
                        
                        return (
                          <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-medium">
                                  {batch.name?.[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{batch.name}</p>
                                  <p className="text-sm text-slate-500">ID: BAT{batch.id.toString().padStart(3, '0')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-900">{course?.name || "N/A"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-900">
                                {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Not assigned"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-slate-600">{batch.schedule || "Not specified"}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-1">
                                <Users size={14} className="text-slate-400" />
                                <span className="text-sm text-slate-900">
                                  {batch.currentEnrollment || 0}/{batch.capacity || 30}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant={batch.isActive ? "default" : "secondary"}>
                                {batch.isActive ? "Active" : "Inactive"}
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
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first batch."}
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                      onClick={() => setIsBatchDialogOpen(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Create First Batch
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
