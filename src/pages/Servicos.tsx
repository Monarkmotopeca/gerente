import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, Search, Check, Clock, X, MessageSquare, Wrench, FileText, DollarSign, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOfflineData } from "@/hooks/useOfflineData";

// Tipos para serviços
type StatusServico = "em_andamento" | "concluido" | "cancelado";

type Servico = {
  id: string;
  data: string;
  cliente: string;
  veiculo: string;
  descricao: string;
  mecanico_id: string;
  mecanico_nome: string;
  valor: number;
  telefone: string;
  status: StatusServico;
  cliente_agradecido: boolean;
  created_at?: string;
};

// Tipo para mecânicos
type Mecanico = {
  id: string;
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
  observacoes: string;
  created_at?: string;
};

// Função para gerar o link de agradecimento via WhatsApp
const gerarLinkWhatsApp = (telefone: string, nomeMecanico: string) => {
  // Limpa o telefone para garantir que só tenha números
  const numeroLimpo = telefone.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos (DDD + 9 + número)
  if (numeroLimpo.length !== 11) {
    return null;
  }
  
  const mensagem = `Olá!%20%0AAgradeçemos%20por%20confiar%20na%20MONARK%20MOTOPEÇAS%20E%20BICICLETARIA%20para%20realizar%20seu%20serviço!%20%0AGuarde%20o%20seu%20comprovante%20fiscal,%20pois%20ele%20é%20essencial%20para%20acionar%20a%20garantia,%20caso%20necessário.%20%0ASe%20surgir%20qualquer%20problema,%20estaremos%20prontos%20para%20atendê-lo%20presencialmente%20com%20agilidade%20e%20atenção!%0AConte%20sempre%20conosco%20para%20o%20que%20precisar.%20Qualidade%20e%20compromisso%20fazem%20parte%20do%20nosso%20pós-venda.%20%0A%0AMONARK%20MOTOPEÇAS%20E%20BICICLETARIA%20–%20Sempre%20ao%20seu%20lado!%0ASeu%20serviço%20foi%20realizado%20pelo%20Mecânico%20${encodeURIComponent(nomeMecanico)}%20em%20caso%20de%20ter%20que%20acionar%20a%20garantia,%20procure-o%20presencialmente%20com%20o%20comprovante%20fornecido.`;
  
  return `https://wa.me/55${numeroLimpo}?text=${mensagem}`;
};

