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
  Timestamp,
  onSnapshot
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

interface MaterialRating {
  id: string;
  studentId: string;
  materialId: string;
  lessonId: string;
  rating: number; // 1-5 estrelas
  ratedAt: Date;
}

interface DataContextType {
  classes: Class[];
  lessons: Lesson[];
  attendances: Attendance[];
  enrollments: Enrollment[];
  materialRatings: MaterialRating[];
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
  rateMaterial: (studentId: string, materialId: string, lessonId: string, rating: number) => Promise<void>;
  getMaterialRating: (studentId: string, materialId: string) => number | null;
  getAverageMaterialRating: (materialId: string) => { average: number; count: number };
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
  const [materialRatings, setMaterialRatings] = useState<MaterialRating[]>([]);
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

  const loadRatings = async () => {
    try {
      const q = query(collection(db, 'materialRatings'), orderBy('ratedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ratingList: MaterialRating[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), ratedAt: convertTimestamp(doc.data().ratedAt) } as MaterialRating));
      setMaterialRatings(ratingList);
    } catch (error) { console.error('Erro ao carregar avaliações:', error); }
  };

  useEffect(() => {
    const loadAllDataForUser = async () => {
      setIsLoading(true);
      await Promise.all([loadClasses(), loadLessons(), loadEnrollments(), loadAttendances(), loadRatings()]);
      setIsLoading(false);
    };

    const loadRegistrationData = async () => {
      setIsLoading(true);
      await loadClasses(); // Para formulário de registro
      setLessons([]);
      setAttendances([]);
      setEnrollments([]);
      setMaterialRatings([]);
      setIsLoading(false);
    };

    if (user) {
      loadAllDataForUser();

      // Listener em tempo real para turmas
      const classesQuery = query(collection(db, 'classes'), orderBy('createdAt', 'desc'));
      const unsubscribeClasses = onSnapshot(classesQuery, (querySnapshot) => {
        const classList: Class[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt)
        } as Class));
        setClasses(classList);
      }, (error) => {
        console.error('Erro ao escutar turmas:', error);
      });

      // Listener em tempo real para aulas
      const lessonsQuery = query(collection(db, 'lessons'), orderBy('date', 'desc'));
      const unsubscribeLessons = onSnapshot(lessonsQuery, (querySnapshot) => {
        const lessonList: Lesson[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: convertTimestamp(doc.data().date),
          createdAt: convertTimestamp(doc.data().createdAt)
        } as Lesson));
        setLessons(lessonList);
      }, (error) => {
        console.error('Erro ao escutar aulas:', error);
      });

