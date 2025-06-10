
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Clock, TrendingUp, Download } from 'lucide-react';

const Reports = () => {
  const { sales, shifts, getPaymentBreakdown } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Filter sales based on period
  const getFilteredSales = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      switch (selectedPeriod) {
        case 'today':
          return saleDate >= startOfToday;
        case 'week':
          return saleDate >= startOfWeek;
        case 'month':
          return saleDate >= startOfMonth;
        default:
          return true;
      }
    });
  };

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filteredSales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const paymentBreakdown = getPaymentBreakdown(filteredSales);

  // Chart data
  const paymentChartData = Object.entries(paymentBreakdown).map(([method, value]) => ({
    name: {
      dinheiro: 'Dinheiro',
      debito: 'Débito',
      credito: 'Crédito',
      pix: 'PIX',
      cortesia: 'Cortesia'
    }[method] || method,
    value: value,
    fill: {
      dinheiro: '#10B981',
      debito: '#3B82F6',
      credito: '#8B5CF6',
      pix: '#F59E0B',
      cortesia: '#EF4444'
    }[method] || '#6B7280'
  })).filter(item => item.value > 0);

  // Sales by hour
  const salesByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourSales = filteredSales.filter(sale => {
      const saleHour = new Date(sale.createdAt).getHours();
      return saleHour === hour;
    });
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      sales: hourSales.length,
      revenue: hourSales.reduce((sum, sale) => sum + sale.total, 0)
    };
  }).filter(item => item.sales > 0);

  // Product sales ranking
  const productSales = {};
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = { quantity: 0, revenue: 0 };
      }
      productSales[item.productName].quantity += item.quantity;
      productSales[item.productName].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([name, data]: [string, any]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const closedShifts = shifts.filter(shift => !shift.isActive);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise de vendas e performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="all">Todos os períodos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              unidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              por venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Fechados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedShifts.length}</div>
            <p className="text-xs text-muted-foreground">
              turnos concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Horário</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'sales' ? `${value} vendas` : `R$ ${value.toFixed(2)}`,
                    name === 'sales' ? 'Vendas' : 'Receita'
                  ]}
                />
                <Bar dataKey="sales" fill="#FF6B35" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.quantity} unidades</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {product.revenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">receita</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shift History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {closedShifts.slice(0, 10).map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{shift.userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(shift.startTime).toLocaleDateString('pt-BR')} - 
                    {shift.endTime && ` ${new Date(shift.endTime).toLocaleTimeString('pt-BR')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {shift.totalSales.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{shift.totalItems} itens</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
