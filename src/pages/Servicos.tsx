
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, Search, X, Filter, Wrench, FileText, DollarSign, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tipos para serviços
type StatusServico = "em_andamento" | "concluido" | "cancelado";

type Servico = {
  id: string;
  data: string;
  cliente: string;
  veiculo: string;
  descricao: string;
  mecanicoId: string;
  mecanicoNome: string;
  valor: number;
  telefone: string;
  status: StatusServico;
};

// Mock de mecânicos (será substituído pela integração real com os mecânicos cadastrados)
const mockMecanicos = [
  { id: "1", nome: "Carlos Pereira" },
  { id: "2", nome: "Roberto Silva" },
  { id: "3", nome: "Antônio Santos" },
  { id: "4", nome: "José Oliveira" },
  { id: "5", nome: "Paulo Costa" },
];

// Mock de serviços
const mockServicos: Servico[] = [
  {
    id: "1",
    data: "2025-06-01",
    cliente: "João Silva",
    veiculo: "Ford Ka 2018",
    descricao: "Troca de óleo e filtros",
    mecanicoId: "1",
    mecanicoNome: "Carlos Pereira",
    valor: 250.0,
    telefone: "69912345678",
    status: "em_andamento",
  },
  {
    id: "2",
    data: "2025-05-29",
    cliente: "Maria Santos",
    veiculo: "Honda Fit 2020",
    descricao: "Revisão completa",
    mecanicoId: "2",
    mecanicoNome: "Roberto Silva",
    valor: 450.0,
    telefone: "69987654321",
    status: "em_andamento",
  },
  {
    id: "3",
    data: "2025-05-28",
    cliente: "Pedro Oliveira",
    veiculo: "Fiat Uno 2015",
    descricao: "Troca de pastilhas de freio",
    mecanicoId: "3",
    mecanicoNome: "Antônio Santos",
    valor: 180.0,
    telefone: "69998765432",
    status: "concluido",
  },
  {
    id: "4",
    data: "2025-05-27",
    cliente: "Ana Rodrigues",
    veiculo: "Toyota Corolla 2021",
    descricao: "Alinhamento e balanceamento",
    mecanicoId: "4",
    mecanicoNome: "José Oliveira",
    valor: 220.0,
    telefone: "69987651234",
    status: "concluido",
  },
  {
    id: "5",
    data: "2025-05-25",
    cliente: "Carlos Mendes",
    veiculo: "Renault Sandero 2019",
    descricao: "Troca de correia dentada",
    mecanicoId: "5",
    mecanicoNome: "Paulo Costa",
    valor: 350.0,
    telefone: "69912348765",
    status: "cancelado",
  },
];

// Função para gerar o link de agradecimento via WhatsApp
const gerarLinkWhatsApp = (telefone: string) => {
  // Limpa o telefone para garantir que só tenha números
  const numeroLimpo = telefone.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos (DDD + 9 + número)
  if (numeroLimpo.length !== 11) {
    return null;
  }
  
  const mensagem = "Agradecemos%20imensamente%20pela%20sua%20prefer%C3%AAncia%20em%20realizar%20seu%20servi%C3%A7o%20na%20MONARK%20MOTOPE%C3%87AS%20E%20BICICLETARIA!%20%F0%9F%9A%B2%F0%9F%9A%A7%0A%0ALembramos%20que,%20segundo%20o%20C%C3%B3digo%20de%20Defesa%20do%20Consumidor%20%28CDC%29,%20a%20garantia%20para%20servi%C3%A7os%20e%20pe%C3%A7as%20%C3%A9%20de%2090%20dias.%20%F0%9F%93%9D%F0%9F%9A%96%0A%0AGuarde%20o%20comprovante%20fiscal%20e,%20caso%20haja%20algum%20defeito,%20n%C3%A3o%20hesite%20em%20nos%20procurar%20presencialmente%20para%20que%20possamos%20resolver%20o%20mais%20r%C3%A1pido%20poss%C3%ADvel!%20%F0%9F%98%8A%F0%9F%9A%90%0A%0AEstamos%20%C3%A0%20disposi%C3%A7%C3%A3o%20para%20atend%C3%AA-lo%20com%20todo%20o%20cuidado%20e%20qualidade%20que%20voc%C3%AA%20merece.%20%F0%9F%91%A8%20%F0%9F%9A%A7%F0%9F%99%99%0A%0AMONARK%20MOTOPE%C3%87AS%20E%20BICICLETARIA%20%E2%80%93%20Sempre%20ao%20seu%20lado!";
  
  return `https://wa.me/55${numeroLimpo}?text=${mensagem}`;
};

