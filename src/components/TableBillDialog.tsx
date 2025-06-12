
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '../store/useStore';
import { PaymentMethod } from '../types';
import { CreditCard, Printer, Split } from 'lucide-react';
import { toast } from 'sonner';
import SplitPaymentDialog from './SplitPaymentDialog';

interface TableBillDialogProps {
  tableNumber: number;
  onClose: () => void;
  onPayment: (tableNumber: number) => void;
}

const TableBillDialog = ({ tableNumber, onClose, onPayment }: TableBillDialogProps) => {
  const { tables, completeTableSale, completeTableSaleWithSplit } = useStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  
  const table = tables.find(t => t.id === tableNumber);
  
  if (!table) return null;

  const cartTotal = table.total;
  const discountAmount = discountType === 'percentage' ? (cartTotal * discount) / 100 : discount;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handlePrintBill = () => {
    const billContent = `
================================
       CONTA DA MESA ${tableNumber}
================================

${table.orders.map(item => 
  `${item.quantity}x ${item.productName}
                    R$ ${item.subtotal.toFixed(2)}`
).join('\n\n')}

--------------------------------
Subtotal: R$ ${cartTotal.toFixed(2)}
${discount > 0 ? `Desconto: R$ ${discountAmount.toFixed(2)}\n` : ''}Total: R$ ${finalTotal.toFixed(2)}
================================
    `;
    
    console.log('Imprimindo conta:', billContent);
    toast.success('Conta impressa com sucesso!');
  };

  const handleSimplePayment = () => {
    if (!table.orders.length) {
      toast.error('Mesa sem pedidos');
      return;
    }

    completeTableSale(tableNumber, paymentMethod, discount, discountType);
    onPayment(tableNumber);
  };

  const handleSplitPayment = (payments: Array<{method: PaymentMethod, amount: number}>, shouldPrint: boolean) => {
    if (!table.orders.length) {
      toast.error('Mesa sem pedidos');
      return;
    }

    if (shouldPrint) {
      handlePrintBill();
    }

    completeTableSaleWithSplit(tableNumber, payments, discount, discountType);
    setShowSplitDialog(false);
    onPayment(tableNumber);
    toast.success(`Pagamento dividido realizado - Mesa ${tableNumber} liberada`);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-white border-green-200">
          <DialogHeader>
            <DialogTitle className="text-green-800 text-xl">Conta da Mesa {tableNumber}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Items */}
            <Card className="border-green-200">
              <CardContent className="p-4 bg-green-50">
                <h3 className="font-semibold mb-4 text-green-800">Itens do Pedido</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {table.orders.map(item => (
                    <div key={item.productId} className="flex justify-between items-center bg-white p-3 rounded border border-green-100">
                      <div>
                        <span className="font-medium text-green-800">{item.quantity}x {item.productName}</span>
                        <div className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</div>
                      </div>
                      <span className="font-bold text-green-600">R$ {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-green-800 font-medium">Desconto</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="border-green-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <Label className="text-green-800 font-medium">Tipo</Label>
                <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'value' | 'percentage')}>
                  <SelectTrigger className="border-green-300 focus:border-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="value">R$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto:</span>
                    <span>- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl border-t border-green-200 pt-2">
                  <span className="text-green-800">Total:</span>
                  <span className="text-green-600">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method for Simple Payment */}
            <div>
              <Label className="text-green-800 font-medium">Pagamento Simples</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger className="border-green-300 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="debito">Cartão Débito</SelectItem>
                  <SelectItem value="credito">Cartão Crédito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cortesia">Cortesia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handlePrintBill} 
                variant="outline" 
                className="w-full border-green-300 text-green-700 hover:bg-green-50 h-12"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir Conta
              </Button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={handleSimplePayment} 
                  className="bg-green-600 hover:bg-green-700 text-white h-12"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar Simples
                </Button>
                <Button 
                  onClick={() => setShowSplitDialog(true)} 
                  variant="outline" 
                  className="border-green-300 text-green-700 hover:bg-green-50 h-12"
                >
                  <Split className="w-5 h-5 mr-2" />
                  Dividir Conta
                </Button>
              </div>
              
              <Button 
                onClick={onClose} 
                variant="outline" 
                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 h-12"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SplitPaymentDialog
        isOpen={showSplitDialog}
        onClose={() => setShowSplitDialog(false)}
        totalAmount={finalTotal}
        onConfirm={handleSplitPayment}
      />
    </>
  );
};

export default TableBillDialog;
