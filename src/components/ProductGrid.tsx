
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product, ProductCategory } from '../types';

interface ProductGridProps {
  products: Product[];
  selectedCategory: ProductCategory | 'all';
  onProductSelect: (product: Product) => void;
}

const ProductGrid = ({ products, selectedCategory, onProductSelect }: ProductGridProps) => {
  const filteredProducts = products.filter(product => 
    product.available && (selectedCategory === 'all' || product.category === selectedCategory)
  );

  const categoryLabels = {
    all: 'Todos',
    hamburguer: 'Hambúrgueres',
    bebida: 'Bebidas',
    acompanhamento: 'Acompanhamentos',
    sobremesa: 'Sobremesas',
    outro: 'Outros'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredProducts.map(product => (
        <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4" onClick={() => onProductSelect(product)}>
            <h3 className="font-semibold text-sm mb-2">{product.name}</h3>
            {product.code && (
              <p className="text-xs text-muted-foreground mb-1">Código: {product.code}</p>
            )}
            <p className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</p>
            <Badge variant="secondary" className="text-xs mt-2">
              {categoryLabels[product.category]}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
