import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { EditClassModal } from '../components/EditClassModal';
import CreateClassModal from '../components/CreateClassModal';
import CreateLessonModal from '../components/CreateLessonModal';
import EditLessonModal from '../components/EditLessonModal';
import { EditStudentModal } from '../components/EditStudentModal';
import { StarRating } from '../components/StarRating';
import { Plus, Edit, Trash2, Users, BookOpen, Calendar, TrendingUp, UserCheck, Mail, User, Phone, Download, Filter, FileText, Star, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function toDateSafe(input: any): Date {
  if (!input) return new Date(NaN);
  if (input instanceof Date) return input;
  if (typeof input?.toDate === 'function') return input.toDate();
  if (typeof input?.seconds === 'number') return new Date(input.seconds * 1000);
  return new Date(input);
}

export default function AdminDashboard() {
  const { user, users } = useAuth();
  const data = useData() as any;

  const [showCreateClass, setShowCreateClass] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'attendance' | 'ratings'>('classes');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Filtros para relatório de presença
  const [attendanceClassFilter, setAttendanceClassFilter] = useState<string>('all');
  const [attendanceLessonFilter, setAttendanceLessonFilter] = useState<string>('all');
  const [attendanceDateStart, setAttendanceDateStart] = useState<string>('');
  const [attendanceDateEnd, setAttendanceDateEnd] = useState<string>('');

  // Filtros para avaliações
  const [ratingsClassFilter, setRatingsClassFilter] = useState<string>('all');
  const [ratingsLessonFilter, setRatingsLessonFilter] = useState<string>('all');

  const classes: any[] = data?.classes ?? [];
  const lessonsFlat: any[] = data?.lessons ?? [];
  const students: any[] = users.filter((u: any) => u.role === 'student') ?? [];
  const attendances: any[] = data?.attendances ?? [];
  const enrollments: any[] = data?.enrollments ?? [];
  const materialRatings: any[] = data?.materialRatings ?? [];

  const {
    createClass, updateClass, deleteClass,
    createLesson, updateLesson, deleteLesson,
    updateUser: updateStudent, deleteUser: deleteStudent,
    unmarkAttendance, getClassLessons,
    getAverageMaterialRating
  } = data;

  const totalClasses = classes.length;
  const totalLessons = lessonsFlat.length;
  const totalStudents = students.length;
  const totalAttendances = attendances.length;

  function handleCreateClass(payload: any) {
    if (createClass) createClass({ ...payload, adminId: user?.id });
    setShowCreateClass(false);
  }
  function handleSaveClass(id: string, payload: any) {
    if (updateClass) updateClass(id, payload);
    setEditingClass(null);
  }
  function handleDeleteClass(classId: string) {
    if (deleteClass && confirm('Excluir esta turma? Todas as aulas serão removidas.')) {
      deleteClass(classId);
    }
  }
  // --- CORREÇÃO APLICADA AQUI ---
  function handleCreateLesson(payload: any) {
    // A payload vinda do modal já tem o `classId` correto.
    // Se `selectedClassId` existir (caso o botão "Nova Aula" geral seja usado), ele é adicionado.
    const finalPayload = { ...payload, classId: payload.classId || selectedClassId };
    if (createLesson && finalPayload.classId) {
        createLesson(finalPayload);
    } else {
        alert("Erro: Nenhuma turma foi selecionada para esta aula.");
    }
    setShowCreateLesson(false);
    setSelectedClassId(null);
  }
  // --- FIM DA CORREÇÃO ---
  function handleSaveLesson(id: string, payload: any) {
    if (updateLesson) updateLesson(id, payload);
    setEditingLesson(null);
  }
  function handleDeleteLesson(lessonId: string) {
    if (deleteLesson && confirm('Excluir esta aula? Todas as presenças serão removidas.')) {
      deleteLesson(lessonId);
    }
  }
  function handleSaveStudent(id: string, payload: any) {
    if (updateStudent) updateStudent(id, payload);
    setEditingStudent(null);
  }
  function handleDeleteStudent(studentId: string) {
    if (deleteStudent && confirm('Excluir este aluno? Todas as presenças e matrículas serão removidas.')) {
      deleteStudent(studentId);
    }
  }

  const classesSorted = [...classes].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
  const attendanceSorted = [...attendances].sort((a, b) => toDateSafe(b.markedAt).getTime() - toDateSafe(a.markedAt).getTime());

  // Filter students by class
  const filteredStudents = classFilter === 'all'
    ? students
    : students.filter((student: any) =>
        enrollments.some((enrollment: any) =>
          enrollment.studentId === student.id && enrollment.classId === classFilter
        )
      );

  // Filter attendances based on filters
  const getFilteredAttendances = () => {
    let filtered = [...attendances];

    // Filter by class
    if (attendanceClassFilter !== 'all') {
      const classLessonsIds = lessonsFlat
        .filter(l => l.classId === attendanceClassFilter)
        .map(l => l.id);
      filtered = filtered.filter(att => classLessonsIds.includes(att.lessonId));
    }

    // Filter by lesson
    if (attendanceLessonFilter !== 'all') {
      filtered = filtered.filter(att => att.lessonId === attendanceLessonFilter);
    }

    // Filter by date range
    if (attendanceDateStart) {
      const startDate = new Date(attendanceDateStart);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(att => toDateSafe(att.markedAt) >= startDate);
    }
    if (attendanceDateEnd) {
      const endDate = new Date(attendanceDateEnd);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(att => toDateSafe(att.markedAt) <= endDate);
    }

    return filtered;
  };

  const filteredAttendances = getFilteredAttendances();

  // Get lessons filtered by selected class for the lesson dropdown
  const availableLessons = attendanceClassFilter !== 'all'
    ? lessonsFlat.filter(l => l.classId === attendanceClassFilter)
    : lessonsFlat;

  // Export to CSV
  const exportAttendancesToCSV = () => {
    const dataToExport = filteredAttendances.map((att: any) => {
      const student = students.find(s => s.id === att.studentId);
      const lesson = lessonsFlat.find(l => l.id === att.lessonId);
      const classItem = classes.find(c => c.id === lesson?.classId);
      const markedAtDate = toDateSafe(att.markedAt);

      return {
        'Nome do Aluno': student?.name || 'Aluno removido',
        'Email': student?.email || 'N/A',
        'Turma': classItem?.name || 'Turma removida',
        'Aula': lesson?.title || 'Aula removida',
        'Data da Aula': lesson?.date ? toDateSafe(lesson.date).toLocaleDateString('pt-BR') : 'N/A',
        'Data da Presença': markedAtDate.toLocaleDateString('pt-BR'),
        'Hora da Presença': markedAtDate.toLocaleTimeString('pt-BR')
      };
    });

    if (dataToExport.length === 0) {
      alert('Nenhuma presença para exportar com os filtros aplicados.');
      return;
    }

    // Create CSV content
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in values
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    // Generate filename with date
    const now = new Date();
    const filename = `relatorio-presencas-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportAttendancesToPDF = () => {
    const dataToExport = filteredAttendances.map((att: any) => {
      const student = students.find(s => s.id === att.studentId);
      const lesson = lessonsFlat.find(l => l.id === att.lessonId);
      const classItem = classes.find(c => c.id === lesson?.classId);
      const markedAtDate = toDateSafe(att.markedAt);

      return [
        student?.name || 'Aluno removido',
        student?.email || 'N/A',
        classItem?.name || 'Turma removida',
        lesson?.title || 'Aula removida',
        lesson?.date ? toDateSafe(lesson.date).toLocaleDateString('pt-BR') : 'N/A',
        markedAtDate.toLocaleDateString('pt-BR'),
        markedAtDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      ];
    });

    if (dataToExport.length === 0) {
      alert('Nenhuma presença para exportar com os filtros aplicados.');
      return;
    }

    // Create PDF
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation

    // Title
    doc.setFontSize(18);
    doc.text('Relatório de Presenças', 14, 15);

    // Subtitle with filters
    doc.setFontSize(10);
    let subtitle = 'Filtros aplicados: ';
    const filters: string[] = [];

    if (attendanceClassFilter !== 'all') {
      const selectedClass = classes.find(c => c.id === attendanceClassFilter);
      filters.push(`Turma: ${selectedClass?.name || 'N/A'}`);
    }
    if (attendanceLessonFilter !== 'all') {
      const selectedLesson = lessonsFlat.find(l => l.id === attendanceLessonFilter);
      filters.push(`Aula: ${selectedLesson?.title || 'N/A'}`);
    }
    if (attendanceDateStart) {
      filters.push(`Data Inicial: ${new Date(attendanceDateStart).toLocaleDateString('pt-BR')}`);
    }
    if (attendanceDateEnd) {
      filters.push(`Data Final: ${new Date(attendanceDateEnd).toLocaleDateString('pt-BR')}`);
    }

    if (filters.length > 0) {
      subtitle += filters.join(' | ');
    } else {
      subtitle = 'Todas as presenças';
    }

    doc.text(subtitle, 14, 22);

    // Add generation date
    const now = new Date();
    doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 14, 28);

    // Table
    autoTable(doc, {
      head: [['Aluno', 'Email', 'Turma', 'Aula', 'Data Aula', 'Data Presença', 'Hora']],
      body: dataToExport,
      startY: 32,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // gray-50
      },
      margin: { left: 14, right: 14 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Generate filename with date
    const filename = `relatorio-presencas-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`;
    doc.save(filename);
  };

  // Export Students to CSV
  const exportStudentsToCSV = () => {
    const dataToExport = filteredStudents.map((student: any) => {
      // Get all classes the student is enrolled in
      const studentClasses = enrollments
        .filter((enrollment: any) => enrollment.studentId === student.id)
        .map((enrollment: any) => {
          const classItem = classes.find(c => c.id === enrollment.classId);
          return classItem?.name || 'Turma removida';
        })
        .join('; ');

      return {
        'Nome': student.name || '',
        'Email': student.email || '',
        'Telefone': student.phone || '',
        'Status': 'Ativo',
        'Turmas': studentClasses || 'Nenhuma turma'
      };
    });

    if (dataToExport.length === 0) {
      alert('Nenhum aluno para exportar com os filtros aplicados.');
      return;
    }

    // Create CSV content
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in values
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    // Generate filename with date
    const now = new Date();
    const filename = `alunos-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Students to Excel
  const exportStudentsToExcel = () => {
    const dataToExport = filteredStudents.map((student: any) => {
      // Get all classes the student is enrolled in
      const studentClasses = enrollments
        .filter((enrollment: any) => enrollment.studentId === student.id)
        .map((enrollment: any) => {
          const classItem = classes.find(c => c.id === enrollment.classId);
          return classItem?.name || 'Turma removida';
        })
        .join('; ');

      return {
        'Nome': student.name || '',
        'Email': student.email || '',
        'Telefone': student.phone || '',
        'Status': 'Ativo',
        'Turmas': studentClasses || 'Nenhuma turma'
      };
    });

    if (dataToExport.length === 0) {
      alert('Nenhum aluno para exportar com os filtros aplicados.');
      return;
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Nome
      { wch: 35 }, // Email
      { wch: 20 }, // Telefone
      { wch: 10 }, // Status
      { wch: 40 }  // Turmas
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos');

    // Generate filename with date
    const now = new Date();
    const filename = `alunos-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  };

  // Export Students to PDF
  const exportStudentsToPDF = () => {
    const dataToExport = filteredStudents.map((student: any) => {
      // Get all classes the student is enrolled in
      const studentClasses = enrollments
        .filter((enrollment: any) => enrollment.studentId === student.id)
        .map((enrollment: any) => {
          const classItem = classes.find(c => c.id === enrollment.classId);
          return classItem?.name || 'Turma removida';
        })
        .join(', ');

      return [
        student.name || '',
        student.email || '',
        student.phone || '',
        'Ativo',
        studentClasses || 'Nenhuma turma'
      ];
    });

    if (dataToExport.length === 0) {
      alert('Nenhum aluno para exportar com os filtros aplicados.');
      return;
    }

    // Create PDF
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation

    // Title
    doc.setFontSize(18);
    doc.text('Relatório de Alunos', 14, 15);

    // Subtitle with filters
    doc.setFontSize(10);
    let subtitle = '';
    if (classFilter !== 'all') {
      const selectedClass = classes.find(c => c.id === classFilter);
      subtitle = `Turma: ${selectedClass?.name || 'N/A'}`;
    } else {
      subtitle = 'Todos os alunos';
    }
    doc.text(subtitle, 14, 22);

    // Add generation date
    const now = new Date();
    doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 14, 28);

    // Table
    autoTable(doc, {
      head: [['Nome', 'Email', 'Telefone', 'Status', 'Turmas']],
      body: dataToExport,
      startY: 32,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // gray-50
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Nome
        1: { cellWidth: 60 }, // Email
        2: { cellWidth: 35 }, // Telefone
        3: { cellWidth: 20 }, // Status
        4: { cellWidth: 'auto' } // Turmas
      },
      margin: { left: 14, right: 14 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Generate filename with date
    const filename = `alunos-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
      {/* ===== ESTATÍSTICAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"><div className="flex items-center gap-4"><div className="bg-blue-100 rounded-lg p-3"><Users className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-600">Total de Turmas</p><p className="text-2xl font-bold text-gray-900">{totalClasses}</p></div></div></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"><div className="flex items-center gap-4"><div className="bg-green-100 rounded-lg p-3"><BookOpen className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-600">Total de Aulas</p><p className="text-2xl font-bold text-gray-900">{totalLessons}</p></div></div></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"><div className="flex items-center gap-4"><div className="bg-purple-100 rounded-lg p-3"><UserCheck className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-600">Total de Alunos</p><p className="text-2xl font-bold text-gray-900">{totalStudents}</p></div></div></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"><div className="flex items-center gap-4"><div className="bg-orange-100 rounded-lg p-3"><TrendingUp className="w-6 h-6 text-orange-600" /></div><div><p className="text-sm text-gray-600">Presenças Marcadas</p><p className="text-2xl font-bold text-gray-900">{totalAttendances}</p></div></div></div>
      </div>
      {/* ===== ABAS ===== */}
      <div className="mb-8"><div className="border-b border-gray-200"><nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto"><button type="button" onClick={() => setActiveTab('classes')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'classes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><div className="flex items-center gap-2"><Users className="w-4 h-4" />Turmas e Aulas</div></button><button type="button" onClick={() => setActiveTab('students')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'students' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><div className="flex items-center gap-2"><UserCheck className="w-4 h-4" />Gerenciar Alunos</div></button><button type="button" onClick={() => setActiveTab('attendance')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'attendance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Presenças</div></button><button type="button" onClick={() => setActiveTab('ratings')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ratings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><div className="flex items-center gap-2"><Star className="w-4 h-4" />Avaliações</div></button></nav></div></div>
      {/* ===== AÇÕES RÁPIDAS ===== */}
      {activeTab === 'classes' && <div className="flex flex-wrap gap-4 mb-8"><button type="button" onClick={() => setShowCreateClass(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"><Plus className="w-4 h-4" />Nova Turma</button><button type="button" onClick={() => { setSelectedClassId(null); setShowCreateLesson(true); }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"><Plus className="w-4 h-4" />Nova Aula</button></div>}
      
      {/* ===== CONTEÚDO DAS ABAS ===== */}
      {activeTab === 'classes' && (
        <>
          {classesSorted.length === 0 ? <div className="text-center py-12"><Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma turma criada</h3><p className="text-gray-600 mb-6">Comece criando sua primeira turma</p><button type="button" onClick={() => setShowCreateClass(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">Criar Primeira Turma</button></div> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {classesSorted.map((c: any) => {
                const classLessons = getClassLessons ? (getClassLessons(c.id) || []) : [];
                return (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{c.name}</h3>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setEditingClass(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar turma"><Edit className="w-4 h-4" /></button>
                          <button type="button" onClick={() => handleDeleteClass(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir turma"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {c.description && (<p className="text-gray-600 mb-3">{c.description}</p>)}
                      <div className="flex items-center gap-4 text-sm text-gray-500"><span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{classLessons.length} aulas</span></div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Aulas Recentes</h4>
                        <button type="button" onClick={() => { setSelectedClassId(c.id); setShowCreateLesson(true); }} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">+ Adicionar Aula</button>
                      </div>
                      {classLessons.length === 0 ? (<p className="text-gray-500 text-sm">Nenhuma aula criada ainda</p>) : (
                        <div className="space-y-3">
                          {classLessons.slice(0, 3).map((lesson: any) => {
                            const dt = toDateSafe(lesson.date);
                            return (
                              <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                <div>
                                  <p className="font-medium text-gray-900">{lesson.title}</p>
                                  <p className="text-sm text-gray-600">{isNaN(dt.getTime()) ? 'Sem data' : `${dt.toLocaleDateString()} às ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button type="button" onClick={() => setEditingLesson(lesson)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Editar aula"><Edit className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => handleDeleteLesson(lesson.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Excluir aula"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Alunos Cadastrados</h3>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie os alunos do sistema</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={exportStudentsToCSV}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    title="Exportar alunos filtrados para CSV"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={exportStudentsToExcel}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                    title="Exportar alunos filtrados para Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={exportStudentsToPDF}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    title="Exportar alunos filtrados para PDF"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="classFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por turma:</label>
                <select
                  id="classFilter"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="block w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Todas as turmas</option>
                  {classesSorted.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatos</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student: any) => {
                  // Format phone for WhatsApp (remove non-digits)
                  const phoneForWhatsApp = student.phone ? student.phone.replace(/\D/g, '') : '';
                  const whatsappLink = phoneForWhatsApp ? `https://wa.me/${phoneForWhatsApp}` : '';
                  const gmailLink = student.email ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(student.email)}` : '';

                  return (<tr key={student.id}><td className="px-4 py-4 whitespace-nowrap"><div className="flex items-center"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div><div className="ml-3"><div className="text-sm font-medium text-gray-900">{student.name}</div></div></div></td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800"><div className="flex items-center gap-2">{gmailLink ? (<a href={gmailLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1" title="Enviar email via Gmail"><Mail className="w-4 h-4" />{student.email}</a>) : (<span>{student.email}</span>)}</div><div className="flex items-center gap-2 text-gray-500">{whatsappLink ? (<a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 hover:underline flex items-center gap-1" title="Abrir no WhatsApp"><Phone className="w-4 h-4" />{student.phone}</a>) : (<span>{student.phone || 'Sem telefone'}</span>)}</div></td><td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ativo</span></td><td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end gap-0 sm:gap-2"><button onClick={() => setEditingStudent(student)} className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></div></td></tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with title and export buttons */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Registro de Presenças</h3>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Filtre e exporte relatórios de presença
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={exportAttendancesToCSV}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  title="Exportar relatório filtrado para CSV"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
                <button
                  onClick={exportAttendancesToPDF}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  title="Exportar relatório filtrado para PDF"
                >
                  <FileText className="w-4 h-4" />
                  Exportar PDF
                </button>
              </div>
            </div>

            {/* Filters section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Filtros</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Class filter */}
                <div>
                  <label htmlFor="attendanceClassFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Turma
                  </label>
                  <select
                    id="attendanceClassFilter"
                    value={attendanceClassFilter}
                    onChange={(e) => {
                      setAttendanceClassFilter(e.target.value);
                      setAttendanceLessonFilter('all'); // Reset lesson filter when class changes
                    }}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">Todas as turmas</option>
                    {classesSorted.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lesson filter */}
                <div>
                  <label htmlFor="attendanceLessonFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Aula
                  </label>
                  <select
                    id="attendanceLessonFilter"
                    value={attendanceLessonFilter}
                    onChange={(e) => setAttendanceLessonFilter(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={attendanceClassFilter === 'all'}
                  >
                    <option value="all">Todas as aulas</option>
                    {availableLessons.map((lesson: any) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date start filter */}
                <div>
                  <label htmlFor="attendanceDateStart" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    id="attendanceDateStart"
                    value={attendanceDateStart}
                    onChange={(e) => setAttendanceDateStart(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Date end filter */}
                <div>
                  <label htmlFor="attendanceDateEnd" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    id="attendanceDateEnd"
                    value={attendanceDateEnd}
                    onChange={(e) => setAttendanceDateEnd(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Clear filters button */}
              {(attendanceClassFilter !== 'all' || attendanceLessonFilter !== 'all' || attendanceDateStart || attendanceDateEnd) && (
                <button
                  onClick={() => {
                    setAttendanceClassFilter('all');
                    setAttendanceLessonFilter('all');
                    setAttendanceDateStart('');
                    setAttendanceDateEnd('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Limpar filtros
                </button>
              )}

              {/* Results count */}
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{filteredAttendances.length}</span> de{' '}
                <span className="font-semibold">{attendances.length}</span> presenças
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turma
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aula
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Data
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma presença encontrada com os filtros aplicados
                    </td>
                  </tr>
                ) : (
                  filteredAttendances
                    .sort((a, b) => toDateSafe(b.markedAt).getTime() - toDateSafe(a.markedAt).getTime())
                    .map((att: any) => {
                      const student = students.find(s => s.id === att.studentId);
                      const lesson = lessonsFlat.find(l => l.id === att.lessonId);
                      const classItem = classes.find(c => c.id === lesson?.classId);

                      return (
                        <tr key={att.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student?.name || 'Aluno removido'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {classItem?.name || 'Turma removida'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {lesson?.title || 'Aula removida'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                            {toDateSafe(att.markedAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                if (unmarkAttendance && confirm('Desmarcar presença?')) {
                                  unmarkAttendance(att.studentId, att.lessonId);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                              title="Desmarcar presença"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'ratings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Avaliações de Materiais</h3>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Visualize as avaliações dos materiais das aulas
                </p>
              </div>
            </div>

            {/* Filters section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Filtros</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Class filter */}
                <div>
                  <label htmlFor="ratingsClassFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Turma
                  </label>
                  <select
                    id="ratingsClassFilter"
                    value={ratingsClassFilter}
                    onChange={(e) => {
                      setRatingsClassFilter(e.target.value);
                      setRatingsLessonFilter('all');
                    }}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">Todas as turmas</option>
                    {classesSorted.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lesson filter */}
                <div>
                  <label htmlFor="ratingsLessonFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Aula
                  </label>
                  <select
                    id="ratingsLessonFilter"
                    value={ratingsLessonFilter}
                    onChange={(e) => setRatingsLessonFilter(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={ratingsClassFilter === 'all'}
                  >
                    <option value="all">Todas as aulas</option>
                    {(ratingsClassFilter !== 'all' ? lessonsFlat.filter(l => l.classId === ratingsClassFilter) : lessonsFlat).map((lesson: any) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear filters button */}
              {(ratingsClassFilter !== 'all' || ratingsLessonFilter !== 'all') && (
                <button
                  onClick={() => {
                    setRatingsClassFilter('all');
                    setRatingsLessonFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Materials with ratings */}
          <div className="p-4 sm:p-6">
            {(() => {
              // Get filtered lessons
              let filteredLessons = lessonsFlat;
              if (ratingsClassFilter !== 'all') {
                filteredLessons = filteredLessons.filter(l => l.classId === ratingsClassFilter);
              }
              if (ratingsLessonFilter !== 'all') {
                filteredLessons = filteredLessons.filter(l => l.id === ratingsLessonFilter);
              }

              // Get all materials from filtered lessons
              const materialsWithInfo: any[] = [];
              filteredLessons.forEach((lesson: any) => {
                if (lesson.materials && lesson.materials.length > 0) {
                  lesson.materials.forEach((material: any) => {
                    const classItem = classes.find(c => c.id === lesson.classId);
                    const avgRating = getAverageMaterialRating ? getAverageMaterialRating(material.id) : { average: 0, count: 0 };
                    const ratings = materialRatings.filter((r: any) => r.materialId === material.id);

                    materialsWithInfo.push({
                      material,
                      lesson,
                      class: classItem,
                      avgRating,
                      ratings
                    });
                  });
                }
              });

              if (materialsWithInfo.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    Nenhum material encontrado com os filtros aplicados
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {materialsWithInfo.map((item: any, index: number) => (
                    <div key={`${item.material.id}-${index}`} className="border border-gray-200 rounded-lg p-4">
                      {/* Material header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.material.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              Aula: {item.lesson.title}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">
                              Turma: {item.class?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating
                            rating={item.avgRating.average}
                            readonly
                            size="md"
                          />
                          <span className="text-xs text-gray-500">
                            {item.avgRating.count} avaliação{item.avgRating.count !== 1 ? 'ões' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Individual ratings */}
                      {item.ratings.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Avaliações individuais:</h5>
                          <div className="space-y-2">
                            {item.ratings.map((rating: any) => {
                              const student = students.find((s: any) => s.id === rating.studentId);
                              return (
                                <div key={rating.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                  <span className="text-sm text-gray-700">
                                    {student?.name || 'Aluno removido'}
                                  </span>
                                  <StarRating
                                    rating={rating.rating}
                                    readonly
                                    size="sm"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {showCreateClass && <CreateClassModal isOpen={showCreateClass} onClose={() => setShowCreateClass(false)} onCreate={handleCreateClass} />}
      {editingClass && <EditClassModal classItem={editingClass} onClose={() => setEditingClass(null)} onSave={handleSaveClass} />}
      {showCreateLesson && <CreateLessonModal isOpen={showCreateLesson} onClose={() => { setShowCreateLesson(false); setSelectedClassId(null); }} onCreate={handleCreateLesson} initialClassId={selectedClassId} />}
      {editingLesson && <EditLessonModal isOpen={!!editingLesson} onClose={() => setEditingLesson(null)} lesson={editingLesson} onSave={handleSaveLesson} />}
      {editingStudent && <EditStudentModal student={editingStudent} onClose={() => setEditingStudent(null)} />}
    </div>
  );
}