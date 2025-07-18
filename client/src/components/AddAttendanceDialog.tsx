import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAttendanceSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const attendanceFormSchema = insertAttendanceSchema.extend({
    batchId: z.number().min(1, "Batch is required"),
    date: z.date(),
    courseId: z.number().min(1, "Course is required"),
});

// Props...
export function AddAttendanceDialog({
    open,
    onOpenChange,
    batches,
    courses,
    students,
    enrollments,
    toast
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    batches: any[];
    courses: any[];
    students: any[];
    enrollments: any[];
    toast: any;
}) {
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
    const [batchStudents, setBatchStudents] = useState<any[]>([]);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof attendanceFormSchema>>({
        resolver: zodResolver(attendanceFormSchema),
        defaultValues: {
            batchId: undefined,
            courseId: undefined,
            date: new Date(),
        },
    });

    // Get batch students when batch changes
    useEffect(() => {
        if (selectedBatchId && enrollments && students) {
            const batchEnrollments = enrollments.filter((enrollment: any) =>
                enrollment.batchId === selectedBatchId && enrollment.status === "active"
            );
            const batchStudents = batchEnrollments.map((enrollment: any) =>
                students.find((student: any) => student.id === enrollment.studentId)
            ).filter(Boolean);
            setBatchStudents(batchStudents);
        } else {
            setBatchStudents([]);
        }
    }, [selectedBatchId, enrollments, students]);

    const createAttendanceMutation = useMutation({
        mutationFn: async (data: z.infer<typeof attendanceFormSchema> & { studentId: number, status: string }) => {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["/api/attendance"]);
            onOpenChange(false);
            form.reset();
            toast({
                title: "Success",
                description: "Attendance recorded successfully",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to record attendance",
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {/* Children will be rendered in Attendance.tsx */}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Mark Attendance</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Course Select */}
                            <FormField
                                control={form.control}
                                name="courseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                const courseId = parseInt(value);
                                                field.onChange(courseId);
                                                // Reset batch when course changes
                                                form.setValue("batchId", undefined);
                                                setSelectedBatchId(null);
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

                            {/* Batch Select */}
                            <FormField
                                control={form.control}
                                name="batchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Batch</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                const batchId = parseInt(value);
                                                field.onChange(batchId);
                                                setSelectedBatchId(batchId);
                                            }}
                                            value={field.value?.toString()}
                                            disabled={!form.getValues().courseId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select batch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {batches
                                                    ?.filter((batch: any) =>
                                                        form.getValues().courseId
                                                            ? batch.courseId === form.getValues().courseId
                                                            : false
                                                    )
                                                    .map((batch: any) => {
                                                        const course = courses?.find((c: any) => c.id === batch.courseId);
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

                            {/* Date select */}
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                                onChange={e => field.onChange(new Date(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {selectedBatchId && batchStudents.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 dark:text-white">Students in Batch</h3>
                                <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {batchStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                                                {student.firstName?.[0]}{student.lastName?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                                                                onClick={() => {
                                                                    createAttendanceMutation.mutate({
                                                                        studentId: student.id,
                                                                        batchId: selectedBatchId,
                                                                        date: form.getValues().date,
                                                                        status: "present"
                                                                    });
                                                                }}
                                                            >
                                                                Present
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                                                                onClick={() => {
                                                                    createAttendanceMutation.mutate({
                                                                        studentId: student.id,
                                                                        batchId: selectedBatchId,
                                                                        date: form.getValues().date,
                                                                        status: "absent"
                                                                    });
                                                                }}
                                                            >
                                                                Absent
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-end space-x-4 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}