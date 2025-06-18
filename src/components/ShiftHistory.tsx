import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStore } from '../store/useStore';
import { Clock, DollarSign, ShoppingBag, User, Calendar, BarChart3, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shift } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ShiftHistory = () => {
  const { shifts, currentShift, sales } = useStore();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

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

  const getShiftSales = (shift: Shift) => {
    return sales.filter(sale => sale.shiftId === shift.id);
  };

  const getShiftPaymentBreakdown = (shiftSales: any[]) => {
    return shiftSales.reduce((breakdown, sale) => {
      breakdown[sale.paymentMethod] += sale.total;
      return breakdown;
    }, {
      dinheiro: 0,
      debito: 0,
      credito: 0,
      pix: 0,
      cortesia: 0,
    });
  };

  const openShiftReport = (shift: Shift) => {
    setSelectedShift(shift);
    setIsReportDialogOpen(true);
  };

  const ShiftReportDialog = () => {
    if (!selectedShift) return null;

    const shiftSales = getShiftSales(selectedShift);
    const shiftTotal = shiftSales.reduce((sum, sale) => sum + sale.total, 0);
    const shiftItems = shiftSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const paymentBreakdown = getShiftPaymentBreakdown(shiftSales);

    // Top products data
    const productSales = shiftSales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        if (acc[item.productName]) {
          acc[item.productName].quantity += item.quantity;
          acc[item.productName].revenue += item.price * item.quantity;
        } else {
          acc[item.productName] = {
            name: item.productName,
            quantity: item.quantity,
            revenue: item.price * item.quantity
          };
        }
      });
      return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Payment method data for charts
    const paymentData = Object.entries(paymentBreakdown).map(([method, amount]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: Number(amount),
    })).filter(item => item.value > 0);

    const CHART_COLORS = ['#FF6B35', '#F7931E', '#FFD700', '#32CD32', '#1E90FF'];

    return (
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório do Turno - {selectedShift.userName}</DialogTitle>
            <DialogDescription>
              {formatDateTime(selectedShift.startTime)} 
              {selectedShift.endTime && ` - ${formatDateTime(selectedShift.endTime)}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {shiftTotal.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{shiftItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{shiftSales.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {shiftSales.length > 0 ? (shiftTotal / shiftSales.length).toFixed(2) : '0.00'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Formas de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={paymentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: R$ ${Number(value).toFixed(2)}`}
                        >
                          {paymentData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Nenhuma venda encontrada
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [Number(value), 'Quantidade']} />
                        <Bar dataKey="quantity" fill="#FF6B35" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Nenhuma venda encontrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Breakdown por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Dinheiro</p>
                    <p className="text-xl font-semibold">R$ {paymentBreakdown.dinheiro.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Débito</p>
                    <p className="text-xl font-semibold">R$ {paymentBreakdown.debito.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Crédito</p>
                    <p className="text-xl font-semibold">R$ {paymentBreakdown.credito.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">PIX</p>
                    <p className="text-xl font-semibold">R$ {paymentBreakdown.pix.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Cortesia</p>
                    <p className="text-xl font-semibold">R$ {paymentBreakdown.cortesia.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales List */}
            {shiftSales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shiftSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                          <TableCell>
                            {sale.items.map(item => `${item.quantity}x ${item.productName}`).join(', ')}
                          </TableCell>
                          <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                          <TableCell className="font-medium">R$ {sale.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedShifts.map((shift) => {
                  const shiftSales = getShiftSales(shift);
                  const shiftTotal = shiftSales.reduce((sum, sale) => sum + sale.total, 0);
                  const shiftItems = shiftSales.reduce((sum, sale) => 
                    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
                  );
                  
                  return (
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
                      <TableCell>{shiftSales.length}</TableCell>
                      <TableCell>{shiftItems}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          R$ {shiftTotal.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openShiftReport(shift)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Relatório
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
