import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSalesStore } from '../store/salesStore';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Reports = () => {
  const { sales } = useSalesStore();
  const { currentShift } = useStore();
  const [reportType, setReportType] = useState('current-shift');

  // Helper function to get sales for a specific date
  const getSalesForDate = (date: Date) => {
    const start = startOfDay(date);
    const end = endOfDay(date);
    return sales.filter(sale => 
      isWithinInterval(new Date(sale.createdAt), { start, end })
    );
  };

  // Current shift data
  const getCurrentShiftSales = () => {
    if (!currentShift) return [];
    return sales.filter(sale => sale.shiftId === currentShift.id);
  };

  const currentShiftSales = getCurrentShiftSales();
  const currentShiftTotal = currentShiftSales.reduce((sum, sale) => sum + sale.total, 0);
  const currentShiftItems = currentShiftSales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Today's data
  const todaySales = getSalesForDate(new Date());
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayItems = todaySales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Payment breakdown for current report
  const getReportData = () => {
    switch (reportType) {
      case 'current-shift':
        return currentShiftSales;
      case 'today':
        return todaySales;
      case 'all-time':
        return sales;
      default:
        return currentShiftSales;
    }
  };

  const reportSales = getReportData();
  const reportTotal = reportSales.reduce((sum, sale) => sum + sale.total, 0);
  const reportItems = reportSales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  const getPaymentBreakdown = (salesData: any[]) => {
    return salesData.reduce((breakdown, sale) => {
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

  const paymentBreakdown = getPaymentBreakdown(reportSales);

  // Top products data
  const productSales = reportSales.reduce((acc, sale) => {
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
    .sort((a, b) => b.quantity - b.quantity)
    .slice(0, 5);

  // Payment method data for charts
  const paymentData = Object.entries(paymentBreakdown).map(([method, amount]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1),
    value: Number(amount),
    percentage: reportTotal > 0 ? ((Number(amount) / reportTotal) * 100) : 0
  })).filter(item => item.value > 0);

  // Sales by hour data
  const salesByHour = reportSales.reduce((acc, sale) => {
    const hour = new Date(sale.createdAt).getHours();
    const hourKey = `${hour}:00`;
    if (acc[hourKey]) {
      acc[hourKey].total += sale.total;
      acc[hourKey].count += 1;
    } else {
      acc[hourKey] = { hour: hourKey, total: sale.total, count: 1 };
    }
    return acc;
  }, {} as Record<string, { hour: string; total: number; count: number }>);

  const hourlyData = Object.values(salesByHour).sort((a, b) => 
    parseInt(a.hour) - parseInt(b.hour)
  );

  const CHART_COLORS = ['#FF6B35', '#F7931E', '#FFD700', '#32CD32', '#1E90FF'];

  const getReportTitle = () => {
    switch (reportType) {
      case 'current-shift':
        return 'Turno Atual';
      case 'today':
        return 'Hoje';
      case 'all-time':
        return 'Todos os Períodos';
      default:
        return 'Relatório';
    }
  };

  console.log('Reports - Total sales:', sales.length);
  console.log('Reports - Current shift sales:', currentShiftSales.length);
  console.log('Reports - Report sales:', reportSales.length);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise de vendas e desempenho</p>
        </div>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-shift">Turno Atual</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="all-time">Todos os Períodos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {reportTotal.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportSales.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {reportSales.length > 0 ? (reportTotal / reportSales.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento - {getReportTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
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
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma venda encontrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos - {getReportTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [Number(value), 'Quantidade']} />
                  <Bar dataKey="quantity" fill="#FF6B35" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma venda encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Hour */}
      {reportType === 'today' && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Hora - Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Total']} />
                  <Bar dataKey="total" fill="#F7931E" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma venda encontrada
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown por Forma de Pagamento - {getReportTitle()}</CardTitle>
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
    </div>
  );
};

export default Reports;
