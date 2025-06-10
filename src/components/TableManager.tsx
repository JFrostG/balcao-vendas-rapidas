
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '../store/useStore';
import { Table, TableStatus } from '../types';
import TableOrderDialog from './TableOrderDialog';
import TableBillDialog from './TableBillDialog';
import { toast } from 'sonner';

const TableManager = () => {
  const { tables, updateTableStatus, clearTable } = useStore();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);

  const getTableColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600';
      case 'requesting-bill':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Livre';
      case 'occupied':
        return 'Ocupada';
      case 'requesting-bill':
        return 'Conta';
      default:
        return 'Indisponível';
    }
  };

  const handleTableClick = (tableNumber: number, status: TableStatus) => {
    setSelectedTable(tableNumber);
    
    if (status === 'available' || status === 'occupied') {
      setShowOrderDialog(true);
    } else if (status === 'requesting-bill') {
      setShowBillDialog(true);
    }
  };

  const handleRequestBill = (tableNumber: number) => {
    updateTableStatus(tableNumber, 'requesting-bill');
    toast.success(`Conta solicitada para Mesa ${tableNumber}`);
    setShowOrderDialog(false);
  };

  const handlePayment = (tableNumber: number) => {
    clearTable(tableNumber);
    toast.success(`Pagamento realizado - Mesa ${tableNumber} liberada`);
    setShowBillDialog(false);
    setSelectedTable(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Mesas</h1>
      
      <div className="grid grid-cols-5 gap-4 max-w-4xl mx-auto">
        {tables.map((table) => (
          <Card 
            key={table.id}
            className={`cursor-pointer transition-all duration-200 ${getTableColor(table.status)}`}
            onClick={() => handleTableClick(table.id, table.status)}
          >
            <CardContent className="p-6 text-center">
              <div className="text-white font-bold text-lg">
                Mesa {table.id}
              </div>
              <div className="text-white text-sm mt-2">
                {getStatusText(table.status)}
              </div>
              {table.status === 'occupied' && (
                <div className="text-white text-xs mt-1">
                  R$ {table.total.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Conta Solicitada</span>
        </div>
      </div>

      {showOrderDialog && selectedTable && (
        <TableOrderDialog
          tableNumber={selectedTable}
          onClose={() => {
            setShowOrderDialog(false);
            setSelectedTable(null);
          }}
          onRequestBill={handleRequestBill}
        />
      )}

      {showBillDialog && selectedTable && (
        <TableBillDialog
          tableNumber={selectedTable}
          onClose={() => {
            setShowBillDialog(false);
            setSelectedTable(null);
          }}
          onPayment={handlePayment}
        />
      )}
    </div>
  );
};

export default TableManager;
