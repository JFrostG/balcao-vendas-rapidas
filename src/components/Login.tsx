
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useStore } from '../store/useStore';
import { User } from '../types';
import { ChefHat, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  // Demo users with passwords
  const defaultUsers: (User & { password: string })[] = [
    { id: '1', username: 'admin', name: 'Administrador', role: 'admin', password: 'admin123' },
    { id: '2', username: 'caixa1', name: 'João Silva', role: 'cashier', password: 'caixa123' },
    { id: '3', username: 'caixa2', name: 'Maria Santos', role: 'cashier', password: 'caixa123' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = defaultUsers.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      toast.success(`Bem-vindo, ${user.name}!`);
    } else {
      toast.error('Usuário ou senha incorretos');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-burger-orange to-burger-red p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Burger PDV</CardTitle>
          <CardDescription>
            Sistema de Ponto de Venda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full gradient-burger hover:opacity-90" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Usuários de demonstração:</p>
            <div className="space-y-1">
              <p><strong>admin</strong> / admin123</p>
              <p><strong>caixa1</strong> / caixa123</p>
              <p><strong>caixa2</strong> / caixa123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