const Servicos = () => {
  const { user } = useAuth();
  const { data: servicos, loading: loadingServicos, saveItem: saveServico, deleteItem: deleteServico } = useOfflineData<Servico>('servicos');
  const { data: mecanicos, loading: loadingMecanicos } = useOfflineData<Mecanico>('mecanicos');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusServico | "todos">("todos");
  const [editandoServico, setEditandoServico] = useState<Servico | null>(null);
  
  // Estado para o formulário
  const [formData, setFormData] = useState<Partial<Servico>>({
    data: new Date().toISOString().split("T")[0],
    cliente: "",
    veiculo: "",
    descricao: "",
    mecanico_id: "",
    valor: 0,
    telefone: "699",
    status: "em_andamento",
    cliente_agradecido: false
  });

  // Estado para controlar erros de validação
  const [errors, setErrors] = useState<{
    cliente?: string;
    veiculo?: string;
    descricao?: string;
    mecanico_id?: string;
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
      mecanico_id: mecanicoId, 
      mecanico_nome: mecanicoSelecionado ? mecanicoSelecionado.nome : "" 
    });
  };

  // Função para alternar o status do serviço
  const alternarStatus = async (servico: Servico) => {
    let novoStatus: StatusServico;
    
    // Define a sequência de alternância: em_andamento -> concluido -> cancelado -> em_andamento
    if (servico.status === "em_andamento") {
      novoStatus = "concluido";
    } else if (servico.status === "concluido") {
      novoStatus = "cancelado";
    } else {
      novoStatus = "em_andamento";
    }
    
    try {
      // Atualiza o status do serviço no Supabase
      await saveServico({
        ...servico,
        status: novoStatus
      });
      
      // Exibe mensagem de confirmação
      toast.success(`Status do serviço atualizado para ${
        novoStatus === "em_andamento" ? "Em andamento" : 
        novoStatus === "concluido" ? "Concluído" : 
        "Cancelado"
      }`);
    } catch (error) {
      toast.error("Erro ao atualizar status do serviço");
      console.error(error);
    }
  };

  // Função para tratar a seleção do status no formulário
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

    if (!formData.mecanico_id) {
      novosErros.mecanico_id = "Selecione um mecânico";
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
  const salvarServico = async () => {
    if (!validarFormulario()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      if (editandoServico) {
        // Atualizar serviço existente
        await saveServico({
          ...formData,
          id: editandoServico.id
        } as Servico);
        
        toast.success("Serviço atualizado com sucesso!");
      } else {
        // Adicionar novo serviço
        await saveServico(formData as Servico);
        toast.success("Serviço adicionado com sucesso!");
      }

      // Fechar o diálogo e resetar o formulário
      setDialogOpen(false);
      resetarFormulario();
    } catch (error) {
      toast.error("Erro ao salvar serviço");
      console.error(error);
    }
  };

  // Função para excluir um serviço
  const excluirServico = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await deleteServico(id);
        toast.success("Serviço excluído com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir serviço");
        console.error(error);
      }
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
      mecanico_id: "",
      valor: 0,
      telefone: "699",
      status: "em_andamento",
      cliente_agradecido: false
    });
    setErrors({});
  };

  // Função para agradecer ao cliente via WhatsApp
  const agradecerCliente = async (servico: Servico) => {
    const whatsappLink = gerarLinkWhatsApp(servico.telefone, servico.mecanico_nome);
    
    if (whatsappLink) {
      try {
        // Marca o cliente como agradecido
        await saveServico({
          ...servico,
          cliente_agradecido: true
        });
        
        // Abre o WhatsApp
        window.open(whatsappLink, '_blank');
      } catch (error) {
        toast.error("Erro ao atualizar status de agradecimento");
        console.error(error);
      }
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

  // Função para renderizar os botões de status
  const renderizarBotaoStatus = (servico: Servico) => {
    return (
      <Button
        onClick={() => alternarStatus(servico)}
        variant="ghost"
        size="sm"
        className={`flex items-center gap-1 ${
          servico.status === "em_andamento"
            ? "text-blue-500 hover:text-blue-700"
            : servico.status === "concluido"
            ? "text-green-500 hover:text-green-700"
            : "text-red-500 hover:text-red-700"
        }`}
      >
        {servico.status === "em_andamento" && (
          <Clock className="h-4 w-4" />
        )}
        {servico.status === "concluido" && (
          <Check className="h-4 w-4" />
        )}
        {servico.status === "cancelado" && (
          <X className="h-4 w-4" />
        )}
        <span>
          {servico.status === "em_andamento"
            ? "Em andamento"
            : servico.status === "concluido"
            ? "Concluído"
            : "Cancelado"}
        </span>
      </Button>
    );
  };

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
                            <TableCell>{servico.mecanico_nome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              {renderizarBotaoStatus(servico)}
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
                                  onClick={() => agradecerCliente(servico)}
                                  title="Agradecer ao Cliente"
                                  className={servico.cliente_agradecido ? "text-red-500" : "text-green-500"}
                                >
                                  <MessageSquare className="h-4 w-4" />
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
                            <TableCell>{servico.mecanico_nome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              {renderizarBotaoStatus(servico)}
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
                            <TableCell>{servico.mecanico_nome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              {renderizarBotaoStatus(servico)}
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
                                onClick={() => agradecerCliente(servico)}
                                title="Agradecer ao Cliente"
                                className={servico.cliente_agradecido ? "text-red-500" : "text-green-500"}
                              >
                                <MessageSquare className="h-4 w-4" />
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
                            <TableCell>{servico.mecanico_nome}</TableCell>
                            <TableCell>{formatarMoeda(servico.valor)}</TableCell>
                            <TableCell>
                              {renderizarBotaoStatus(servico)}
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
                  <Label htmlFor="mecanico_id">
                    <div className="flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      <span>Mecânico Responsável</span>
                    </div>
                  </Label>
                  <Select
                    value={formData.mecanico_id}
                    onValueChange={handleMecanicoChange}
                  >
                    <SelectTrigger id="mecanico_id" className={errors.mecanico_id ? "border-red-500" : ""}>
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
                  {errors.mecanico_id && (
                    <p className="text-sm text-red-500">{errors.mecanico_id}</p>
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
