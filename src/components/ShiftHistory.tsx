
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStore } from '../store/useStore';
import { Clock, DollarSign, ShoppingBag, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ShiftHistory = () => {
  const { shifts, currentShift } = useStore();

  // Combine all shifts (current active + historical)
  const allShifts = [...shifts];
  if (currentShift && !shifts.find(s => s.id === currentShift.id)) {
    allShifts.unshift(currentShift);
  }

  // Sort shifts by start time (newest first)
  const sortedShifts = allShifts.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const formatDateTime = (date: Date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const formatDuration = (start: Date, end?: Date) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? 'Ativo' : 'Fechado'}
      </span>
    );
  };

  const totalAllShifts = sortedShifts.reduce((sum, shift) => sum + shift.totalSales, 0);
  const totalItemsAllShifts = sortedShifts.reduce((sum, shift) => sum + shift.totalItems, 0);
  const activeShifts = sortedShifts.filter(shift => shift.isActive).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Turnos</h1>
          <p className="text-muted-foreground">Visualize todos os turnos abertos e fechados</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sortedShifts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Ativos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShifts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalAllShifts.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsAllShifts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Turnos</CardTitle>
          <CardDescription>
            Lista completa de turnos com informações detalhadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedShifts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{getStatusBadge(shift.isActive)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {shift.userName}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(shift.startTime)}</TableCell>
                    <TableCell>
                      {shift.endTime ? formatDateTime(shift.endTime) : '-'}
                    </TableCell>
                    <TableCell>{formatDuration(shift.startTime, shift.endTime)}</TableCell>
                    <TableCell>{shift.isActive ? '-' : shift.totalSales || 0}</TableCell>
                    <TableCell>{shift.isActive ? '-' : shift.totalItems || 0}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        R$ {shift.isActive ? '0.00' : (shift.totalSales || 0).toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum turno encontrado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Breakdown for All Shifts */}
      {sortedShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral - Formas de Pagamento</CardTitle>
            <CardDescription>
              Breakdown consolidado de todos os turnos fechados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries({
                dinheiro: 'Dinheiro',
                debito: 'Débito', 
                credito: 'Crédito',
                pix: 'PIX',
                cortesia: 'Cortesia'
              }).map(([key, label]) => {
                const total = sortedShifts
                  .filter(shift => !shift.isActive)
                  .reduce((sum, shift) => sum + (shift.paymentBreakdown?.[key as keyof typeof shift.paymentBreakdown] || 0), 0);
                
                return (
                  <div key={key} className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold">R$ {total.toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShiftHistory;
