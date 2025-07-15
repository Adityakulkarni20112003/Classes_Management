import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  profilePhoto: text("profile_photo"),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  qualification: text("qualification"),
  experience: integer("experience"),
  specialization: text("specialization"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  joinDate: timestamp("join_date").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration"), // in weeks
  fee: decimal("fee", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
});

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  teacherId: integer("teacher_id").references(() => teachers.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  capacity: integer("capacity").default(30),
  currentEnrollment: integer("current_enrollment").default(0),
  schedule: text("schedule"), // JSON string for class timings
  isActive: boolean("is_active").default(true),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  batchId: integer("batch_id").references(() => batches.id),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: text("status").default("active"), // active, completed, dropped
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  batchId: integer("batch_id").references(() => batches.id),
  examDate: timestamp("exam_date"),
  totalMarks: integer("total_marks"),
  duration: integer("duration"), // in minutes
  type: text("type"), // quiz, midterm, final
  instructions: text("instructions"),
});

export const examResults = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").references(() => exams.id),
  studentId: integer("student_id").references(() => students.id),
  marksObtained: integer("marks_obtained"),
  grade: text("grade"),
  remarks: text("remarks"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  batchId: integer("batch_id").references(() => batches.id),
  date: timestamp("date"),
  status: text("status"), // present, absent, late
  remarks: text("remarks"),
});

export const fees = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  batchId: integer("batch_id").references(() => batches.id),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: text("status").default("pending"), // pending, paid, overdue
  paymentMethod: text("payment_method"),
  receiptNumber: text("receipt_number"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  recipientType: text("recipient_type"), // student, parent, teacher, batch
  recipientId: integer("recipient_id"),
  subject: text("subject"),
  content: text("content"),
  sentAt: timestamp("sent_at").defaultNow(),
  sentBy: text("sent_by"),
  type: text("type"), // announcement, reminder, alert
  status: text("status").default("sent"), // sent, delivered, read
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  enrollmentDate: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  joinDate: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  currentEnrollment: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrollmentDate: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
});

export const insertExamResultSchema = createInsertSchema(examResults).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

export const insertFeeSchema = createInsertSchema(fees).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Fee = typeof fees.$inferSelect;
export type InsertFee = z.infer<typeof insertFeeSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
