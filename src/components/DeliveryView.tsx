import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStore } from '../store/useStore';
import { Truck, Trash, Printer, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import DeliveryStatusButtons from './DeliveryStatusButtons';

interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  total: number;
  status: 'pending' | 'preparing' | 'out-for-delivery' | 'delivered';
  createdAt: Date;
  deliveryFee: number;
}

const DeliveryView = () => {
  const { products, currentShift } = useStore();
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      complement: ''
    },
    deliveryFee: 5.00
  });
  const [orderItems, setOrderItems] = useState<Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>>([]);

  const availableProducts = products.filter(p => p.available);

  const addItemToOrder = (productId: string) => {
    if (!currentShift?.isActive) {
      toast.error('É necessário abrir um turno para criar pedidos');
      return;
    }
    
    const existingItem = orderItems.find(item => item.productId === productId);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, { productId, quantity: 1 }]);
    }
  };

  const removeItemFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(productId);
      return;
    }
    setOrderItems(orderItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const getOrderTotal = () => {
    const itemsTotal = orderItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
    return itemsTotal + newOrder.deliveryFee;
  };

  const createDeliveryOrder = () => {
    if (!newOrder.customerName || !newOrder.customerPhone || !newOrder.address.street || !newOrder.address.number || !newOrder.address.neighborhood || orderItems.length === 0) {
      toast.error('Preencha todos os campos e adicione pelo menos um item');
      return;
    }

    const order: DeliveryOrder = {
      id: Date.now().toString(),
      ...newOrder,
      items: orderItems.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: product.price
        };
      }),
      total: getOrderTotal(),
      status: 'pending',
      createdAt: new Date()
    };

    setDeliveryOrders([...deliveryOrders, order]);
    setNewOrder({ 
      customerName: '', 
      customerPhone: '', 
      address: {
        street: '',
        number: '',
        neighborhood: '',
        complement: ''
      }, 
      deliveryFee: 5.00 
    });
    setOrderItems([]);
    setShowNewOrder(false);
    toast.success('Pedido de entrega criado com sucesso!');
  };

  const updateOrderStatus = (orderId: string, status: DeliveryOrder['status']) => {
    setDeliveryOrders(deliveryOrders.map(order =>
      order.id === orderId ? { ...order, status } : order
    ));
    toast.success('Status do pedido atualizado!');
  };

  const printDeliveryOrder = (order: DeliveryOrder) => {
    console.log('Imprimir pedido:', order);
    toast.success('Enviando para impressão...');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-8 h-8" />
          Sistema de Entregas
        </h1>
        <Button 
          onClick={() => setShowNewOrder(true)}
          disabled={!currentShift?.isActive}
          className="bg-green-600 hover:bg-green-700"
        >
          Novo Pedido
        </Button>
      </div>

      {!currentShift?.isActive && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-center text-muted-foreground">
              É necessário abrir um turno para gerenciar entregas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {deliveryOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">#{order.id.slice(-6)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => printDeliveryOrder(order)}
                    variant="outline"
                    size="sm"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {order.createdAt.toLocaleString('pt-BR')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div>
                  <strong>Cliente:</strong> {order.customerName}
                </div>
                <div>
                  <strong>Telefone:</strong> {order.customerPhone}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-4 h-4" />
                    <strong>Endereço:</strong>
                  </div>
                  <div className="text-sm">
                    <div>{order.address.street}, {order.address.number}</div>
                    <div>Bairro: {order.address.neighborhood}</div>
                    {order.address.complement && (
                      <div>Complemento: {order.address.complement}</div>
                    )}
                  </div>
                </div>
                <div>
                  <strong>Total:</strong> R$ {order.total.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-1 mb-4">
                <strong>Itens:</strong>
                {order.items.map((item, index) => (
                  <div key={index} className="text-sm">
                    <div>{item.quantity}x {item.productName}</div>
                    {item.notes && (
                      <div className="text-xs text-muted-foreground ml-2">
                        Obs: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <DeliveryStatusButtons
                currentStatus={order.status}
                onStatusChange={(status) => updateOrderStatus(order.id, status)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulário de novo pedido */}
      {showNewOrder && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Novo Pedido de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente</Label>
                <Input
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newOrder.customerPhone}
                  onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rua</Label>
                <Input
                  value={newOrder.address.street}
                  onChange={(e) => setNewOrder({ 
                    ...newOrder, 
                    address: { ...newOrder.address, street: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={newOrder.address.number}
                  onChange={(e) => setNewOrder({ 
                    ...newOrder, 
                    address: { ...newOrder.address, number: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bairro</Label>
                <Input
                  value={newOrder.address.neighborhood}
                  onChange={(e) => setNewOrder({ 
                    ...newOrder, 
                    address: { ...newOrder.address, neighborhood: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input
                  value={newOrder.address.complement}
                  onChange={(e) => setNewOrder({ 
                    ...newOrder, 
                    address: { ...newOrder.address, complement: e.target.value }
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Taxa de Entrega</Label>
              <Input
                type="number"
                step="0.01"
                value={newOrder.deliveryFee}
                onChange={(e) => setNewOrder({ ...newOrder, deliveryFee: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>Produtos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {availableProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    onClick={() => addItemToOrder(product.id)}
                    className="h-auto p-2"
                  >
                    <div className="text-center">
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs">R$ {product.price.toFixed(2)}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {orderItems.length > 0 && (
              <div>
                <Label>Itens do Pedido</Label>
                <div className="space-y-2 mt-2">
                  {orderItems.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    return product ? (
                      <div key={item.productId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{product.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItemFromOrder(item.productId)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="text-lg font-bold mt-2">
                  Total: R$ {getOrderTotal().toFixed(2)}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={createDeliveryOrder} className="bg-green-600 hover:bg-green-700">
                Criar Pedido
              </Button>
              <Button variant="outline" onClick={() => setShowNewOrder(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeliveryView;
