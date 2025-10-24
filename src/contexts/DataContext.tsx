/**
 * Contexto de dados do sistema com Firebase
 * Gerencia turmas, aulas, presenças e materiais
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

// --- Interfaces ---
interface Class {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  adminId: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  classId: string;
  date: Date;
  duration: number;
  materials: Material[];
  createdAt: Date;
}

interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'image' | 'document';
  url: string;
  size: number;
}

interface Attendance {
  id: string;
  studentId: string;
  lessonId: string;
  markedAt: Date;
  ipAddress?: string;
}

interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  enrolledAt: Date;
}

interface DataContextType {
  classes: Class[];
  lessons: Lesson[];
  attendances: Attendance[];
  enrollments: Enrollment[];
  createClass: (classData: Omit<Class, 'id' | 'createdAt'>) => Promise<void>;
  updateClass: (id: string, classData: Partial<Pick<Class, 'name' | 'description'>>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  createLesson: (lessonData: Omit<Lesson, 'id' | 'createdAt'>) => Promise<void>;
  updateLesson: (id: string, lessonData: Partial<Pick<Lesson, 'title' | 'description' | 'date' | 'duration' | 'materials'>>) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  markAttendance: (studentId: string, lessonId: string) => Promise<void>;
  unmarkAttendance: (studentId: string, lessonId: string) => Promise<void>;
  enrollStudent: (studentId: string, classId: string) => Promise<void>;
  unenrollStudent: (studentId: string, classId: string) => Promise<void>;
  getStudentClasses: (studentId: string) => Class[];
  getClassLessons: (classId: string) => Lesson[];
  hasAttendance: (studentId: string, lessonId: string) => boolean;
  getAttendanceCount: (lessonId: string) => number;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const convertTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  };

  const loadClasses = async () => {
    try {
      const q = query(collection(db, 'classes'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const classList: Class[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: convertTimestamp(doc.data().createdAt) } as Class));
      setClasses(classList);
    } catch (error) { console.error('Erro ao carregar turmas:', error); }
  };

  const loadLessons = async () => {
    try {
      const q = query(collection(db, 'lessons'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const lessonList: Lesson[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: convertTimestamp(doc.data().date), createdAt: convertTimestamp(doc.data().createdAt) } as Lesson));
      setLessons(lessonList);
    } catch (error) { console.error('Erro ao carregar aulas:', error); }
  };

  const loadAttendances = async () => {
    try {
      const q = query(collection(db, 'attendances'), orderBy('markedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const attendanceList: Attendance[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), markedAt: convertTimestamp(doc.data().markedAt) } as Attendance));
      setAttendances(attendanceList);
    } catch (error) { console.error('Erro ao carregar presenças:', error); }
  };

  const loadEnrollments = async () => {
    try {
      const q = query(collection(db, 'enrollments'), orderBy('enrolledAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const enrollmentList: Enrollment[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), enrolledAt: convertTimestamp(doc.data().enrolledAt) } as Enrollment));
      setEnrollments(enrollmentList);
    } catch (error) { console.error('Erro ao carregar matrículas:', error); }
  };

  useEffect(() => {
    const loadAllDataForUser = async () => {
      setIsLoading(true);
      await Promise.all([loadClasses(), loadLessons(), loadAttendances(), loadEnrollments()]);
      setIsLoading(false);
    };

    const loadRegistrationData = async () => {
      setIsLoading(true);
      await loadClasses(); // Para formulário de registro
      setLessons([]);
      setAttendances([]);
      setEnrollments([]);
      setIsLoading(false);
    };

    if (user) {
      loadAllDataForUser();
    } else {
      loadRegistrationData();
    }
  }, [user]);

  const createClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'classes'), { ...classData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await loadClasses();
    } catch (error) { console.error("Erro ao criar turma:", error); }
  };

  const updateClass = async (id: string, classData: Partial<Pick<Class, 'name' | 'description'>>) => {
    try {
      await updateDoc(doc(db, 'classes', id), { ...classData, updatedAt: serverTimestamp() });
      await loadClasses();
    } catch (error) { console.error("Erro ao atualizar turma:", error); }
  };

  const deleteClass = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
      await loadAllData();
    } catch (error) { console.error("Erro ao apagar turma:", error); }
  };

  const createLesson = async (lessonData: Omit<Lesson, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'lessons'), { ...lessonData, date: Timestamp.fromDate(lessonData.date), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await loadLessons();
    } catch (error) { console.error("Erro ao criar aula:", error); }
  };

  const updateLesson = async (id: string, lessonData: Partial<Lesson>) => {
    try {
      const updateData: any = { ...lessonData, updatedAt: serverTimestamp() };
      if (lessonData.date) updateData.date = Timestamp.fromDate(lessonData.date);
      await updateDoc(doc(db, 'lessons', id), updateData);
      await loadLessons();
    } catch (error) { console.error("Erro ao atualizar aula:", error); }
  };

  const deleteLesson = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'lessons', id));
      await loadLessons();
    } catch (error) { console.error("Erro ao apagar aula:", error); }
  };

  const markAttendance = async (studentId: string, lessonId: string) => {
    try {
      if (!studentId || !lessonId || hasAttendance(studentId, lessonId)) return;
      await addDoc(collection(db, 'attendances'), { studentId, lessonId, markedAt: serverTimestamp() });
      await loadAttendances();
    } catch (error) { console.error("Erro ao marcar presença:", error); }
  };

  const unmarkAttendance = async (studentId: string, lessonId: string) => {
    try {
      const q = query(collection(db, 'attendances'), where('studentId', '==', studentId), where('lessonId', '==', lessonId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      await loadAttendances();
    } catch (error) { console.error("Erro ao desmarcar presença:", error); }
  };

  const enrollStudent = async (studentId: string, classId: string) => {
    try {
      await addDoc(collection(db, 'enrollments'), { studentId, classId, enrolledAt: serverTimestamp() });
      await loadEnrollments();
    } catch (error) { console.error("Erro ao matricular aluno:", error); }
  };

  const unenrollStudent = async (studentId: string, classId: string) => {
    try {
      const q = query(collection(db, 'enrollments'), where('studentId', '==', studentId), where('classId', '==', classId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      await loadEnrollments();
    } catch (error) { console.error("Erro ao desmatricular aluno:", error); }
  };

  const getStudentClasses = (studentId: string) => {
    const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
    return classes.filter(c => studentEnrollments.some(e => e.classId === c.id));
  };

  const getClassLessons = (classId: string) => lessons.filter(l => l.classId === classId);
  const hasAttendance = (studentId: string, lessonId: string) => attendances.some(a => a.studentId === studentId && a.lessonId === lessonId);
  const getAttendanceCount = (lessonId: string) => attendances.filter(a => a.lessonId === lessonId).length;

  return (
    <DataContext.Provider value={{
      classes, lessons, attendances, enrollments,
      createClass, updateClass, deleteClass,
      createLesson, updateLesson, deleteLesson,
      markAttendance, unmarkAttendance,
      enrollStudent, unenrollStudent,
      getStudentClasses, getClassLessons,
      hasAttendance, getAttendanceCount,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
}