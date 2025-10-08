/**
 * Tipos principais do sistema de gestão de aulas
 * Define todas as interfaces utilizadas no sistema
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

export interface Class {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  adminId: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  classId: string;
  date: Date;
  duration: number; // em minutos
  materials: Material[];
  createdAt: Date;
}

export interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'image' | 'document';
  url: string;
  size: number; // em bytes
}

export interface Attendance {
  id: string;
  studentId: string;
  lessonId: string;
  markedAt: Date;
  ipAddress?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  enrolledAt: Date;
}