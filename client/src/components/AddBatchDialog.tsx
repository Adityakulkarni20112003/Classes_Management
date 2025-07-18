import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBatchSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const batchFormSchema = insertBatchSchema.extend({
    name: z.string().min(1, "Batch name is required"),
    courseId: z.number().min(1, "Course is required"),
    teacherId: z.number().min(1, "Teacher is required"),
    capacity: z.number().min(1, "Capacity is required"),
    schedule: z.string().min(1, "Schedule is required"),
});

export default function AddBatchDialog({
    open,
    onOpenChange,
    courses,
    teachers,
    toast,
    children,
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    courses: any[],
    teachers: any[],
    toast: any,
    children: React.ReactNode,
}) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof batchFormSchema>>({
        resolver: zodResolver(batchFormSchema),
        defaultValues: {
            name: "",
            courseId: undefined,
            teacherId: undefined,
            capacity: 30,
            schedule: "",
            isActive: true,
        },
    });

    const createBatchMutation = useMutation({
        mutationFn: async (data: z.infer<typeof batchFormSchema>) => {
            const response = await fetch("/api/batches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
            onOpenChange(false);
            form.reset();
            toast({ title: "Success", description: "Batch created successfully" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create batch", variant: "destructive" });
        },
    });

    const onSubmit = (data: z.infer<typeof batchFormSchema>) => createBatchMutation.mutate(data);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Batch</DialogTitle>
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
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
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
                                                    <SelectValue placeholder="Select teacher" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {teachers?.map((teacher: any) => (
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
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="schedule"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Schedule</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Mon-Fri 9:00 AM - 11:00 AM" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 hover:bg-gray-50">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createBatchMutation.isPending} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                {createBatchMutation.isPending ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </span>
                                ) : "Create Batch"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
