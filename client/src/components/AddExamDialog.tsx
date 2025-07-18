import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertExamSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Extend your schema as you have in other dialogs
const examFormSchema = insertExamSchema.extend({
    name: z.string().min(1, "Exam name is required"),
    date: z.date(),
    courseId: z.number().min(1, "Course is required"),
    batchId: z.number().min(1, "Batch is required"),
    teacherId: z.number().min(1, "Teacher is required"),
});

export default function AddExamDialog({
    open,
    onOpenChange,
    courses,
    batches,
    teachers,
    toast,
    children,
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    courses: any[],
    batches: any[],
    teachers: any[],
    toast: any,
    children: React.ReactNode,
}) {
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof examFormSchema>>({
        resolver: zodResolver(examFormSchema),
        defaultValues: {
            name: "",
            date: new Date(),
            courseId: undefined,
            batchId: undefined,
            teacherId: undefined,
            isActive: true,
        },
    });

    const createExamMutation = useMutation({
        mutationFn: async (data: z.infer<typeof examFormSchema>) => {
            const response = await apiRequest("POST", "/api/exams", data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
            onOpenChange(false);
            form.reset();
            toast({ title: "Success", description: "Exam created successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create exam", variant: "destructive" });
        },
    });

    const onSubmit = (data: z.infer<typeof examFormSchema>) => {
        createExamMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Exam</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exam Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter exam name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                                                onChange={e => field.onChange(new Date(e.target.value))}
                                            />
                                        </FormControl>
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
                                            onValueChange={value => {
                                                field.onChange(parseInt(value));
                                                // optional reset for batchId if needed
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
                                                {(batches || [])
                                                    .filter((batch: any) => !form.watch("courseId") || batch.courseId === form.watch("courseId"))
                                                    .map((batch: any) => (
                                                        <SelectItem key={batch.id} value={batch.id.toString()}>
                                                            {batch.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField
                                control={form.control}
                                name="teacherId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teacher</FormLabel>
                                        <Select
                                            onValueChange={value => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select teacher" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {teachers?.map((teacher: any) => (
                                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>{teacher.name}</SelectItem>
                                                ))}
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
                            <Button type="submit" disabled={createExamMutation.isPending}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                {createExamMutation.isPending ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </span>
                                ) : "Create Exam"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
