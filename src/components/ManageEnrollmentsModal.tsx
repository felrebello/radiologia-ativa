/**
 * Modal para gerenciar matrículas de uma turma
 * Interface para visualizar e remover alunos matriculados
 */

import React, { useState } from 'react';
import { X, Users, Trash2, UserMinus, Mail, User } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Class } from '../types';

interface ManageEnrollmentsModalProps {
  classItem: Class;
  onClose: () => void;
}

export function ManageEnrollmentsModal({ classItem, onClose }: ManageEnrollmentsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { enrollments, unenrollStudent } = useData();
  const { users } = useAuth();

  // Alunos matriculados nesta turma
  const classEnrollments = enrollments.filter(e => e.classId === classItem.id);
  const enrolledStudents = classEnrollments.map(enrollment => {
    const student = users.find(u => u.id === enrollment.studentId);
    return {
      ...enrollment,
      student
    };
  }).filter(item => item.student);

  const handleUnenroll = async (studentId: string) => {
    if (!confirm('Tem certeza que deseja remover este aluno da turma? Todas as presenças serão mantidas.')) {
      return;
    }

    setIsLoading(true);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    unenrollStudent(studentId, classItem.id);
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Alunos Matriculados</h2>
              <p className="text-sm text-gray-600">{classItem.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {enrolledStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum aluno matriculado</h3>
              <p className="text-gray-600">Use o botão "Matricular Aluno" para adicionar alunos a esta turma</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {enrolledStudents.length} aluno{enrolledStudents.length !== 1 ? 's' : ''} matriculado{enrolledStudents.length !== 1 ? 's' : ''}
                </h3>
              </div>

              {enrolledStudents.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.student?.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {item.student?.email}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Matriculado em {item.enrolledAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleUnenroll(item.studentId)}
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

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}