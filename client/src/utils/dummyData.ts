// Utility functions and constants for the coaching management system

export const gradeMapping = {
  "A+": { min: 95, max: 100, color: "text-green-600" },
  "A": { min: 90, max: 94, color: "text-green-500" },
  "B+": { min: 85, max: 89, color: "text-blue-600" },
  "B": { min: 80, max: 84, color: "text-blue-500" },
  "C+": { min: 75, max: 79, color: "text-yellow-600" },
  "C": { min: 70, max: 74, color: "text-yellow-500" },
  "D": { min: 60, max: 69, color: "text-orange-500" },
  "F": { min: 0, max: 59, color: "text-red-500" },
};

export const attendanceStatusOptions = [
  { value: "present", label: "Present", color: "text-green-600", bgColor: "bg-green-100" },
  { value: "absent", label: "Absent", color: "text-red-600", bgColor: "bg-red-100" },
  { value: "late", label: "Late", color: "text-yellow-600", bgColor: "bg-yellow-100" },
];

export const feeStatusOptions = [
  { value: "pending", label: "Pending", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { value: "paid", label: "Paid", color: "text-green-600", bgColor: "bg-green-100" },
  { value: "overdue", label: "Overdue", color: "text-red-600", bgColor: "bg-red-100" },
];

export const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
];

export const examTypeOptions = [
  { value: "quiz", label: "Quiz" },
  { value: "midterm", label: "Mid-term" },
  { value: "final", label: "Final" },
  { value: "assignment", label: "Assignment" },
];

export const messageTypeOptions = [
  { value: "announcement", label: "Announcement", icon: "📢" },
  { value: "reminder", label: "Reminder", icon: "⏰" },
  { value: "alert", label: "Alert", icon: "🚨" },
];

export const recipientTypeOptions = [
  { value: "student", label: "Individual Student" },
  { value: "parent", label: "Parent" },
  { value: "batch", label: "Entire Batch" },
  { value: "teacher", label: "Teacher" },
];

// Utility functions
export const calculateGrade = (marksObtained: number, totalMarks: number): string => {
  const percentage = (marksObtained / totalMarks) * 100;
  
  for (const [grade, range] of Object.entries(gradeMapping)) {
    if (percentage >= range.min && percentage <= range.max) {
      return grade;
    }
  }
  return "F";
};

export const getGradeColor = (grade: string): string => {
  return gradeMapping[grade as keyof typeof gradeMapping]?.color || "text-gray-500";
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateAttendancePercentage = (present: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
};

export const getAttendanceStatus = (percentage: number): { label: string; color: string } => {
  if (percentage >= 90) return { label: "Excellent", color: "text-green-600" };
  if (percentage >= 80) return { label: "Good", color: "text-blue-600" };
  if (percentage >= 70) return { label: "Average", color: "text-yellow-600" };
  if (percentage >= 60) return { label: "Below Average", color: "text-orange-600" };
  return { label: "Poor", color: "text-red-600" };
};

export const generateReceiptNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RCP${timestamp}${random}`;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "active":
    case "paid":
    case "present":
    case "delivered":
    case "read":
      return "default";
    case "pending":
    case "late":
    case "sent":
      return "secondary";
    case "inactive":
    case "absent":
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
};

// Constants for form validation
export const validationRules = {
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },
  phone: {
    minLength: 10,
    maxLength: 15,
    pattern: /^[+]?[1-9]?[0-9]{7,15}$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  amount: {
    min: 0,
    max: 1000000,
  },
  marks: {
    min: 0,
    max: 1000,
  },
  percentage: {
    min: 0,
    max: 100,
  },
};

export default {
  gradeMapping,
  attendanceStatusOptions,
  feeStatusOptions,
  paymentMethodOptions,
  examTypeOptions,
  messageTypeOptions,
  recipientTypeOptions,
  calculateGrade,
  getGradeColor,
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateAttendancePercentage,
  getAttendanceStatus,
  generateReceiptNumber,
  validatePhoneNumber,
  validateEmail,
  getInitials,
  getStatusBadgeVariant,
  validationRules,
};
