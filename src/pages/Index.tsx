
import { useState } from 'react';
import { useStore } from '../store/useStore';
import Login from '../components/Login';
import ShiftManager from '../components/ShiftManager';
import Navigation from '../components/Navigation';
import TableManager from '../components/TableManager';
import ProductManager from '../components/ProductManager';
import Reports from '../components/Reports';
import ShiftHistory from '../components/ShiftHistory';

const Index = () => {
  const { currentUser, currentShift } = useStore();
  const [currentView, setCurrentView] = useState('sales');

  if (!currentUser) {
    return <Login />;
  }

  // Admin pode acessar sem turno ativo, cashier precisa de turno
  if (!currentShift?.isActive && currentUser.role !== 'admin') {
    return <ShiftManager />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'sales':
        return <TableManager />;
      case 'products':
        return <ProductManager />;
      case 'reports':
        return <Reports />;
      case 'shift-history':
        return <ShiftHistory />;
      case 'shift':
        return <ShiftManager />;
      default:
        return <TableManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      <main className="h-[calc(100vh-64px)]">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default Index;
