
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '../store/useStore';
import { Product } from '../types';
import { toast } from 'sonner';
import { Scan } from 'lucide-react';

interface ProductCodeInputProps {
  onProductAdd: (product: Product, quantity?: number) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const ProductCodeInput = ({ onProductAdd, isVisible, onToggle }: ProductCodeInputProps) => {
  const { products } = useStore();
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error('Digite o código do produto');
      return;
    }

    const product = products.find(p => p.code === code.trim());
    
    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }

    if (!product.available) {
      toast.error('Produto indisponível');
      return;
    }

    onProductAdd(product, quantity);
    setCode('');
    setQuantity(1);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 z-50"
        size="sm"
      >
        <Scan className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg p-4 z-50 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Código do Produto</h3>
        <Button onClick={onToggle} variant="ghost" size="sm">
          ×
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código..."
          autoFocus
        />
        
        <div className="flex gap-2">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="w-20"
          />
          <Button type="submit" className="flex-1">
            Adicionar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductCodeInput;
