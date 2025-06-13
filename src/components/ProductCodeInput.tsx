
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '../store/useStore';
import { Barcode, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductCodeInputProps {
  onProductAdd: (product: any, quantity?: number) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const ProductCodeInput = ({ onProductAdd, isVisible, onToggle }: ProductCodeInputProps) => {
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { products } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const product = products.find(p => p.code === code || p.id === code);
    if (product && product.available) {
      onProductAdd(product, quantity);
      setCode('');
      setQuantity(1);
      toast.success(`${product.name} adicionado!`);
    } else {
      toast.error('Produto não encontrado ou indisponível');
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12"
        size="icon"
      >
        <Barcode className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Barcode className="w-4 h-4" />
            Código do Produto
          </h3>
          <Button onClick={onToggle} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite o código..."
            className="text-center text-lg"
          />
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-20"
            />
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              Adicionar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductCodeInput;
