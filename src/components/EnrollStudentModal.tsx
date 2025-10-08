/**
 * Modal para matricular alunos em turmas
 * Interface para administradores gerenciarem matrículas
 */

import React, { useState } from 'react';
import { X, UserPlus, Save, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface EnrollStudentModalProps {
  onClose: () => void;
  classId?: string | null;
}

export function EnrollStudentModal({ onClose, classId }: EnrollStudentModalProps) {
  const [selectedClassId, setSelectedClassId] = useState(classId || '');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { classes, enrollments, enrollStudent } = useData();
  const { users } = useAuth();

  // Filtrar apenas alunos
  const students = users.filter(u => u.role === 'student');
  
  // Alunos já matriculados na turma selecionada
  const enrolledStudentIds = selectedClassId 
    ? enrollments.filter(e => e.classId === selectedClassId).map(e => e.studentId)
    : [];
  
  // Alunos disponíveis para matrícula
  const availableStudents = students.filter(s => !enrolledStudentIds.includes(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassId || !selectedStudentId) return;

    setIsLoading(true);
    
    // Simular delay de matrícula
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    enrollStudent(selectedStudentId, selectedClassId);

    setIsLoading(false);
    onClose();
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-lg p-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Matricular Aluno</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
              Turma *
            </label>
            <select
              id="class"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudentId(''); // Reset student selection when class changes
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">Selecione uma turma</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClassId && (
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
                Aluno *
              </label>
              <select
                id="student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                required
              >
                <option value="">Selecione um aluno</option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              
              {availableStudents.length === 0 && selectedClassId && (
                <p className="text-sm text-gray-500 mt-2">
                  Todos os alunos já estão matriculados nesta turma
                </p>
              )}
            </div>
          )}

          {selectedClass && selectedStudent && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Resumo da Matrícula</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Turma:</strong> {selectedClass.name}</p>
                <p><strong>Aluno:</strong> {selectedStudent.name}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
              </div>
            </div>
          )}

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
              disabled={isLoading || !selectedClassId || !selectedStudentId}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Matricular
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}