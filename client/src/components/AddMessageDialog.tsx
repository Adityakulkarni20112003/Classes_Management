import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { Student, Teacher } from "@shared/schema";
import { Send } from "lucide-react";

const messageFormSchema = insertMessageSchema.extend({
    subject: z.string().min(1, "Subject is required"),
    content: z.string().min(1, "Content is required"),
    recipientType: z.enum(["student", "teacher", "parent", "all"]),
    recipientId: z.number().optional(),
    courseId: z.number().optional(),
    batchId: z.number().optional(),
});

export default function AddMessageDialog({
    open,
    onOpenChange,
    students,
    teachers,
    courses,
    batches,
    parents,
    toast,
    children,
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    students: any[],
    teachers: any[],
    courses: any[],
    batches: any[],
    parents: any[],
    toast: any,
    children: React.ReactNode,
}) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof messageFormSchema>>({
        resolver: zodResolver(messageFormSchema),
        defaultValues: {
            subject: "",
            content: "",
            type: "announcement",
            recipientType: "all",
            recipientId: undefined,
            courseId: undefined,
            batchId: undefined,
            sentBy: "Admin",
        },
    });

    const createMessageMutation = useMutation({
        mutationFn: async (data: z.infer<typeof messageFormSchema>) => {
            const response = await apiRequest("POST", "/api/messages", {
                ...data,
                sentAt: new Date(),
                status: "sent",
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
            onOpenChange(false);
            form.reset();
            toast({
                title: "Success",
                description: "Message sent successfully",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: z.infer<typeof messageFormSchema>) => {
        createMessageMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Compose New Message</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter subject..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="announcement">Announcement</SelectItem>
                                                <SelectItem value="absent_students">Absent Students</SelectItem>
                                                <SelectItem value="fees_reminder">Fees Reminder</SelectItem>
                                                <SelectItem value="results">Results</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value && value !== 'all' ? parseInt(value) : undefined);
                                                form.setValue("batchId", undefined);
                                            }}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">All Courses</SelectItem>
                                                {courses?.map((course: any) => (
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
                                name="batchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Batch</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value && value !== 'all' ? parseInt(value) : undefined)}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select batch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">All Batches</SelectItem>
                                                {batches
                                                    ?.filter((batch: any) => !form.watch("courseId") || batch.courseId === form.watch("courseId"))
                                                    .map((batch: any) => (
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
                                control={form.control}
                                name="recipientType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Send To</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select recipients" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">All Users</SelectItem>
                                                <SelectItem value="student">Students</SelectItem>
                                                <SelectItem value="teacher">Teachers</SelectItem>
                                                <SelectItem value="parent">Parents</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch("recipientType") === "student" && (
                                <FormField
                                    control={form.control}
                                    name="recipientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Specific Student (Optional)</FormLabel>
                                            <Select onValueChange={(value) => field.onChange(value && value !== 'all' ? parseInt(value) : undefined)} value={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select student or leave empty for all" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Students</SelectItem>
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
                            )}
                            {form.watch("recipientType") === "teacher" && (
                                <FormField
                                    control={form.control}
                                    name="recipientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Specific Teacher (Optional)</FormLabel>
                                            <Select onValueChange={(value) => field.onChange(value && value !== 'all' ? parseInt(value) : undefined)} value={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select teacher or leave empty for all" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Teachers</SelectItem>
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
                            )}
                            {form.watch("recipientType") === "parent" && (
                                <FormField
                                    control={form.control}
                                    name="recipientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Specific Parent (Optional)</FormLabel>
                                            <Select onValueChange={(value) => field.onChange(value && value !== 'all' ? parseInt(value) : undefined)} value={field.value?.toString()}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select parent or leave empty for all" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Parents</SelectItem>
                                                    {parents?.map((parent: any) => (
                                                        <SelectItem key={parent.id} value={parent.id.toString()}>
                                                            {parent.name} (Parent of {parent.studentName})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Type your message here..."
                                            rows={6}
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMessageMutation.isPending}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                                {createMessageMutation.isPending ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <Send size={16} className="mr-2" />
                                        Send Message
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
