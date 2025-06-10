
import { useState } from 'react';
import { useStore } from '../store/useStore';
import Login from '../components/Login';
import ShiftManager from '../components/ShiftManager';
import Navigation from '../components/Navigation';
import SalesInterface from '../components/SalesInterface';
import ProductManager from '../components/ProductManager';
import Reports from '../components/Reports';

const Index = () => {
  const { currentUser, currentShift } = useStore();
  const [currentView, setCurrentView] = useState('sales');

  if (!currentUser) {
    return <Login />;
  }

  if (!currentShift?.isActive) {
    return <ShiftManager />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'sales':
        return <SalesInterface />;
      case 'products':
        return <ProductManager />;
      case 'reports':
        return <Reports />;
      case 'shift':
        return <ShiftManager />;
      default:
        return <SalesInterface />;
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
