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
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

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
  addClass: (classData: Omit<Class, 'id' | 'createdAt'>) => Promise<void>;
  updateClass: (id: string, classData: Partial<Pick<Class, 'name' | 'description'>>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addLesson: (lessonData: Omit<Lesson, 'id' | 'createdAt'>) => Promise<void>;
  updateLesson: (id: string, lessonData: Partial<Pick<Lesson, 'title' | 'description' | 'date' | 'duration' | 'materials'>>) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  markAttendance: (studentId: string, lessonId: string) => Promise<void>;
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

  // Função para converter Timestamp do Firebase para Date
  const convertTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  };

  // Carregar dados quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Limpar dados quando não autenticado
      setClasses([]);
      setLessons([]);
      setAttendances([]);
      setEnrollments([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadClasses(),
        loadLessons(),
        loadAttendances(),
        loadEnrollments()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const classesRef = collection(db, 'classes');
      const q = query(classesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const classList: Class[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        classList.push({
          id: doc.id,
          name: data.name,
          description: data.description || '',
          adminId: data.adminId,
          createdAt: convertTimestamp(data.createdAt)
        });
      });
      
      setClasses(classList);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const loadLessons = async () => {
    try {
      const lessonsRef = collection(db, 'lessons');
      const q = query(lessonsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      const lessonList: Lesson[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        lessonList.push({
          id: doc.id,
          title: data.title,
          description: data.description || '',
          classId: data.classId,
          date: convertTimestamp(data.date),
          duration: data.duration || 60,
          materials: data.materials || [],
          createdAt: convertTimestamp(data.createdAt)
        });
      });
      
      setLessons(lessonList);
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
    }
  };

  const loadAttendances = async () => {
    try {
      const attendancesRef = collection(db, 'attendances');
      const q = query(attendancesRef, orderBy('markedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const attendanceList: Attendance[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        attendanceList.push({
          id: doc.id,
          studentId: data.studentId,
          lessonId: data.lessonId,
          markedAt: convertTimestamp(data.markedAt),
          ipAddress: data.ipAddress
        });
      });
      
      setAttendances(attendanceList);
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
    }
  };

  const loadEnrollments = async () => {
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(enrollmentsRef, orderBy('enrolledAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const enrollmentList: Enrollment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        enrollmentList.push({
          id: doc.id,
          studentId: data.studentId,
          classId: data.classId,
          enrolledAt: convertTimestamp(data.enrolledAt)
        });
      });
      
      setEnrollments(enrollmentList);
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
    }
  };

  const addClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
    try {
      const classesRef = collection(db, 'classes');
      const docRef = await addDoc(classesRef, {
        name: classData.name,
        description: classData.description,
        adminId: classData.adminId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const newClass: Class = {
        id: docRef.id,
        name: classData.name,
        description: classData.description,
        adminId: classData.adminId,
        createdAt: new Date()
      };
      
      setClasses(prev => [newClass, ...prev]);
    } catch (error) {
      console.error('Erro ao criar turma:', error);
    }
  };

  const updateClass = async (id: string, classData: Partial<Pick<Class, 'name' | 'description'>>) => {
    try {
      const classRef = doc(db, 'classes', id);
      await updateDoc(classRef, {
        ...classData,
        updatedAt: serverTimestamp()
      });

      setClasses(prev => prev.map(c => 
        c.id === id ? { ...c, ...classData } : c
      ));
    } catch (error) {
      console.error('Erro ao atualizar turma:', error);
    }
  };

  const deleteClass = async (id: string) => {
    try {
      // Deletar turma
      const classRef = doc(db, 'classes', id);
      await deleteDoc(classRef);

      // Deletar aulas relacionadas
      const lessonsRef = collection(db, 'lessons');
      const lessonsQuery = query(lessonsRef, where('classId', '==', id));
      const lessonsSnapshot = await getDocs(lessonsQuery);
      
      const deletePromises = lessonsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Deletar matrículas relacionadas
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(enrollmentsRef, where('classId', '==', id));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      const deleteEnrollmentPromises = enrollmentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteEnrollmentPromises);

      // Atualizar estado local
      setClasses(prev => prev.filter(c => c.id !== id));
      setLessons(prev => prev.filter(l => l.classId !== id));
      setEnrollments(prev => prev.filter(e => e.classId !== id));
    } catch (error) {
      console.error('Erro ao deletar turma:', error);
    }
  };

  const addLesson = async (lessonData: Omit<Lesson, 'id' | 'createdAt'>) => {
    try {
      const lessonsRef = collection(db, 'lessons');
      const docRef = await addDoc(lessonsRef, {
        title: lessonData.title,
        description: lessonData.description,
        classId: lessonData.classId,
        date: Timestamp.fromDate(lessonData.date),
        duration: lessonData.duration,
        materials: lessonData.materials,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const newLesson: Lesson = {
        id: docRef.id,
        title: lessonData.title,
        description: lessonData.description,
        classId: lessonData.classId,
        date: lessonData.date,
        duration: lessonData.duration,
        materials: lessonData.materials,
        createdAt: new Date()
      };
      
      setLessons(prev => [newLesson, ...prev]);
    } catch (error) {
      console.error('Erro ao criar aula:', error);
    }
  };

  const updateLesson = async (id: string, lessonData: Partial<Pick<Lesson, 'title' | 'description' | 'date' | 'duration' | 'materials'>>) => {
    try {
      const lessonRef = doc(db, 'lessons', id);
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (lessonData.title !== undefined) updateData.title = lessonData.title;
      if (lessonData.description !== undefined) updateData.description = lessonData.description;
      if (lessonData.date !== undefined) updateData.date = Timestamp.fromDate(lessonData.date);
      if (lessonData.duration !== undefined) updateData.duration = lessonData.duration;
      if (lessonData.materials !== undefined) updateData.materials = lessonData.materials;

      await updateDoc(lessonRef, updateData);

      setLessons(prev => prev.map(l => 
        l.id === id ? { ...l, ...lessonData } : l
      ));
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      // Deletar aula
      const lessonRef = doc(db, 'lessons', id);
      await deleteDoc(lessonRef);

      // Deletar presenças relacionadas
      const attendancesRef = collection(db, 'attendances');
      const attendancesQuery = query(attendancesRef, where('lessonId', '==', id));
      const attendancesSnapshot = await getDocs(attendancesQuery);
      
      const deletePromises = attendancesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Atualizar estado local
      setLessons(prev => prev.filter(l => l.id !== id));
      setAttendances(prev => prev.filter(a => a.lessonId !== id));
    } catch (error) {
      console.error('Erro ao deletar aula:', error);
    }
  };

  const markAttendance = async (studentId: string, lessonId: string) => {
    try {
      // Verificar se já existe presença
      const attendancesRef = collection(db, 'attendances');
      const existingQuery = query(
        attendancesRef, 
        where('studentId', '==', studentId),
        where('lessonId', '==', lessonId)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        console.log('Presença já marcada para este aluno nesta aula');
        return;
      }

      const docRef = await addDoc(attendancesRef, {
        studentId,
        lessonId,
        markedAt: serverTimestamp(),
        ipAddress: null // Pode ser implementado posteriormente
      });

      const newAttendance: Attendance = {
        id: docRef.id,
        studentId,
        lessonId,
        markedAt: new Date()
      };
      
      setAttendances(prev => [newAttendance, ...prev]);
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
    }
  };

  const enrollStudent = async (studentId: string, classId: string) => {
    try {
      // Verificar se já existe matrícula
      const enrollmentsRef = collection(db, 'enrollments');
      const existingQuery = query(
        enrollmentsRef, 
        where('studentId', '==', studentId),
        where('classId', '==', classId)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        console.log('Aluno já matriculado nesta turma');
        return;
      }

      const docRef = await addDoc(enrollmentsRef, {
        studentId,
        classId,
        enrolledAt: serverTimestamp()
      });

      const newEnrollment: Enrollment = {
        id: docRef.id,
        studentId,
        classId,
        enrolledAt: new Date()
      };
      
      setEnrollments(prev => [newEnrollment, ...prev]);
    } catch (error) {
      console.error('Erro ao matricular aluno:', error);
    }
  };

  const unenrollStudent = async (studentId: string, classId: string) => {
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(
        enrollmentsRef, 
        where('studentId', '==', studentId),
        where('classId', '==', classId)
      );
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setEnrollments(prev => prev.filter(e => !(e.studentId === studentId && e.classId === classId)));
    } catch (error) {
      console.error('Erro ao desmatricular aluno:', error);
    }
  };

  const getStudentClasses = (studentId: string) => {
    const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
    return classes.filter(c => studentEnrollments.some(e => e.classId === c.id));
  };

  const getClassLessons = (classId: string) => {
    return lessons.filter(l => l.classId === classId);
  };

  const hasAttendance = (studentId: string, lessonId: string) => {
    return attendances.some(a => a.studentId === studentId && a.lessonId === lessonId);
  };

  const getAttendanceCount = (lessonId: string) => {
    return attendances.filter(a => a.lessonId === lessonId).length;
  };

  return (
    <DataContext.Provider value={{
      classes,
      lessons,
      attendances,
      enrollments,
      addClass,
      updateClass,
      deleteClass,
      addLesson,
      updateLesson,
      deleteLesson,
      markAttendance,
      enrollStudent,
      unenrollStudent,
      getStudentClasses,
      getClassLessons,
      hasAttendance,
      getAttendanceCount,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}