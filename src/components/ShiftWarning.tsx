
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const ShiftWarning = () => {
  return (
    <div className="p-4 flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500" />
          <CardTitle>Turno Necessário</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            É necessário abrir um turno para realizar vendas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftWarning;
