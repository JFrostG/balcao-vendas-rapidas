
import { useState, useEffect } from 'react';
import { useSalesStore } from '../store/salesStore';
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
    currentShift,
    currentUser
  } = useStore();

  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    completeSale,
    getCartTotal
  } = useSalesStore();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
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
    console.log('Produto adicionado ao carrinho:', product, 'Quantidade:', quantity);
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (cart.length > 0) {
      handleCompleteSale(method);
    }
  };

  const handleCompleteSale = (selectedPaymentMethod?: PaymentMethod) => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (!currentShift?.isActive) {
      toast.error('É necessário abrir um turno para realizar vendas');
      return;
    }

    const finalPaymentMethod = selectedPaymentMethod || paymentMethod;
    
    // Chamar completeSale diretamente do salesStore
    completeSale(finalPaymentMethod, 0, 'value', 0); // Balcão
    
    setPaymentMethod('dinheiro');
    toast.success('Venda realizada com sucesso!');
    console.log('Venda do balcão finalizada:', {
      paymentMethod: finalPaymentMethod,
      total: getCartTotal(),
      items: cart.length
    });
  };

  // Suporte a teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') {
        return; // Não processar se estiver digitando em um input
      }
      
      if (e.key === 'Enter' && cart.length > 0) {
        e.preventDefault();
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
        e.preventDefault();
        handlePaymentSelect(keyMap[e.key]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, paymentMethod]);

  const cartTotal = getCartTotal();

  return (
    <div className="h-full flex">
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
        discount={0}
        discountType="value"
        cartTotal={cartTotal}
        onQuantityUpdate={updateCartQuantity}
        onItemRemove={removeFromCart}
        onCartClear={clearCart}
        onDiscountChange={() => {}} // Não usado mais
        onDiscountTypeChange={() => {}} // Não usado mais
        onPaymentSelect={handlePaymentSelect}
        onCompleteSale={() => handleCompleteSale()}
        onKeyDown={() => {}} // Tratado globalmente agora
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
