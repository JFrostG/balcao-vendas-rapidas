import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStore } from '../store/useStore';
import { PaymentMethod, ProductCategory } from '../types';
import { Plus, Minus, Trash2, ShoppingCart, AlertTriangle } from 'lucide-react';
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
    getCartTotal,
    currentShift,
    currentUser
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');

  // Se não houver turno ativo, mostrar aviso
  if (!currentShift?.isActive) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500" />
            <CardTitle>Turno Necessário</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              É necessário abrir um turno para realizar vendas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProducts = products.filter(product => 
    product.available && (selectedCategory === 'all' || product.category === selectedCategory)
  );

  const categories: (ProductCategory | 'all')[] = ['all', 'hamburguer', 'bebida', 'acompanhamento', 'sobremesa', 'outro'];
  const categoryLabels = {
    all: 'Todos',
    hamburguer: 'Hambúrgueres',
    bebida: 'Bebidas',
    acompanhamento: 'Acompanhamentos',
    sobremesa: 'Sobremesas',
    outro: 'Outros'
  };

  const handleAddToCart = (product: any) => {
    if (!currentShift?.isActive) {
      toast.error('É necessário abrir um turno para adicionar produtos');
      return;
    }
    addToCart(product);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (!currentShift?.isActive) {
      toast.error('É necessário abrir um turno para realizar vendas');
      return;
    }

    completeSale(paymentMethod, discount, discountType);
    setDiscount(0);
    setPaymentMethod('dinheiro');
    toast.success('Venda realizada com sucesso!');
  };

  const cartTotal = getCartTotal();
  const discountAmount = discountType === 'percentage' ? (cartTotal * discount) / 100 : discount;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  return (
    <div className="h-full flex">
      {/* Products Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4">
          <Label>Categoria</Label>
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ProductCategory | 'all')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {categoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4" onClick={() => handleAddToCart(product)}>
                <h3 className="font-semibold text-sm mb-2">{product.name}</h3>
                <p className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</p>
                <Badge variant="secondary" className="text-xs mt-2">
                  {categoryLabels[product.category]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border-l p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho
          </h2>
          <Button onClick={clearCart} variant="ghost" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Carrinho vazio
            </p>
          ) : (
            cart.map(item => (
              <Card key={item.productId}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{item.productName}</h4>
                    <Button 
                      onClick={() => removeFromCart(item.productId)}
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        variant="outline" 
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <Button 
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        variant="outline" 
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold">R$ {item.subtotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Payment Section */}
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="debito">Cartão Débito</SelectItem>
                <SelectItem value="credito">Cartão Crédito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cortesia">Cortesia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Desconto</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'value' | 'percentage')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">R$</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto:</span>
                <span>- R$ {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            onClick={handleCompleteSale} 
            className="w-full" 
            size="lg"
            disabled={cart.length === 0}
          >
            Finalizar Venda
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalesInterface;
