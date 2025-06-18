
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem, PaymentMethod } from '../types';
import QuickPaymentButtons from './QuickPaymentButtons';

interface CartSidebarProps {
  cart: CartItem[];
  discount: number;
  discountType: 'value' | 'percentage';
  cartTotal: number;
  onQuantityUpdate: (productId: string, quantity: number) => void;
  onItemRemove: (productId: string) => void;
  onCartClear: () => void;
  onDiscountChange: (discount: number) => void;
  onDiscountTypeChange: (type: 'value' | 'percentage') => void;
  onPaymentSelect: (method: PaymentMethod) => void;
  onCompleteSale: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const CartSidebar = ({
  cart,
  cartTotal,
  onQuantityUpdate,
  onItemRemove,
  onCartClear,
  onPaymentSelect,
  onCompleteSale,
  onKeyDown
}: CartSidebarProps) => {
  return (
    <div className="w-96 bg-white border-l p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Carrinho
        </h2>
        <Button onClick={onCartClear} variant="ghost" size="sm">
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
                    onClick={() => onItemRemove(item.productId)}
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
                      onClick={() => onQuantityUpdate(item.productId, item.quantity - 1)}
                      variant="outline" 
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <Button 
                      onClick={() => onQuantityUpdate(item.productId, item.quantity + 1)}
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

      <div className="space-y-4 border-t pt-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Pagamento Rápido</h3>
          <QuickPaymentButtons 
            onPaymentSelect={onPaymentSelect}
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>R$ {cartTotal.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          onClick={onCompleteSale} 
          className="w-full" 
          size="lg"
          disabled={cart.length === 0}
        >
          Finalizar Venda [Enter]
        </Button>
      </div>
    </div>
  );
};

export default CartSidebar;
