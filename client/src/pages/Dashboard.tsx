import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  UserCheck, 
  IndianRupee, 
  Calendar,
  TrendingUp,
  UserPlus,
  CheckCircle,
  CalendarPlus,
  Send,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {metrics?.totalStudents || 0}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-emerald-600 text-sm font-medium">+12%</span>
                  <span className="text-slate-500 text-xs ml-2">vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Teachers Card */}
        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Teachers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {metrics?.totalTeachers || 0}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-emerald-600 text-sm font-medium">+3</span>
                  <span className="text-slate-500 text-xs ml-2">new this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <UserCheck className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ₹{metrics?.monthlyRevenue?.toLocaleString() || 0}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-emerald-600 text-sm font-medium">+18%</span>
                  <span className="text-slate-500 text-xs ml-2">vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <IndianRupee className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rate Card */}
        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {metrics?.attendanceRate?.toFixed(1) || 0}%
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-emerald-600 text-sm font-medium">+2.1%</span>
                  <span className="text-slate-500 text-xs ml-2">vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="text-white" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Performance Analytics</h3>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>Last 6 Months</option>
                <option>Last Year</option>
                <option>All Time</option>
              </select>
            </div>
            <div className="chart-container h-64 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center">
                <TrendingUp className="text-4xl text-primary-400 mb-2 mx-auto" size={48} />
                <p className="text-slate-600">Performance Chart</p>
                <p className="text-sm text-slate-500">Integration with Chart.js/Recharts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserPlus className="text-blue-600" size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">New student enrolled</p>
                  <p className="text-xs text-slate-500">Sarah Khan joined Mathematics Batch A</p>
                  <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Assignment submitted</p>
                  <p className="text-xs text-slate-500">Physics Chapter 5 - 24 submissions</p>
                  <p className="text-xs text-slate-400 mt-1">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <CalendarPlus className="text-purple-600" size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Class scheduled</p>
                  <p className="text-xs text-slate-500">Chemistry Lab - Tomorrow 10:00 AM</p>
                  <p className="text-xs text-slate-400 mt-1">1 day ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Send className="text-orange-600" size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Fee reminder sent</p>
                  <p className="text-xs text-slate-500">15 students notified for pending fees</p>
                  <p className="text-xs text-slate-400 mt-1">2 days ago</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary-600 hover:text-primary-700 hover:bg-primary-50">
              View All Activities
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Students Overview */}
      <Card className="glass-card rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900">Students Overview</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              </div>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                <UserPlus size={16} className="mr-2" />
                Add Student
              </Button>
            </div>
          </div>

          {students && students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.slice(0, 5).map((student: any) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-slate-500">ID: STU{student.id.toString().padStart(3, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">{student.email}</td>
                      <td className="py-4 px-4 text-sm text-slate-600">{student.phone}</td>
                      <td className="py-4 px-4">
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? "Active" : "Inactive"}
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first student.</p>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                <UserPlus size={16} className="mr-2" />
                Add First Student
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Mark Attendance</h4>
                <p className="text-sm text-slate-600 mt-1">Quick attendance marking</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="text-white" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Schedule Exam</h4>
                <p className="text-sm text-slate-600 mt-1">Create new test schedule</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarPlus className="text-white" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Send Message</h4>
                <p className="text-sm text-slate-600 mt-1">Bulk message to parents</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="text-white" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">Generate Report</h4>
                <p className="text-sm text-slate-600 mt-1">Performance analytics</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="text-white" size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
