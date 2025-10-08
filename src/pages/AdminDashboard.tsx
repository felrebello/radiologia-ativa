import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { EditClassModal } from '../components/EditClassModal';
import CreateClassModal from '../components/CreateClassModal';
import CreateLessonModal from '../components/CreateLessonModal';
import EditLessonModal from '../components/EditLessonModal';
import { EditStudentModal } from '../components/EditStudentModal';
import { Plus, Edit, Trash2, Users, BookOpen, Calendar, TrendingUp, UserCheck, Mail, User, Phone } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'attendance'>('classes');

  const classes: any[] = data?.classes ?? [];
  const lessonsFlat: any[] = data?.lessons ?? [];
  const students: any[] = users.filter((u: any) => u.role === 'student') ?? [];
  const attendances: any[] = data?.attendances ?? [];

  const {
    createClass, updateClass, deleteClass,
    createLesson, updateLesson, deleteLesson,
    updateUser: updateStudent, deleteUser: deleteStudent,
    unmarkAttendance, getClassLessons
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
      <div className="mb-8"><div className="border-b border-gray-200"><nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto"><button type="button" onClick={() => setActiveTab('classes')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'classes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><div className="flex items-center gap-2"><Users className="w-4 h-4" />Turmas e Aulas</div></button><button type="button" onClick={() => setActiveTab('students')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'students' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><div className="flex items-center gap-2"><UserCheck className="w-4 h-4" />Gerenciar Alunos</div></button><button type="button" onClick={() => setActiveTab('attendance')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'attendance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Presenças</div></button></nav></div></div>
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
          <div className="p-4 sm:p-6 border-b border-gray-100"><h3 className="text-xl font-semibold text-gray-900">Alunos Cadastrados</h3><p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie os alunos do sistema</p></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatos</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student: any) => (<tr key={student.id}><td className="px-4 py-4 whitespace-nowrap"><div className="flex items-center"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div><div className="ml-3"><div className="text-sm font-medium text-gray-900">{student.name}</div></div></div></td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800"><div>{student.email}</div><div className="text-gray-500">{student.phone || 'Sem telefone'}</div></td><td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ativo</span></td><td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-end gap-0 sm:gap-2"><button onClick={() => setEditingStudent(student)} className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'attendance' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 sm:p-6 border-b border-gray-100"><h3 className="text-xl font-semibold text-gray-900">Registro de Presenças</h3><p className="text-gray-600 mt-1 text-sm sm:text-base">Lista de todas as presenças marcadas no sistema</p></div>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Data</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceSorted.map((att: any) => {
                  const student = students.find(s => s.id === att.studentId);
                  const lesson = lessonsFlat.find(l => l.id === att.lessonId);
                  return (<tr key={att.id}><td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student?.name || 'Aluno removido'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lesson?.title || 'Aula removida'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{toDateSafe(att.markedAt).toLocaleString()}</td><td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => { if (unmarkAttendance && confirm('Desmarcar presença?')) { unmarkAttendance(att.studentId, att.lessonId); } }} className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50" title="Desmarcar presença"><Trash2 className="w-4 h-4" /></button></td></tr>);
                })}
              </tbody>
            </table>
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