/**
 * Modal para edição de alunos
 * Interface para administradores editarem dados dos alunos e gerenciarem matrículas
 */

import React, { useState } from 'react';
import { X, User, Save, Mail, Users, Plus, Trash2, UserMinus, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { User as UserType } from '../types';

interface EditStudentModalProps {
  student: UserType;
  onClose: () => void;
}

export function EditStudentModal({ student, onClose }: EditStudentModalProps) {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [phone, setPhone] = useState(student.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'enrollments'>('info');
  
  const { updateUser } = useAuth();
  const { classes, enrollments, enrollStudent, unenrollStudent } = useData();

  // Turmas em que o aluno está matriculado
  const studentEnrollments = enrollments.filter(e => e.studentId === student.id);
  const enrolledClasses = studentEnrollments.map(enrollment => {
    const classItem = classes.find(c => c.id === enrollment.classId);
    return {
      ...enrollment,
      class: classItem
    };
  }).filter(item => item.class);

  // Turmas disponíveis para matrícula
  const availableClasses = classes.filter(c => 
    !studentEnrollments.some(e => e.classId === c.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    
    // Simular delay de atualização
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await updateUser(student.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim()
    });

    setIsLoading(false);
    onClose();
  };

  const handleEnrollInClass = async (classId: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    enrollStudent(student.id, classId);
    setIsLoading(false);
  };

  const handleUnenrollFromClass = async (classId: string) => {
    if (!confirm('Tem certeza que deseja remover este aluno da turma? O histórico de presenças será mantido.')) {
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    unenrollStudent(student.id, classId);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Aluno</h2>
              <p className="text-sm text-gray-600">{student.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navegação por Abas */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações Pessoais
              </div>
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'enrollments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Turmas ({enrolledClasses.length})
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Aba de Informações Pessoais */}
          {activeTab === 'info' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Nome completo do aluno"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Celular
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="(21) 99999-9999"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name.trim() || !email.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Aba de Matrículas */}
          {activeTab === 'enrollments' && (
            <div className="space-y-6">
              {/* ... (o restante do código da aba de matrículas continua igual) */}
                 <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Turmas Matriculadas ({enrolledClasses.length})
                </h3>
                
                {enrolledClasses.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Este aluno não está matriculado em nenhuma turma</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledClasses.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.class?.name}</h4>
                          <p className="text-sm text-gray-600">{item.class?.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Matriculado em {item.enrolledAt.toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnenrollFromClass(item.classId)}
                          disabled={isLoading}
                          className="flex items-center gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                          title="Remover da turma"
                        >
                          <UserMinus className="w-4 h-4" />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {availableClasses.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Turmas Disponíveis ({availableClasses.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {availableClasses.map((classItem) => (
                      <div key={classItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <h4 className="font-medium text-gray-900">{classItem.name}</h4>
                          <p className="text-sm text-gray-600">{classItem.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Criada em {classItem.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEnrollInClass(classItem.id)}
                          disabled={isLoading}
                          className="flex items-center gap-2 text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                          title="Matricular nesta turma"
                        >
                          <Plus className="w-4 h-4" />
                          Matricular
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableClasses.length === 0 && enrolledClasses.length > 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Este aluno está matriculado em todas as turmas disponíveis</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé fixo */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}