const Servicos = () => {
  const { user } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>(mockServicos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mecanicos, setMecanicos] = useState(mockMecanicos);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusServico | "todos">("todos");
  const [editandoServico, setEditandoServico] = useState<Servico | null>(null);
  
  // Estado para o formulário
  const [formData, setFormData] = useState<Partial<Servico>>({
    data: new Date().toISOString().split("T")[0],
    cliente: "",
    veiculo: "",
    descricao: "",
    mecanicoId: "",
    valor: 0,
    telefone: "699",
    status: "em_andamento"
  });

  // Estado para controlar erros de validação
  const [errors, setErrors] = useState<{
    cliente?: string;
    veiculo?: string;
    descricao?: string;
    mecanicoId?: string;
    valor?: string;
    telefone?: string;
  }>({});

  // Função para formatar o valor como moeda
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para tratar a mudança nos campos do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "valor") {
      // Remove qualquer caractere que não seja número ou vírgula
      const numericValue = value.replace(/[^\d,]/g, '');
      // Substitui vírgula por ponto para realizar cálculos
      const formattedValue = numericValue.replace(',', '.');
      setFormData({ ...formData, [name]: parseFloat(formattedValue) || 0 });
    } else if (name === "telefone") {
      // Garante que o telefone tenha o formato correto (DDD + 9 + número)
      let telValue = value;
      
      // Se o usuário apagar tudo, reinicie com "699"
      if (telValue.length < 3) {
        telValue = "699";
      }
      
      // Limita a 11 dígitos (DDD + 9 + 8 dígitos)
      if (telValue.length > 11) {
        telValue = telValue.slice(0, 11);
      }
      
      // Garante que comece com "699"
      if (!telValue.startsWith("699")) {
        telValue = "699" + telValue.substring(3);
      }
      
      setFormData({ ...formData, [name]: telValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Função para tratar a seleção do mecânico
  const handleMecanicoChange = (mecanicoId: string) => {
    const mecanicoSelecionado = mecanicos.find(m => m.id === mecanicoId);
    setFormData({ 
      ...formData, 
      mecanicoId, 
      mecanicoNome: mecanicoSelecionado ? mecanicoSelecionado.nome : "" 
    });
  };

  // Função para tratar a seleção do status
  const handleStatusChange = (status: StatusServico) => {
    setFormData({ ...formData, status });
  };

  // Função para validar o formulário
  const validarFormulario = (): boolean => {
    const novosErros: typeof errors = {};

    if (!formData.cliente?.trim()) {
      novosErros.cliente = "Nome do cliente é obrigatório";
    }

    if (!formData.veiculo?.trim()) {
      novosErros.veiculo = "Veículo é obrigatório";
    }

    if (!formData.descricao?.trim()) {
      novosErros.descricao = "Descrição do serviço é obrigatória";
    }

    if (!formData.mecanicoId) {
      novosErros.mecanicoId = "Selecione um mecânico";
    }

    if (!formData.valor || formData.valor <= 0) {
      novosErros.valor = "Valor deve ser maior que zero";
    }

    // Validação de telefone: deve ter 11 dígitos (2 do DDD + 9 + 8 do número)
    if (!formData.telefone || formData.telefone.length !== 11) {
      novosErros.telefone = "Telefone deve estar no formato (DD)9XXXXXXXX";
    } else if (!formData.telefone.startsWith("699")) {
      novosErros.telefone = "Telefone deve começar com 699 (Rondônia)";
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Função para salvar o serviço
  const salvarServico = () => {
    if (!validarFormulario()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    if (editandoServico) {
      // Atualizar serviço existente
      const servicosAtualizados = servicos.map(s => 
        s.id === editandoServico.id ? { ...formData, id: editandoServico.id } as Servico : s
      );
      setServicos(servicosAtualizados);
      toast.success("Serviço atualizado com sucesso!");
    } else {
      // Adicionar novo serviço
      const novoServico: Servico = {
        ...formData as Omit<Servico, 'id'>,
        id: Date.now().toString() // Simulação de ID
      } as Servico;
      
      setServicos([...servicos, novoServico]);
      toast.success("Serviço adicionado com sucesso!");
    }

    // Fechar o diálogo e resetar o formulário
    setDialogOpen(false);
    resetarFormulario();
  };

  // Função para excluir um serviço
  const excluirServico = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      setServicos(servicos.filter(s => s.id !== id));
      toast.success("Serviço excluído com sucesso!");
    }
  };

  // Função para abrir o diálogo de edição
  const abrirEdicao = (servico: Servico) => {
    setEditandoServico(servico);
    setFormData({
      ...servico,
      data: servico.data // Mantém a data original
    });
    setDialogOpen(true);
  };

  // Função para abrir o diálogo de novo serviço
  const abrirNovoServico = () => {
    setEditandoServico(null);
    resetarFormulario();
    setDialogOpen(true);
  };

  // Função para resetar o formulário
  const resetarFormulario = () => {
    setFormData({
      data: new Date().toISOString().split("T")[0],
      cliente: "",
      veiculo: "",
      descricao: "",
      mecanicoId: "",
      valor: 0,
      telefone: "699",
      status: "em_andamento"
    });
    setErrors({});
  };

  // Função para agradecer ao cliente via WhatsApp
  const agradecerCliente = (telefone: string) => {
    const whatsappLink = gerarLinkWhatsApp(telefone);
    if (whatsappLink) {
      window.open(whatsappLink, '_blank');
    } else {
      toast.error("Número de telefone inválido para envio de mensagem");
    }
  };

  // Filtrar serviços
  const servicosFiltrados = servicos.filter(servico => {
    const matchBusca = 
      servico.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      servico.veiculo.toLowerCase().includes(busca.toLowerCase()) ||
      servico.descricao.toLowerCase().includes(busca.toLowerCase());
    
    const matchStatus = filtroStatus === "todos" || servico.status === filtroStatus;
    
    return matchBusca && matchStatus;
  });

  // Efeito para carregar os mecânicos cadastrados (em um sistema real, buscaria do banco de dados)
  useEffect(() => {
    // Aqui seria implementada a busca dos mecânicos cadastrados
    // Por enquanto, usamos os dados mock
    setMecanicos(mockMecanicos);
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Gerenciamento de Serviços</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar serviços..."
                className="pl-8"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Button onClick={abrirNovoServico}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </div>
        </div>

        <div>
          <Tabs defaultValue="todos" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="todos" onClick={() => setFiltroStatus("todos")}>
                Todos os Serviços
              </TabsTrigger>
              <TabsTrigger value="em_andamento" onClick={() => setFiltroStatus("em_andamento")}>
                Em Andamento
              </TabsTrigger>
              <TabsTrigger value="concluido" onClick={() => setFiltroStatus("concluido")}>
                Concluídos
              </TabsTrigger>
              <TabsTrigger value="cancelado" onClick={() => setFiltroStatus("cancelado")}>
                Cancelados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Mecânico</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Nenhum serviço encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        servicosFiltrados.map((servico) => (
                          <TableRow key={servico.id}>
                            <TableCell>
                              {new Date(servico.data).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{servico.cliente}</TableCell>
                            <TableCell>{servico.veiculo}</TableCell>
                            <TableCell>{servico.mecanicoNome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  servico.status === "em_andamento"
                                    ? "bg-blue-100 text-blue-800"
                                    : servico.status === "concluido"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {servico.status === "em_andamento"
                                  ? "Em andamento"
                                  : servico.status === "concluido"
                                  ? "Concluído"
                                  : "Cancelado"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirEdicao(servico)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {servico.status === "concluido" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => agradecerCliente(servico.telefone)}
                                  title="Agradecer ao Cliente"
                                >
                                  <MessageSquare className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => excluirServico(servico.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="em_andamento" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  {/* O mesmo conteúdo da tabela será exibido aqui, mas filtrado */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Mecânico</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Nenhum serviço em andamento
                          </TableCell>
                        </TableRow>
                      ) : (
                        servicosFiltrados.map((servico) => (
                          <TableRow key={servico.id}>
                            <TableCell>
                              {new Date(servico.data).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{servico.cliente}</TableCell>
                            <TableCell>{servico.veiculo}</TableCell>
                            <TableCell>{servico.mecanicoNome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Em andamento
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirEdicao(servico)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => excluirServico(servico.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="concluido" className="mt-0">
              {/* Tabela de Serviços Concluídos */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Mecânico</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Nenhum serviço concluído
                          </TableCell>
                        </TableRow>
                      ) : (
                        servicosFiltrados.map((servico) => (
                          <TableRow key={servico.id}>
                            <TableCell>
                              {new Date(servico.data).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{servico.cliente}</TableCell>
                            <TableCell>{servico.veiculo}</TableCell>
                            <TableCell>{servico.mecanicoNome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Concluído
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirEdicao(servico)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => agradecerCliente(servico.telefone)}
                                title="Agradecer ao Cliente"
                              >
                                <MessageSquare className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => excluirServico(servico.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cancelado" className="mt-0">
              {/* Tabela de Serviços Cancelados */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Mecânico</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Nenhum serviço cancelado
                          </TableCell>
                        </TableRow>
                      ) : (
                        servicosFiltrados.map((servico) => (
                          <TableRow key={servico.id}>
                            <TableCell>
                              {new Date(servico.data).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{servico.cliente}</TableCell>
                            <TableCell>{servico.veiculo}</TableCell>
                            <TableCell>{servico.mecanicoNome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Cancelado
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => abrirEdicao(servico)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => excluirServico(servico.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Diálogo para adicionar/editar serviço */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {editandoServico ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                {editandoServico
                  ? "Edite os detalhes do serviço abaixo"
                  : "Preencha os detalhes do novo serviço"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    name="data"
                    type="date"
                    value={formData.data}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mecanicoId">
                    <div className="flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      <span>Mecânico Responsável</span>
                    </div>
                  </Label>
                  <Select
                    value={formData.mecanicoId}
                    onValueChange={handleMecanicoChange}
                  >
                    <SelectTrigger id="mecanicoId" className={errors.mecanicoId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione um mecânico" />
                    </SelectTrigger>
                    <SelectContent>
                      {mecanicos.map(mecanico => (
                        <SelectItem key={mecanico.id} value={mecanico.id}>
                          {mecanico.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.mecanicoId && (
                    <p className="text-sm text-red-500">{errors.mecanicoId}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente</Label>
                <Input
                  id="cliente"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  className={errors.cliente ? "border-red-500" : ""}
                />
                {errors.cliente && (
                  <p className="text-sm text-red-500">{errors.cliente}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="veiculo">Veículo</Label>
                  <Input
                    id="veiculo"
                    name="veiculo"
                    value={formData.veiculo}
                    onChange={handleInputChange}
                    className={errors.veiculo ? "border-red-500" : ""}
                    placeholder="Modelo e ano"
                  />
                  {errors.veiculo && (
                    <p className="text-sm text-red-500">{errors.veiculo}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>Telefone (com DDD)</span>
                    </div>
                  </Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className={errors.telefone ? "border-red-500" : ""}
                    placeholder="(69)9XXXX-XXXX"
                    maxLength={11}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-500">{errors.telefone}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Descrição do Serviço</span>
                  </div>
                </Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  className={errors.descricao ? "border-red-500" : ""}
                  placeholder="Descreva detalhadamente o serviço a ser realizado"
                  rows={3}
                />
                {errors.descricao && (
                  <p className="text-sm text-red-500">{errors.descricao}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Valor (R$)</span>
                    </div>
                  </Label>
                  <Input
                    id="valor"
                    name="valor"
                    value={formData.valor === 0 ? "" : formData.valor.toString().replace(".", ",")}
                    onChange={handleInputChange}
                    className={errors.valor ? "border-red-500" : ""}
                    placeholder="0,00"
                  />
                  {errors.valor && (
                    <p className="text-sm text-red-500">{errors.valor}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleStatusChange(value as StatusServico)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetarFormulario();
                }}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={salvarServico}>
                {editandoServico ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Servicos;