      // Listener em tempo real para matrículas
      const enrollmentsQuery = query(collection(db, 'enrollments'), orderBy('enrolledAt', 'desc'));
      const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, (querySnapshot) => {
        const enrollmentList: Enrollment[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          enrolledAt: convertTimestamp(doc.data().enrolledAt)
        } as Enrollment));
        setEnrollments(enrollmentList);
      }, (error) => {
        console.error('Erro ao escutar matrículas:', error);
      });

      // Listener em tempo real para presenças
      const attendancesQuery = query(collection(db, 'attendances'), orderBy('markedAt', 'desc'));
      const unsubscribeAttendances = onSnapshot(attendancesQuery, (querySnapshot) => {
        const attendanceList: Attendance[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          markedAt: convertTimestamp(doc.data().markedAt)
        } as Attendance));
        setAttendances(attendanceList);
      }, (error) => {
        console.error('Erro ao escutar presenças:', error);
      });

      // Listener em tempo real para avaliações
      const ratingsQuery = query(collection(db, 'materialRatings'), orderBy('ratedAt', 'desc'));
      const unsubscribeRatings = onSnapshot(ratingsQuery, (querySnapshot) => {
        const ratingList: MaterialRating[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ratedAt: convertTimestamp(doc.data().ratedAt)
        } as MaterialRating));
        setMaterialRatings(ratingList);
      }, (error) => {
        console.error('Erro ao escutar avaliações:', error);
      });

      // Cleanup: desinscrever listeners quando o componente desmontar ou user mudar
      return () => {
        unsubscribeClasses();
        unsubscribeLessons();
        unsubscribeEnrollments();
        unsubscribeAttendances();
        unsubscribeRatings();
      };
    } else {
      loadRegistrationData();
    }
  }, [user]);

  const createClass = async (classData: Omit<Class, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'classes'), { ...classData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao criar turma:", error); }
  };

  const updateClass = async (id: string, classData: Partial<Pick<Class, 'name' | 'description'>>) => {
    try {
      await updateDoc(doc(db, 'classes', id), { ...classData, updatedAt: serverTimestamp() });
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao atualizar turma:", error); }
  };

  const deleteClass = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
      // Os listeners em tempo real irão atualizar automaticamente
    } catch (error) { console.error("Erro ao apagar turma:", error); }
  };

  const createLesson = async (lessonData: Omit<Lesson, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'lessons'), { ...lessonData, date: Timestamp.fromDate(lessonData.date), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao criar aula:", error); }
  };

  const updateLesson = async (id: string, lessonData: Partial<Lesson>) => {
    try {
      const updateData: any = { ...lessonData, updatedAt: serverTimestamp() };
      if (lessonData.date) updateData.date = Timestamp.fromDate(lessonData.date);
      await updateDoc(doc(db, 'lessons', id), updateData);
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao atualizar aula:", error); }
  };

  const deleteLesson = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'lessons', id));
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao apagar aula:", error); }
  };

  const markAttendance = async (studentId: string, lessonId: string) => {
    try {
      if (!studentId || !lessonId || hasAttendance(studentId, lessonId)) return;
      await addDoc(collection(db, 'attendances'), { studentId, lessonId, markedAt: serverTimestamp() });
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao marcar presença:", error); }
  };

  const unmarkAttendance = async (studentId: string, lessonId: string) => {
    try {
      const q = query(collection(db, 'attendances'), where('studentId', '==', studentId), where('lessonId', '==', lessonId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao desmarcar presença:", error); }
  };

  const enrollStudent = async (studentId: string, classId: string) => {
    try {
      await addDoc(collection(db, 'enrollments'), { studentId, classId, enrolledAt: serverTimestamp() });
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao matricular aluno:", error); }
  };

  const unenrollStudent = async (studentId: string, classId: string) => {
    try {
      const q = query(collection(db, 'enrollments'), where('studentId', '==', studentId), where('classId', '==', classId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      // O listener em tempo real irá atualizar automaticamente
    } catch (error) { console.error("Erro ao desmatricular aluno:", error); }
  };

  const rateMaterial = async (studentId: string, materialId: string, lessonId: string, rating: number) => {
    try {
      // Verifica se já existe avaliação do aluno para este material
      const q = query(
        collection(db, 'materialRatings'),
        where('studentId', '==', studentId),
        where('materialId', '==', materialId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Cria nova avaliação
        await addDoc(collection(db, 'materialRatings'), {
          studentId,
          materialId,
          lessonId,
          rating,
          ratedAt: serverTimestamp()
        });
      } else {
        // Atualiza avaliação existente
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          rating,
          ratedAt: serverTimestamp()
        });
      }

      // O listener em tempo real irá atualizar automaticamente
    } catch (error) {
      console.error('Erro ao avaliar material:', error);
    }
  };

  const getMaterialRating = (studentId: string, materialId: string): number | null => {
    const rating = materialRatings.find(r => r.studentId === studentId && r.materialId === materialId);
    return rating ? rating.rating : null;
  };

  const getAverageMaterialRating = (materialId: string): { average: number; count: number } => {
    const ratings = materialRatings.filter(r => r.materialId === materialId);
    if (ratings.length === 0) return { average: 0, count: 0 };

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: sum / ratings.length,
      count: ratings.length
    };
  };

  const getStudentClasses = (studentId: string) => {
    const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
    return classes.filter(c => studentEnrollments.some(e => e.classId === c.id));
  };

  const getClassLessons = (classId: string) => lessons.filter(l => l.classId === classId);
  const hasAttendance = (studentId: string, lessonId: string) => {
    return attendances.some(a => a.studentId === studentId && a.lessonId === lessonId);
  };
  const getAttendanceCount = (lessonId: string) => attendances.filter(a => a.lessonId === lessonId).length;

  return (
    <DataContext.Provider value={{
      classes, lessons, attendances, enrollments, materialRatings,
      createClass, updateClass, deleteClass,
      createLesson, updateLesson, deleteLesson,
      markAttendance, unmarkAttendance,
      enrollStudent, unenrollStudent,
      rateMaterial, getMaterialRating, getAverageMaterialRating,
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