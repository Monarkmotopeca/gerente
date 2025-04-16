
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Bike, Wrench, Users, Receipt, Clock, Calendar, Tool, CheckCircle, AlertTriangle } from "lucide-react";

// Mock de dados para o dashboard de uma oficina de motos e bicicletas
const mockData = {
  servicosEmAndamento: 8,
  servicosConcluidos: 42,
  totalMecanicos: 5,
  totalVales: 15,
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(mockData);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Atualizar data e hora a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Olá, {user?.nome}!</h1>
        <p className="text-gray-500 flex items-center mt-1">
          <Calendar className="mr-2 h-4 w-4" />
          {formatDate(currentDateTime)} 
          <Clock className="ml-4 mr-2 h-4 w-4" />
          {formatTime(currentDateTime)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Serviços em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-blue-500 mr-3" />
              <span className="text-3xl font-bold">{data.servicosEmAndamento}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Serviços Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <span className="text-3xl font-bold">{data.servicosConcluidos}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Mecânicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Tool className="h-8 w-8 text-purple-500 mr-3" />
              <span className="text-3xl font-bold">{data.totalMecanicos}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Vales Emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-amber-500 mr-3" />
              <span className="text-3xl font-bold">{data.totalVales}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Serviços Recentes</CardTitle>
            <CardDescription>Últimos serviços de motos e bicicletas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { cliente: "João Silva", veiculo: "Honda CG 160", tipo: "Moto", servico: "Troca de Óleo", status: "Em andamento", data: "16/4/2025" },
                { cliente: "Maria Santos", veiculo: "Caloi Elite", tipo: "Bicicleta", servico: "Ajuste de Freios", status: "Concluído", data: "15/4/2025" },
                { cliente: "Carlos Ferreira", veiculo: "Yamaha Fazer 250", tipo: "Moto", servico: "Troca de Pneu", status: "Em andamento", data: "15/4/2025" },
                { cliente: "Ana Oliveira", veiculo: "Monark Barra Circular", tipo: "Bicicleta", servico: "Reparo Câmbio", status: "Concluído", data: "14/4/2025" },
                { cliente: "Pedro Costa", veiculo: "Honda CB 300", tipo: "Moto", servico: "Revisão Completa", status: "Em andamento", data: "14/4/2025" }
              ].map((servico, i) => (
                <div key={i} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-1">
                        {servico.tipo === "Moto" ? <Bike className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                        <p className="font-medium">{servico.servico} - {servico.veiculo}</p>
                      </div>
                      <p className="text-sm text-gray-500">Cliente: {servico.cliente}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs rounded-full px-2 py-1 ${
                        servico.status === "Em andamento" 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-green-100 text-green-700"
                      }`}>
                        {servico.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Data: {servico.data}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mecânicos Disponíveis</CardTitle>
            <CardDescription>Status de disponibilidade dos mecânicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { nome: "Carlos Pereira", especialidade: "Mecânico de Motos", status: "Disponível", servicos: 0 },
                { nome: "Roberto Silva", especialidade: "Mecânico de Bicicletas", status: "Ocupado", servicos: 2 },
                { nome: "Antônio Santos", especialidade: "Mecânico de Motos", status: "Disponível", servicos: 0 },
                { nome: "José Oliveira", especialidade: "Especialista em Freios", status: "Ocupado", servicos: 3 },
                { nome: "Paulo Costa", especialidade: "Especialista em Suspensão", status: "Disponível", servicos: 0 },
              ].map((mecanico, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{mecanico.nome}</p>
                    <p className="text-xs text-gray-500">{mecanico.especialidade}</p>
                    <p className="text-sm text-gray-500">Serviços ativos: {mecanico.servicos}</p>
                  </div>
                  <span 
                    className={`text-xs rounded-full px-2 py-1 ${
                      mecanico.status === "Disponível" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {mecanico.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
