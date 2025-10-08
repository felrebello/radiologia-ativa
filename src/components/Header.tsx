/**
 * Componente de cabeçalho do sistema
 * Mostra informações do usuário e opção de logout
 */

import React, { useState } from 'react';
import { LogOut, User, Edit, X, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onEditProfile: () => void;
}

export function Header({ onEditProfile }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const handleMenuClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <img 
              src="/LOGO RADIOATIVA.png" 
              alt="Radiologia Ativa" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Radiologia Ativa</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {user.role === 'admin' ? 'Área Administrativa' : 'Portal do Aluno'}
              </p>
            </div>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onEditProfile}
              className="flex items-center gap-2 text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Editar Perfil"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="font-medium">{user.name}</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
          
          {/* Botão de Menu Mobile */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown do Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
             <button
              onClick={() => handleMenuClick(onEditProfile)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-5 h-5" />
              Editar Perfil
            </button>
            <button
              onClick={() => handleMenuClick(logout)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}