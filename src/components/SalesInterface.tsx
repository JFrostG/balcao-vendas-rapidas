
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { PaymentMethod, ProductCategory } from '../types';
import { toast } from 'sonner';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';
import CartSidebar from './CartSidebar';
import ProductCodeInput from './ProductCodeInput';
import ShiftWarning from './ShiftWarning';

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
  const [showProductCode, setShowProductCode] = useState(false);

  // Se não houver turno ativo, mostrar aviso
  if (!currentShift?.isActive) {
    return <ShiftWarning />;
  }

  const handleAddToCart = (product: any, quantity = 1) => {
    if (!currentShift?.isActive) {
      toast.error('É necessário abrir um turno para adicionar produtos');
      return;
    }
    addToCart(product, quantity);
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (cart.length > 0) {
      handleCompleteSale();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && cart.length > 0) {
      handleCompleteSale();
    }
    
    // Atalhos numéricos para formas de pagamento
    const keyMap: {[key: string]: PaymentMethod} = {
      '1': 'dinheiro',
      '2': 'debito', 
      '3': 'credito',
      '4': 'pix',
      '5': 'cortesia'
    };
    
    if (keyMap[e.key]) {
      handlePaymentSelect(keyMap[e.key]);
    }
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

  return (
    <div className="h-full flex" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Products Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        <ProductGrid 
          products={products}
          selectedCategory={selectedCategory}
          onProductSelect={handleAddToCart}
        />
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        cart={cart}
        discount={discount}
        discountType={discountType}
        cartTotal={cartTotal}
        onQuantityUpdate={updateCartQuantity}
        onItemRemove={removeFromCart}
        onCartClear={clearCart}
        onDiscountChange={setDiscount}
        onDiscountTypeChange={setDiscountType}
        onPaymentSelect={handlePaymentSelect}
        onCompleteSale={handleCompleteSale}
        onKeyDown={handleKeyDown}
      />

      <ProductCodeInput 
        onProductAdd={handleAddToCart}
        isVisible={showProductCode}
        onToggle={() => setShowProductCode(!showProductCode)}
      />
    </div>
  );
};

export default SalesInterface;
