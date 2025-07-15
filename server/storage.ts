import {
  students,
  teachers,
  courses,
  batches,
  enrollments,
  exams,
  examResults,
  attendance,
  fees,
  messages,
  type Student,
  type InsertStudent,
  type Teacher,
  type InsertTeacher,
  type Course,
  type InsertCourse,
  type Batch,
  type InsertBatch,
  type Enrollment,
  type InsertEnrollment,
  type Exam,
  type InsertExam,
  type ExamResult,
  type InsertExamResult,
  type Attendance,
  type InsertAttendance,
  type Fee,
  type InsertFee,
  type Message,
  type InsertMessage,
} from "@shared/schema";

export interface IStorage {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  // Teachers
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  // Batches
  getBatches(): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, batch: Partial<InsertBatch>): Promise<Batch>;
  deleteBatch(id: number): Promise<void>;

  // Enrollments
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByBatch(batchId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;

  // Exams
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByBatch(batchId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam>;
  deleteExam(id: number): Promise<void>;

  // Exam Results
  getExamResults(): Promise<ExamResult[]>;
  getExamResultsByExam(examId: number): Promise<ExamResult[]>;
  getExamResultsByStudent(studentId: number): Promise<ExamResult[]>;
  createExamResult(result: InsertExamResult): Promise<ExamResult>;
  updateExamResult(id: number, result: Partial<InsertExamResult>): Promise<ExamResult>;

  // Attendance
  getAttendance(): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByBatch(batchId: number): Promise<Attendance[]>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance>;

  // Fees
  getFees(): Promise<Fee[]>;
  getFeesByStudent(studentId: number): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  updateFee(id: number, fee: Partial<InsertFee>): Promise<Fee>;

  // Messages
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRecipient(recipientType: string, recipientId: number): Promise<Message[]>;

  // Dashboard Analytics
  getDashboardMetrics(): Promise<{
    totalStudents: number;
    totalTeachers: number;
    monthlyRevenue: number;
    attendanceRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private students: Map<number, Student> = new Map();
  private teachers: Map<number, Teacher> = new Map();
  private courses: Map<number, Course> = new Map();
  private batches: Map<number, Batch> = new Map();
  private enrollments: Map<number, Enrollment> = new Map();
  private exams: Map<number, Exam> = new Map();
  private examResults: Map<number, ExamResult> = new Map();
  private attendance: Map<number, Attendance> = new Map();
  private fees: Map<number, Fee> = new Map();
  private messages: Map<number, Message> = new Map();
  
  private currentStudentId = 1;
  private currentTeacherId = 1;
  private currentCourseId = 1;
  private currentBatchId = 1;
  private currentEnrollmentId = 1;
  private currentExamId = 1;
  private currentExamResultId = 1;
  private currentAttendanceId = 1;
  private currentFeeId = 1;
  private currentMessageId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with some basic data structure - no fake data
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const newStudent: Student = {
      ...student,
      id,
      enrollmentDate: new Date(),
      isActive: true,
      address: student.address || null,
      dateOfBirth: student.dateOfBirth || null,
      parentName: student.parentName || null,
      parentPhone: student.parentPhone || null,
      profilePhoto: student.profilePhoto || null,
    };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student> {
    const existing = this.students.get(id);
    if (!existing) throw new Error("Student not found");
    
    const updated = { ...existing, ...student };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: number): Promise<void> {
    this.students.delete(id);
  }

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachers.values());
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = this.currentTeacherId++;
    const newTeacher: Teacher = {
      ...teacher,
      id,
      joinDate: new Date(),
      isActive: true,
      qualification: teacher.qualification || null,
      experience: teacher.experience || null,
      specialization: teacher.specialization || null,
      salary: teacher.salary || null,
    };
    this.teachers.set(id, newTeacher);
    return newTeacher;
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher> {
    const existing = this.teachers.get(id);
    if (!existing) throw new Error("Teacher not found");
    
    const updated = { ...existing, ...teacher };
    this.teachers.set(id, updated);
    return updated;
  }

  async deleteTeacher(id: number): Promise<void> {
    this.teachers.delete(id);
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    const newCourse: Course = { 
      ...course, 
      id,
      duration: course.duration || null,
      description: course.description || null,
      isActive: course.isActive || null,
      fee: course.fee || null,
    };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course> {
    const existing = this.courses.get(id);
    if (!existing) throw new Error("Course not found");
    
    const updated = { ...existing, ...course };
    this.courses.set(id, updated);
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    this.courses.delete(id);
  }

  // Batches
  async getBatches(): Promise<Batch[]> {
    return Array.from(this.batches.values());
  }

  async getBatch(id: number): Promise<Batch | undefined> {
    return this.batches.get(id);
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const id = this.currentBatchId++;
    const newBatch: Batch = { 
      ...batch, 
      id, 
      currentEnrollment: 0,
      isActive: batch.isActive || null,
      courseId: batch.courseId || null,
      teacherId: batch.teacherId || null,
      startDate: batch.startDate || null,
      endDate: batch.endDate || null,
      capacity: batch.capacity || null,
      schedule: batch.schedule || null,
    };
    this.batches.set(id, newBatch);
    return newBatch;
  }

  async updateBatch(id: number, batch: Partial<InsertBatch>): Promise<Batch> {
    const existing = this.batches.get(id);
    if (!existing) throw new Error("Batch not found");
    
    const updated = { ...existing, ...batch };
    this.batches.set(id, updated);
    return updated;
  }

  async deleteBatch(id: number): Promise<void> {
    this.batches.delete(id);
  }

  // Enrollments
  async getEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values());
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.studentId === studentId);
  }

  async getEnrollmentsByBatch(batchId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(e => e.batchId === batchId);
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentEnrollmentId++;
    const newEnrollment: Enrollment = {
      ...enrollment,
      id,
      enrollmentDate: new Date(),
      status: "active",
      studentId: enrollment.studentId || null,
      batchId: enrollment.batchId || null,
    };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async deleteEnrollment(id: number): Promise<void> {
    this.enrollments.delete(id);
  }

  // Exams
  async getExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamsByBatch(batchId: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(e => e.batchId === batchId);
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const id = this.currentExamId++;
    const newExam: Exam = { 
      ...exam, 
      id,
      type: exam.type || null,
      duration: exam.duration || null,
      batchId: exam.batchId || null,
      examDate: exam.examDate || null,
      totalMarks: exam.totalMarks || null,
      instructions: exam.instructions || null,
    };
    this.exams.set(id, newExam);
    return newExam;
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam> {
    const existing = this.exams.get(id);
    if (!existing) throw new Error("Exam not found");
    
    const updated = { ...existing, ...exam };
    this.exams.set(id, updated);
    return updated;
  }

  async deleteExam(id: number): Promise<void> {
    this.exams.delete(id);
  }

  // Exam Results
  async getExamResults(): Promise<ExamResult[]> {
    return Array.from(this.examResults.values());
  }

  async getExamResultsByExam(examId: number): Promise<ExamResult[]> {
    return Array.from(this.examResults.values()).filter(r => r.examId === examId);
  }

  async getExamResultsByStudent(studentId: number): Promise<ExamResult[]> {
    return Array.from(this.examResults.values()).filter(r => r.studentId === studentId);
  }

  async createExamResult(result: InsertExamResult): Promise<ExamResult> {
    const id = this.currentExamResultId++;
    const newResult: ExamResult = { 
      ...result, 
      id,
      studentId: result.studentId || null,
      examId: result.examId || null,
      marksObtained: result.marksObtained || null,
      grade: result.grade || null,
      remarks: result.remarks || null,
    };
    this.examResults.set(id, newResult);
    return newResult;
  }

  async updateExamResult(id: number, result: Partial<InsertExamResult>): Promise<ExamResult> {
    const existing = this.examResults.get(id);
    if (!existing) throw new Error("Exam result not found");
    
    const updated = { ...existing, ...result };
    this.examResults.set(id, updated);
    return updated;
  }

  // Attendance
  async getAttendance(): Promise<Attendance[]> {
    return Array.from(this.attendance.values());
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => a.studentId === studentId);
  }

  async getAttendanceByBatch(batchId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => a.batchId === batchId);
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => 
      a.date && a.date.toDateString() === date.toDateString()
    );
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const newAttendance: Attendance = { 
      ...attendance, 
      id,
      status: attendance.status || null,
      date: attendance.date || null,
      studentId: attendance.studentId || null,
      batchId: attendance.batchId || null,
      remarks: attendance.remarks || null,
    };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance> {
    const existing = this.attendance.get(id);
    if (!existing) throw new Error("Attendance record not found");
    
    const updated = { ...existing, ...attendance };
    this.attendance.set(id, updated);
    return updated;
  }

  // Fees
  async getFees(): Promise<Fee[]> {
    return Array.from(this.fees.values());
  }

  async getFeesByStudent(studentId: number): Promise<Fee[]> {
    return Array.from(this.fees.values()).filter(f => f.studentId === studentId);
  }

  async createFee(fee: InsertFee): Promise<Fee> {
    const id = this.currentFeeId++;
    const newFee: Fee = { 
      ...fee, 
      id,
      status: fee.status || null,
      studentId: fee.studentId || null,
      batchId: fee.batchId || null,
      amount: fee.amount || null,
      dueDate: fee.dueDate || null,
      paidDate: fee.paidDate || null,
      paymentMethod: fee.paymentMethod || null,
      receiptNumber: fee.receiptNumber || null,
    };
    this.fees.set(id, newFee);
    return newFee;
  }

  async updateFee(id: number, fee: Partial<InsertFee>): Promise<Fee> {
    const existing = this.fees.get(id);
    if (!existing) throw new Error("Fee record not found");
    
    const updated = { ...existing, ...fee };
    this.fees.set(id, updated);
    return updated;
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const newMessage: Message = {
      ...message,
      id,
      sentAt: new Date(),
      status: "sent",
      content: message.content || null,
      type: message.type || null,
      recipientType: message.recipientType || null,
      recipientId: message.recipientId || null,
      subject: message.subject || null,
      sentBy: message.sentBy || null,
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByRecipient(recipientType: string, recipientId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      m => m.recipientType === recipientType && m.recipientId === recipientId
    );
  }

  // Dashboard Analytics
  async getDashboardMetrics(): Promise<{
    totalStudents: number;
    totalTeachers: number;
    monthlyRevenue: number;
    attendanceRate: number;
  }> {
    const totalStudents = this.students.size;
    const totalTeachers = this.teachers.size;
    
    // Calculate monthly revenue from paid fees
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyFees = Array.from(this.fees.values()).filter(fee => 
      fee.paidDate && 
      fee.paidDate.getMonth() === currentMonth && 
      fee.paidDate.getFullYear() === currentYear &&
      fee.status === "paid"
    );
    const monthlyRevenue = monthlyFees.reduce((sum, fee) => sum + Number(fee.amount), 0);

    // Calculate attendance rate for current month
    const monthlyAttendance = Array.from(this.attendance.values()).filter(att =>
      att.date &&
      att.date.getMonth() === currentMonth &&
      att.date.getFullYear() === currentYear
    );
    const totalAttendanceRecords = monthlyAttendance.length;
    const presentRecords = monthlyAttendance.filter(att => att.status === "present").length;
    const attendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0;

    return {
      totalStudents,
      totalTeachers,
      monthlyRevenue,
      attendanceRate,
    };
  }
}

export const storage = new MemStorage();
