import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  IndianRupee,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Fee, Student, Batch } from "@shared/schema";
import { z } from "zod";

const feeFormSchema = insertFeeSchema.extend({
  studentId: z.number().min(1, "Student is required"),
  batchId: z.number().min(1, "Batch is required"),
  amount: z.string().min(1, "Amount is required"),
});

export default function Fees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { toast } = useToast();

  const { data: fees, isLoading } = useQuery({
    queryKey: ["/api/fees"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: batches } = useQuery({
    queryKey: ["/api/batches"],
  });

  const form = useForm<z.infer<typeof feeFormSchema>>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      studentId: undefined,
      batchId: undefined,
      amount: "",
      paymentMethod: "",
      receiptNumber: "",
    },
  });

  const createFeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof feeFormSchema>) => {
      const feeData = {
        ...data,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
      const response = await apiRequest("POST", "/api/fees", feeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Fee record created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create fee record",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: number; paymentMethod: string }) => {
      const response = await apiRequest("PUT", `/api/fees/${id}`, {
        status: "paid",
        paidDate: new Date(),
        paymentMethod,
        receiptNumber: `RCP${Date.now()}`,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof feeFormSchema>) => {
    createFeeMutation.mutate(data);
  };

  const filteredFees = fees?.filter((fee: Fee) => {
    const student = students?.find((s: Student) => s.id === fee.studentId);
    const batch = batches?.find((b: Batch) => b.id === fee.batchId);
    
    const matchesSearch = 
      `${student?.firstName} ${student?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || fee.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate fee statistics
  const totalFees = fees?.length || 0;
  const paidFees = fees?.filter((f: Fee) => f.status === "paid").length || 0;
  const pendingFees = fees?.filter((f: Fee) => f.status === "pending").length || 0;
  const overdueFees = fees?.filter((f: Fee) => {
    if (f.status !== "pending" || !f.dueDate) return false;
    return new Date(f.dueDate) < new Date();
  }).length || 0;

  const totalAmount = fees?.reduce((sum: number, fee: Fee) => sum + Number(fee.amount || 0), 0) || 0;
  const paidAmount = fees?.filter((f: Fee) => f.status === "paid")
    .reduce((sum: number, fee: Fee) => sum + Number(fee.amount || 0), 0) || 0;

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-slate-900">Fee Management</h1>
          <p className="text-slate-600 mt-1">Track fee payments, generate receipts, and manage billing.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Export Report
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                <Plus size={16} className="mr-2" />
                Add Fee Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Fee Record</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
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
                    <FormField
                      control={form.control}
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
                  </div>

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input placeholder="5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Credit/Debit Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receiptNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="RCP001" {...field} />
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
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-primary-600 hover:bg-primary-700"
                      disabled={createFeeMutation.isPending}
                    >
                      {createFeeMutation.isPending ? "Creating..." : "Create Record"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Fee Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Amount</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <IndianRupee className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Collected</p>
                <p className="text-3xl font-bold text-green-600 mt-2">₹{paidAmount.toLocaleString()}</p>
                <p className="text-sm text-slate-500">{paidFees} payments</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{pendingFees}</p>
                <p className="text-sm text-slate-500">₹{(totalAmount - paidAmount).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Overdue</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{overdueFees}</p>
                <p className="text-sm text-slate-500">Needs attention</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <XCircle className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Records */}
      <Card className="glass-card rounded-2xl shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Fee Records ({filteredFees.length})</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Batch</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Payment</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFees.map((fee: Fee) => {
                    const student = students?.find((s: Student) => s.id === fee.studentId);
                    const batch = batches?.find((b: Batch) => b.id === fee.batchId);
                    const isOverdue = fee.status === "pending" && fee.dueDate && new Date(fee.dueDate) < new Date();
                    
                    return (
                      <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium">
                              {student?.firstName?.[0]}{student?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {student ? `${student.firstName} ${student.lastName}` : "Unknown"}
                              </p>
                              <p className="text-sm text-slate-500">
                                ID: STU{student?.id.toString().padStart(3, '0')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-900">{batch?.name || "N/A"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium text-slate-900">₹{Number(fee.amount).toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-600">
                            {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "No due date"}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={
                              fee.status === "paid" ? "default" :
                              isOverdue ? "destructive" :
                              "secondary"
                            }
                          >
                            {isOverdue ? "Overdue" : fee.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {fee.status === "paid" ? (
                              <>
                                <p className="text-slate-900">{fee.paymentMethod || "N/A"}</p>
                                <p className="text-slate-500">{fee.receiptNumber || "N/A"}</p>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markPaidMutation.mutate({ id: fee.id, paymentMethod: "cash" })}
                                disabled={markPaidMutation.isPending}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
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
                              <Download size={14} />
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
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No fee records found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search criteria." : "Get started by creating your first fee record."}
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus size={16} className="mr-2" />
                  Create First Record
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
