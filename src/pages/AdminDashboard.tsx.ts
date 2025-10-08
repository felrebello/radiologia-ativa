// src/pages/AdminDashboard.tsx
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// === IMPORTS DOS MODAIS ===
import CreateClassModal from '../components/CreateClassModal';
import { EditClassModal } from '../components/EditClassModal';
import CreateLessonModal from '../components/CreateLessonModal';
import EditLessonModal from '../components/EditLessonModal';
import { EditStudentModal } from '../components/EditStudentModal';

// === ÍCONES ===
import { 
  Plus, Edit, Trash2, Users, BookOpen, 
  Calendar, TrendingUp, UserCheck, Mail, User 
} from 'lucide-react';

function toDateSafe(input: any): Date {
  if (!input) return new Date(NaN);
  if (input instanceof Date) return input;
  if (typeof input?.toDate === 'function') return input.toDate();
  if (typeof input?.seconds === 'number') return new Date(input.seconds * 1000);
  return new Date(input);
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const data = useData() as any;

  // ====== ESTADO DE MODAIS ======
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);

  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // ====== ABAS ======
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'attendance'>('classes');

  // ====== DADOS (defensivo) ======
  const classes: any[] = data?.classes ?? [];
  const lessonsFlat: any[] = data?.lessons ?? data?.allLessons ?? [];
  const students: any[] = data?.students ?? [];

  const getClassLessons =
    data?.getClassLessons ??
    ((classId: string) => {
      const cls = classes.find((c: any) => c?.id === classId);
      return cls?.lessons ?? [];
    });

  const getAllLessons = data?.getAllLessons ?? (() => lessonsFlat);

  // ====== ACTIONS (defensivo) ======
  const createClass = data?.createClass ?? ((payload: any) => console.log('createClass()', payload));
  const updateClass = data?.updateClass ?? ((id: string, p: any) => console.log('updateClass()', id, p));
  const deleteClass = data?.deleteClass ?? ((id: string) => console.log('deleteClass()', id));

  const createLesson = data?.createLesson ?? ((payload: any) => console.log('createLesson()', payload));
  const updateLesson = data?.updateLesson ?? ((id: string, p: any) => console.log('updateLesson()', id, p));
  const deleteLesson = data?.deleteLesson ?? ((id: string) => console.log('deleteLesson()', id));

  const updateStudent = data?.updateStudent ?? ((id: string, p: any) => console.log('updateStudent()', id, p));
  const deleteStudent = data?.deleteStudent ?? ((id: string) => console.log('deleteStudent()', id));

  // ====== MÉTRICAS ======
  const totalClasses = classes.length;
  const totalLessons = lessonsFlat.length;
  const totalStudents = students.length;
  const totalAttendances = 0; // Você pode calcular se tiver dados de presença

  // ====== HANDLERS ======
  function handleCreateClass(payload: any) {
    createClass(payload);
    setShowCreateClass(false);
  }

  function handleSaveClass(id: string, payload: any) {
    updateClass(id, payload);
    setEditingClass(null);
  }

  function handleDeleteClass(classId: string) {
    if (!confirm('Excluir esta turma? Todas as aulas serão removidas.')) return;
    deleteClass(classId);
  }

  function handleCreateLesson(payload: any) {
    createLesson(payload);
    setShowCreateLesson(false);
    setSelectedClassId(null);
  }

  function handleSaveLesson(id: string, payload: any) {
    updateLesson(id, payload);
    setEditingLesson(null);
  }

  function handleDeleteLesson(lessonId: string) {
    if (!confirm('Excluir esta aula? Todas as presenças serão removidas.')) return;
    deleteLesson(lessonId);
  }

  function handleSaveStudent(id: string, payload: any) {
    updateStudent(id, payload);
    setEditingStudent(null);
  }

  function handleDeleteStudent(studentId: string) {
    if (!confirm('Excluir este aluno? Todas as presenças e matrículas serão removidas.')) return;
    deleteStudent(studentId);
  }

  // ====== LISTAGENS ======
  const classesSorted = [...classes].sort((a, b) =>
    String(a?.name || '').localeCompare(String(b?.name || ''))
  );

  const lessonsSorted =
    getAllLessons()
      ?.map((l: any) => ({ ...l, date: toDateSafe(l?.date) }))
      ?.sort((a: any, b: any) => toDateSafe(a.date).getTime() - toDateSafe(b.date).getTime()) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ===== ESTATÍSTICAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Turmas</p>
              <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-lg p-3">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Aulas</p>
              <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-lg p-3">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Alunos</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Presenças Marcadas</p>
              <p className="text-2xl font-bold text-gray-900">{totalAttendances}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ABAS ===== */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'classes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Turmas e Aulas
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Gerenciar Alunos
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Presenças
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* ===== AÇÕES RÁPIDAS ===== */}
      {activeTab === 'classes' && (
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            type="button"
            onClick={() => setShowCreateClass(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Turma
          </button>
          <button
            type="button"
            onClick={() => setShowCreateLesson(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Aula
          </button>
        </div>
      )}

      {/* ===== CONTEÚDO DAS ABAS ===== */}

      {/* ABA: TURMAS E AULAS */}
      {activeTab === 'classes' && (
        <>
          {classesSorted.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma turma criada</h3>
              <p className="text-gray-600 mb-6">Comece criando sua primeira turma</p>
              <button
                type="button"
                onClick={() => setShowCreateClass(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Criar Primeira Turma
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {classesSorted.map((c: any) => {
                const classLessons = getClassLessons(c.id) || [];
                
                return (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{c.name}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingClass(c)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar turma"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(c.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir turma"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {c.description && (
                        <p className="text-gray-600 mb-3">{c.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {classLessons.length} aulas
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Aulas Recentes</h4>
                        <button
                          type="button"
                          onClick={() => { setSelectedClassId(c.id); setShowCreateLesson(true); }}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          + Adicionar Aula
                        </button>
                      </div>

                      {classLessons.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhuma aula criada ainda</p>
                      ) : (
                        <div className="space-y-3">
                          {classLessons.slice(0, 3).map((lesson: any) => {
                            const dt = toDateSafe(lesson.date);
                            return (
                              <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                <div>
                                  <p className="font-medium text-gray-900">{lesson.title}</p>
                                  <p className="text-sm text-gray-600">
                                    {isNaN(dt.getTime()) ? 'Sem data' : 
                                      `${dt.toLocaleDateString()} às ${dt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
                                    }
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => setEditingLesson(lesson)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Editar aula"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Excluir aula"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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

      {/* ABA: ALUNOS */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Alunos Cadastrados</h3>
            <p className="text-gray-600 mt-1">Gerencie os alunos do sistema</p>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum aluno cadastrado</h3>
              <p className="text-gray-600">Os alunos aparecerão aqui após se cadastrarem</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name || student.email}</div>
                            <div className="text-sm text-gray-500">ID: {student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{student.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingStudent(student)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Editar aluno"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Excluir aluno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA: PRESENÇAS */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Presenças</h3>
          <p className="text-gray-600">Sistema de presenças em desenvolvimento.</p>
        </div>
      )}

      {/* ====== MODAIS ====== */}
      {showCreateClass && (
        <CreateClassModal
          isOpen={showCreateClass}
          onClose={() => setShowCreateClass(false)}
          onCreate={(payload: any) => handleCreateClass(payload)}
        />
      )}

      {editingClass && (
        <EditClassModal
          isOpen={!!editingClass}
          onClose={() => setEditingClass(null)}
          classItem={editingClass}
          onSave={(id: string, payload: any) => handleSaveClass(id, payload)}
        />
      )}

      {showCreateLesson && (
        <CreateLessonModal
          isOpen={showCreateLesson}
          onClose={() => { setShowCreateLesson(false); setSelectedClassId(null); }}
          onCreate={(payload: any) => handleCreateLesson(payload)}
        />
      )}

      {editingLesson && (
        <EditLessonModal
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          lesson={editingLesson}
          onSave={(id: string, payload: any) => handleSaveLesson(id, payload)}
        />
      )}

      {editingStudent && (
        <EditStudentModal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
          onSave={(id: string, payload: any) => handleSaveStudent(id, payload)}
        />
      )}
    </div>
  );
}