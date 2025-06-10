
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useStore } from '../store/useStore';
import { PaymentMethod } from '../types';
import { Plus, Minus, ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const SalesInterface = () => {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    completeSale, 
    getCartTotal 
  } = useStore();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');

  const categories = ['hamburguer', 'bebida', 'acompanhamento', 'sobremesa', 'outro'];
  const availableProducts = products.filter(p => p.available);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hamburguer': return '🍔';
      case 'bebida': return '🥤';
      case 'acompanhamento': return '🍟';
      case 'sobremesa': return '🍰';
      default: return '📦';
    }
  };

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'debito', label: 'Cartão Débito' },
    { value: 'credito', label: 'Cartão Crédito' },
    { value: 'pix', label: 'PIX' },
    { value: 'cortesia', label: 'Cortesia' }
  ];

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = () => {
    const discountValue = parseFloat(discount) || 0;
    if (discountValue < 0) {
      toast.error('Desconto não pode ser negativo');
      return;
    }

    const subtotal = getCartTotal();
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discountValue) / 100 
      : discountValue;

    if (discountAmount > subtotal) {
      toast.error('Desconto não pode ser maior que o total');
      return;
    }

    completeSale(paymentMethod, discountValue, discountType);
    setIsCheckoutOpen(false);
    setDiscount('0');
    setPaymentMethod('dinheiro');
    toast.success('Venda realizada com sucesso!');
  };

  const calculateTotal = () => {
    const subtotal = getCartTotal();
    const discountValue = parseFloat(discount) || 0;
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discountValue) / 100 
      : discountValue;
    return Math.max(0, subtotal - discountAmount);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Products Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Ponto de Venda</h1>
          <p className="text-muted-foreground">Selecione os produtos para adicionar ao carrinho</p>
        </div>

        {categories.map(category => {
          const categoryProducts = availableProducts.filter(p => p.category === category);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(category)}</span>
                <span className="capitalize">{category}</span>
                <Badge variant="secondary">{categoryProducts.length}</Badge>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="hover-lift cursor-pointer transition-all duration-200 hover:shadow-lg"
                    onClick={() => addToCart(product)}
                  >
                    <CardHeader className="pb-2">
                      <div className="text-center">
                        <span className="text-4xl mb-2 block">{getCategoryIcon(product.category)}</span>
                        <CardTitle className="text-sm font-medium leading-tight">
                          {product.name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">
                          R$ {product.price.toFixed(2)}
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full mt-2 gradient-burger hover:opacity-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                            toast.success(`${product.name} adicionado ao carrinho`);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {availableProducts.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto disponível</h3>
              <p className="text-muted-foreground">
                Cadastre produtos ou verifique a disponibilidade
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border-l shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Carrinho</h2>
            <Badge variant="secondary">{getCartItemCount()} itens</Badge>
          </div>
          {cart.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCart}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Carrinho
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carrinho vazio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <Card key={item.productId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{item.productName}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-semibold text-sm">
                        R$ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary">
                R$ {getCartTotal().toFixed(2)}
              </span>
            </div>
            <Button 
              onClick={handleCheckout} 
              className="w-full gradient-burger hover:opacity-90" 
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Finalizar Venda
            </Button>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Desconto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={discountType} onValueChange={(value: 'value' | 'percentage') => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">R$ (Valor)</SelectItem>
                    <SelectItem value="percentage">% (Porcentagem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {getCartTotal().toFixed(2)}</span>
              </div>
              {parseFloat(discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>
                    - R$ {(discountType === 'percentage' 
                      ? (getCartTotal() * parseFloat(discount)) / 100 
                      : parseFloat(discount)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCompleteSale}
                className="flex-1 gradient-burger hover:opacity-90"
              >
                Confirmar Venda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesInterface;
