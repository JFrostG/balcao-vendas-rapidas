
import { Button } from '@/components/ui/button';
import { Clock, Utensils, Truck, Check } from 'lucide-react';

interface DeliveryStatusButtonsProps {
  currentStatus: string;
  onStatusChange: (status: 'pending' | 'preparing' | 'out-for-delivery' | 'delivered') => void;
}

const DeliveryStatusButtons = ({ currentStatus, onStatusChange }: DeliveryStatusButtonsProps) => {
  const statusFlow = [
    { key: 'pending', label: 'Pendente', icon: Clock, color: 'bg-yellow-600 hover:bg-yellow-700' },
    { key: 'preparing', label: 'Preparando', icon: Utensils, color: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'out-for-delivery', label: 'Saiu Entrega', icon: Truck, color: 'bg-orange-600 hover:bg-orange-700' },
    { key: 'delivered', label: 'Entregue', icon: Check, color: 'bg-green-600 hover:bg-green-700' }
  ];

  const getCurrentIndex = () => statusFlow.findIndex(s => s.key === currentStatus);
  const getNextStatus = () => {
    const currentIndex = getCurrentIndex();
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="flex gap-2">
      {nextStatus && (
        <Button
          onClick={() => onStatusChange(nextStatus.key as any)}
          className={`${nextStatus.color} text-white flex items-center gap-2`}
        >
          <nextStatus.icon className="w-4 h-4" />
          {nextStatus.label}
        </Button>
      )}
      
      <div className="flex gap-1">
        {statusFlow.map((status, index) => {
          const Icon = status.icon;
          const isActive = status.key === currentStatus;
          const isPassed = getCurrentIndex() > index;
          
          return (
            <Button
              key={status.key}
              size="sm"
              variant={isActive ? "default" : isPassed ? "secondary" : "outline"}
              onClick={() => onStatusChange(status.key as any)}
              className={isActive ? status.color.replace('hover:', '') : ''}
            >
              <Icon className="w-3 h-3" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryStatusButtons;
