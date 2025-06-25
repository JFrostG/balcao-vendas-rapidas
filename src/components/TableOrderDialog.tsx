
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useStore } from '../store/useStore';
import { ProductCategory } from '../types';
import { Plus, Minus, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';

interface TableOrderDialogProps {
  tableNumber: number;
  onClose: () => void;
  onRequestBill: (tableNumber: number) => void;
}

const TableOrderDialog = ({ tableNumber, onClose, onRequestBill }: TableOrderDialogProps) => {
  const { products, tables, addToTable, removeFromTable, updateTableQuantity } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  
  const table = tables.find(t => t.id === tableNumber);
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

  const handleAddProduct = (product: any) => {
    addToTable(tableNumber, product);
    const tableName = tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`;
    toast.success(`${product.name} adicionado ao ${tableName}`);
  };

  const handleRequestBill = () => {
    if (!table?.orders.length) {
      toast.error('Mesa sem pedidos');
      return;
    }
    onRequestBill(tableNumber);
  };

  const getTableName = () => {
    return tableNumber === 0 ? 'Balcão' : `Mesa ${tableNumber}`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{getTableName()} - Pedidos</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[70vh]">
          {/* Products */}
          <div className="flex-1 pr-4 overflow-y-auto">
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

            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-3" onClick={() => handleAddProduct(product)}>
                    <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {categoryLabels[product.category]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Orders */}
          <div className="w-80 border-l pl-4 flex flex-col">
            <h3 className="font-semibold mb-4">Pedidos da Mesa</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {!table?.orders.length ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pedido
                </p>
              ) : (
                table.orders.map((item, index) => (
                  <Card key={`${item.productId}-${index}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{item.productName}</h4>
                        <Button 
                          onClick={() => removeFromTable(tableNumber, item.productId)}
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
                            onClick={() => updateTableQuantity(tableNumber, item.productId, item.quantity - 1)}
                            variant="outline" 
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <Button 
                            onClick={() => updateTableQuantity(tableNumber, item.productId, item.quantity + 1)}
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

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span>R$ {(table?.total || 0).toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleRequestBill}
                  className="w-full"
                  disabled={!table?.orders.length}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Solicitar Conta
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableOrderDialog;
