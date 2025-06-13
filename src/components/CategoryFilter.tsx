
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCategory } from '../types';

interface CategoryFilterProps {
  selectedCategory: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const categories: (ProductCategory | 'all')[] = ['all', 'hamburguer', 'bebida', 'acompanhamento', 'sobremesa', 'outro'];
  
  const categoryLabels = {
    all: 'Todos',
    hamburguer: 'Hambúrgueres',
    bebida: 'Bebidas',
    acompanhamento: 'Acompanhamentos',
    sobremesa: 'Sobremesas',
    outro: 'Outros'
  };

  return (
    <div className="mb-4">
      <Label>Categoria</Label>
      <Select value={selectedCategory} onValueChange={(value) => onCategoryChange(value as ProductCategory | 'all')}>
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
  );
};

export default CategoryFilter;
