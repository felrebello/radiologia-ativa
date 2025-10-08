/**
 * Componente de cabeçalho do sistema
 * Mostra informações do usuário e opção de logout
 */

import React from 'react';
import { LogOut, User, Settings, Wifi, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export function Header() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { isLoading: dataLoading } = useData();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  if (!user) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh - recarregar a página
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const systemStatus = authLoading || dataLoading ? 'loading' : 'online';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img 
                src="/LOGO RADIOATIVA.png" 
                alt="Radiologia Ativa" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <User className="w-8 h-8 text-blue-600 hidden" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Radiologia Ativa</h1>
              <p className="text-sm text-gray-500">
                {user.role === 'admin' ? 'Área Administrativa' : 'Portal do Aluno'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status do Sistema */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  systemStatus === 'online' ? 'bg-green-500' : 
                  systemStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {systemStatus === 'online' ? 'Online' : 
                   systemStatus === 'loading' ? 'Carregando...' : 'Offline'}
                </span>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Atualizar sistema"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="font-medium">{user.name}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}