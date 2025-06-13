
import { Button } from '@/components/ui/button';
import { PaymentMethod } from '../types';

interface QuickPaymentButtonsProps {
  onPaymentSelect: (method: PaymentMethod) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

const QuickPaymentButtons = ({ onPaymentSelect, onKeyDown, className = "" }: QuickPaymentButtonsProps) => {
  const paymentMethods: Array<{key: PaymentMethod, label: string, color: string, shortcut: string}> = [
    { key: 'dinheiro', label: 'Dinheiro', color: 'bg-green-600 hover:bg-green-700', shortcut: '1' },
    { key: 'debito', label: 'Débito', color: 'bg-blue-600 hover:bg-blue-700', shortcut: '2' },
    { key: 'credito', label: 'Crédito', color: 'bg-purple-600 hover:bg-purple-700', shortcut: '3' },
    { key: 'pix', label: 'PIX', color: 'bg-teal-600 hover:bg-teal-700', shortcut: '4' },
    { key: 'cortesia', label: 'Cortesia', color: 'bg-orange-600 hover:bg-orange-700', shortcut: '5' }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-2 ${className}`} onKeyDown={onKeyDown}>
      {paymentMethods.map((method) => (
        <Button
          key={method.key}
          onClick={() => onPaymentSelect(method.key)}
          className={`${method.color} text-white h-16 text-sm font-medium relative`}
        >
          <div className="text-center">
            <div>{method.label}</div>
            <div className="text-xs opacity-75">[{method.shortcut}]</div>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default QuickPaymentButtons;
