
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '../store/useStore';
import { Table, TableStatus } from '../types';
import TableOrderDialog from './TableOrderDialog';
import TableBillDialog from './TableBillDialog';
import { toast } from 'sonner';

const TableManager = () => {
  const { tables, updateTableStatus, clearTable, currentShift } = useStore();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);

  const getTableColor = (status: TableStatus, hasOrders: boolean) => {
    if (status === 'requesting-bill') {
      return 'bg-yellow-500 hover:bg-yellow-600';
    }
    if (hasOrders || status === 'occupied') {
      return 'bg-red-500 hover:bg-red-600';
    }
    return 'bg-green-500 hover:bg-green-600';
  };

  const getStatusText = (status: TableStatus, hasOrders: boolean) => {
    if (status === 'requesting-bill') return 'Conta Solicitada';
    if (hasOrders || status === 'occupied') return 'Ocupada';
    return 'Livre';
  };

  const handleTableClick = (tableNumber: number, status: TableStatus) => {
    if (!currentShift?.isActive) {
      toast.error('É necessário abrir um turno para usar as mesas');
      return;
    }
    
    setSelectedTable(tableNumber);
    
    if (status === 'requesting-bill') {
      setShowBillDialog(true);
    } else {
      setShowOrderDialog(true);
    }
  };

  const handleRequestBill = (tableNumber: number) => {
    updateTableStatus(tableNumber, 'requesting-bill');
    toast.success(`Conta solicitada para ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`}`);
    setShowOrderDialog(false);
  };

  const handlePayment = (tableNumber: number) => {
    clearTable(tableNumber);
    toast.success(`Pagamento realizado - ${tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`} liberada`);
    setShowBillDialog(false);
    setSelectedTable(null);
  };

  // Separar balcão das outras mesas
  const balcao = tables.find(t => t.id === 0);
  const regularTables = tables.filter(t => t.id !== 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Mesas</h1>
      
      {/* Balcão */}
      {balcao && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Balcão - Vendas Rápidas</h2>
          <div className="flex justify-center">
            <Card 
              className={`cursor-pointer transition-all duration-200 ${getTableColor(balcao.status, balcao.orders.length > 0)} w-48`}
              onClick={() => handleTableClick(balcao.id, balcao.status)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-white font-bold text-lg">
                  Balcão
                </div>
                <div className="text-white text-sm mt-2">
                  {getStatusText(balcao.status, balcao.orders.length > 0)}
                </div>
                {(balcao.orders.length > 0 || balcao.total > 0) && (
                  <div className="text-white text-xs mt-1 font-semibold">
                    R$ {balcao.total.toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Mesas regulares */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Mesas</h2>
        <div className="grid grid-cols-5 gap-4 max-w-4xl mx-auto">
          {regularTables.map((table) => (
            <Card 
              key={table.id}
              className={`cursor-pointer transition-all duration-200 ${getTableColor(table.status, table.orders.length > 0)}`}
              onClick={() => handleTableClick(table.id, table.status)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-white font-bold text-lg">
                  Mesa {table.id}
                </div>
                <div className="text-white text-sm mt-2">
                  {getStatusText(table.status, table.orders.length > 0)}
                </div>
                {(table.orders.length > 0 || table.total > 0) && (
                  <div className="text-white text-xs mt-1 font-semibold">
                    R$ {table.total.toFixed(2)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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

      {showOrderDialog && selectedTable !== null && (
        <TableOrderDialog
          tableNumber={selectedTable}
          onClose={() => {
            setShowOrderDialog(false);
            setSelectedTable(null);
          }}
          onRequestBill={handleRequestBill}
        />
      )}

      {showBillDialog && selectedTable !== null && (
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
