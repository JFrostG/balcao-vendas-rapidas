
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useStore } from '../store/useStore';
import { Product, ProductCategory } from '../types';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

const ProductManager = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: '',
    category: 'hamburguer' as ProductCategory,
    available: true,
    description: ''
  });

  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'hamburguer', label: 'Hambúrguer' },
    { value: 'bebida', label: 'Bebida' },
    { value: 'acompanhamento', label: 'Acompanhamento' },
    { value: 'sobremesa', label: 'Sobremesa' },
    { value: 'outro', label: 'Outro' }
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      price: '',
      category: 'hamburguer',
      available: true,
      description: ''
    });
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.code) {
      toast.error('Nome, código e preço são obrigatórios');
      return;
    }

    // Verificar se o código já existe (apenas ao adicionar ou se mudou)
    const existingProduct = products.find(p => p.code === formData.code && p.id !== editingProduct?.id);
    if (existingProduct) {
      toast.error('Já existe um produto com este código');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Preço deve ser um valor válido');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        code: formData.code,
        price,
        category: formData.category,
        available: formData.available,
        description: formData.description
      });
      toast.success('Produto atualizado com sucesso!');
    } else {
      addProduct({
        name: formData.name,
        code: formData.code,
        price,
        category: formData.category,
        available: formData.available,
        description: formData.description
      });
      toast.success('Produto adicionado com sucesso!');
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      price: product.price.toString(),
      category: product.category,
      available: product.available,
      description: product.description || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
      toast.success('Produto excluído com sucesso!');
    }
  };

  const toggleAvailability = (id: string, available: boolean) => {
    updateProduct(id, { available });
    toast.success(`Produto ${available ? 'disponibilizado' : 'indisponibilizado'} com sucesso!`);
  };

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'hamburguer': return '🍔';
      case 'bebida': return '🥤';
      case 'acompanhamento': return '🍟';
      case 'sobremesa': return '🍰';
      default: return '📦';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
          <p className="text-muted-foreground">Adicione, edite e gerencie seus produtos</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-burger hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Big Burger"
                  required
                />
              </div>

              <div>
                <Label htmlFor="code">Código do Produto</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: 001"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: ProductCategory) => 
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do produto"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, available: checked }))
                  }
                />
                <Label htmlFor="available">Produto disponível</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Card key={product.id} className={`${!product.available ? 'opacity-60' : ''} hover-lift`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Código: {product.code} • {categories.find(c => c.value === product.category)?.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </p>
                  <p className={`text-sm ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                    {product.available ? 'Disponível' : 'Indisponível'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAvailability(product.id, !product.available)}
                  className="flex-1"
                >
                  <Package className="w-4 h-4 mr-1" />
                  {product.available ? 'Indisponibilizar' : 'Disponibilizar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground">
              Comece adicionando seus primeiros produtos ao sistema
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const handleDelete = (id: string) => {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    const { deleteProduct } = useStore.getState();
    deleteProduct(id);
    toast.success('Produto excluído com sucesso!');
  }
};

const toggleAvailability = (id: string, available: boolean) => {
  const { updateProduct } = useStore.getState();
  updateProduct(id, { available });
  toast.success(`Produto ${available ? 'disponibilizado' : 'indisponibilizado'} com sucesso!`);
};

const getCategoryIcon = (category: ProductCategory) => {
  switch (category) {
    case 'hamburguer': return '🍔';
    case 'bebida': return '🥤';
    case 'acompanhamento': return '🍟';
    case 'sobremesa': return '🍰';
    default: return '📦';
  }
};

export default ProductManager;
