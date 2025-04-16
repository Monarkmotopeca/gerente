
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Bike, Wrench } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirecionar se já estiver autenticado
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Por favor, preencha todos os campos", {
        duration: 2,
        position: "bottom-right"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        toast.success("Login realizado com sucesso!", {
          duration: 2,
          position: "bottom-right"
        });
        navigate("/dashboard");
      } else {
        toast.error("Usuário ou senha incorretos", {
          duration: 2,
          position: "bottom-right"
        });
      }
    } catch (error) {
      toast.error("Erro ao realizar login", {
        duration: 2,
        position: "bottom-right"
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 bg-[url('/background-motorbikes.jpg')] bg-cover bg-center">
      <Card className="w-full max-w-md mx-4 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bike className="h-8 w-8 text-primary" />
            <Wrench className="h-7 w-7 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">MONARK MOTOPEÇAS E BICICLETARIA</CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestão de Serviços
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-gray-500">
              <div>
                <strong>Credenciais para teste:</strong>
              </div>
              <div>Admin: admin / admin</div>
              <div>Usuário: usuario / usuario123</div>
              <div>Mecânico: mecanico / mecanico123</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
