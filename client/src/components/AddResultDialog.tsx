import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertExamResultSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const resultFormSchema = insertExamResultSchema.extend({
    examId: z.number().min(1, "Exam is required"),
    studentId: z.number().min(1, "Student is required"),
    courseId: z.number().min(1, "Course is required"),
    batchId: z.number().min(1, "Batch is required"),
    marks: z.number().min(0, "Marks are required"),
    status: z.enum(["pass", "fail"]),
});

export default function AddResultDialog({
    open,
    onOpenChange,
    exams,
    students,
    courses,
    batches,
    toast,
    children,
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    exams: any[],
    students: any[],
    courses: any[],
    batches: any[],
    toast: any,
    children: React.ReactNode,
}) {
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof resultFormSchema>>({
        resolver: zodResolver(resultFormSchema),
        defaultValues: {
            examId: undefined,
            studentId: undefined,
            courseId: undefined,
            batchId: undefined,
            marks: 0,
            status: "pass"
        },
    });

    const createResultMutation = useMutation({
        mutationFn: async (data: z.infer<typeof resultFormSchema>) => {
            const response = await apiRequest("POST", "/api/results", data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/results"] });
            onOpenChange(false);
            form.reset();
            toast({ title: "Success", description: "Result published successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to publish result", variant: "destructive" });
        },
    });

    const onSubmit = (data: z.infer<typeof resultFormSchema>) => {
        createResultMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Publish Result</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="examId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exam</FormLabel>
                                        <Select
                                            onValueChange={value => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select exam" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {exams?.map((exam: any) => (
                                                    <SelectItem key={exam.id} value={exam.id.toString()}>{exam.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField
                                control={form.control}
                                name="studentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student</FormLabel>
                                        <Select
                                            onValueChange={value => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select student" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {students?.map((student: any) => (
                                                    <SelectItem key={student.id} value={student.id.toString()}>
                                                        {student.firstName} {student.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField
                                control={form.control}
                                name="courseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course</FormLabel>
                                        <Select
                                            onValueChange={value => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {courses?.map((course: any) => (
                                                    <SelectItem key={course.id} value={course.id.toString()}>{course.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField
                                control={form.control}
                                name="batchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Batch</FormLabel>
                                        <Select
                                            onValueChange={value => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select batch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {batches?.map((batch: any) => (
                                                    <SelectItem key={batch.id} value={batch.id.toString()}>{batch.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField
                                control={form.control}
                                name="marks"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marks</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Enter marks"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select result status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pass">Pass</SelectItem>
                                                <SelectItem value="fail">Fail</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                        </div>
                        <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 hover:bg-gray-50">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createResultMutation.isPending}
                                className="bg-gradient-to-r from-green-600 to-indigo-600 hover:from-green-700 hover:to-indigo-700">
                                {createResultMutation.isPending ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Publishing...
                                    </span>
                                ) : "Publish Result"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
