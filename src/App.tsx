/**
 * Componente principal da aplicação
 * Gerencia roteamento entre login e dashboards
 */

import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Header } from './components/Header';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { EditProfileModal } from './components/EditProfileModal';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);
  const [showEditProfile, setShowEditProfile] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
    }
    return <LoginForm onShowRegister={() => setShowRegister(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onEditProfile={() => setShowEditProfile(true)} />
      <main>
        {user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />}
      </main>

      {showEditProfile && user && (
        <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;