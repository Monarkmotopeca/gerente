import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2, Search, X, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { useOfflineData } from "@/hooks/useOfflineData";

// Adaptação dos tipos para Supabase
type Vale = {
  id: string;
  data: string;
  mecanico_id: string;
  mecanico_nome: string;
  valor: number;
  descricao: string;
  status: 'pendente' | 'pago' | 'cancelado';
  created_at?: string;
};

// Tipo para produtos em estoque (posteriormente será adaptado para uma tabela no Supabase)
type ItemEstoque = {
  id: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  estoqueMinimo: number;
};

// Mock de produtos em estoque (posteriormente será substituído por uma tabela no Supabase)
const mockEstoque: ItemEstoque[] = [
  { id: "1", nome: "Óleo de Motor 5W30", quantidade: 15, valorUnitario: 35.9, estoqueMinimo: 5 },
  { id: "2", nome: "Filtro de Óleo", quantidade: 12, valorUnitario: 25.5, estoqueMinimo: 4 },
  { id: "3", nome: "Filtro de Ar", quantidade: 8, valorUnitario: 40.0, estoqueMinimo: 3 },
  { id: "4", nome: "Pastilha de Freio", quantidade: 6, valorUnitario: 120.0, estoqueMinimo: 2 },
  { id: "5", nome: "Fluido de Freio DOT4", quantidade: 10, valorUnitario: 28.5, estoqueMinimo: 3 },
  { id: "6", nome: "Vela de Ignição", quantidade: 20, valorUnitario: 18.9, estoqueMinimo: 4 },
];

const Vales = () => {
  const { data: vales, loading: loadingVales, saveItem: saveVale, deleteItem: deleteVale } = useOfflineData<Vale>('vales');
  const { data: mecanicos, loading: loadingMecanicos } = useOfflineData<{ id: string; nome: string }>('mecanicos');
  
  const [estoque, setEstoque] = useState<ItemEstoque[]>(mockEstoque);
  const [filteredVales, setFilteredVales] = useState<Vale[]>([]);
  const [isValeDialogOpen, setIsValeDialogOpen] = useState(false);
  const [isEstoqueDialogOpen, setIsEstoqueDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [valeEmEdicao, setValeEmEdicao] = useState<Vale | null>(null);
  const [itemEstoqueEmEdicao, setItemEstoqueEmEdicao] = useState<ItemEstoque | null>(null);
  
  // Estado para o formulário de vale
  const [valeFormData, setValeFormData] = useState<Omit<Vale, "id" | "created_at">>({
    data: new Date().toISOString().split("T")[0],
    mecanico_id: "",
    mecanico_nome: "",
    valor: 0,
    descricao: "",
    status: "pendente"
  });
  
  // Estado para o formulário de estoque
  const [estoqueFormData, setEstoqueFormData] = useState<Omit<ItemEstoque, "id">>({
    nome: "",
    quantidade: 0,
    valorUnitario: 0,
    estoqueMinimo: 0,
  });

  const { user } = useAuth();
  const isAdmin = user?.perfil === "admin";
  const isUsuario = user?.perfil === "usuario";
  
  // Atualizar filteredVales quando vales mudarem
  useEffect(() => {
    if (searchTerm) {
      const filtered = vales.filter(vale => 
        vale.mecanico_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vale.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVales(filtered);
    } else {
      setFilteredVales(vales);
    }
  }, [vales, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
  };

  const handleValeInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "valor") {
      // Remove qualquer caractere que não seja número ou vírgula
      const numericValue = value.replace(/[^\d,]/g, '');
      // Substitui vírgula por ponto para realizar cálculos
      const formattedValue = numericValue.replace(',', '.');
      setValeFormData({ ...valeFormData, [name]: parseFloat(formattedValue) || 0 });
    } else {
      setValeFormData({ ...valeFormData, [name]: value });
    }
  };

  // Função para tratar a seleção do mecânico
  const handleMecanicoChange = (mecanicoId: string) => {
    const mecanicoSelecionado = mecanicos.find(m => m.id === mecanicoId);
    setValeFormData({ 
      ...valeFormData, 
      mecanico_id: mecanicoId, 
      mecanico_nome: mecanicoSelecionado ? mecanicoSelecionado.nome : "" 
    });
  };

  const handleEstoqueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "quantidade" || name === "valorUnitario" || name === "estoqueMinimo") {
      setEstoqueFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setEstoqueFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetValeForm = () => {
    setValeFormData({
      data: new Date().toISOString().split("T")[0],
      mecanico_id: "",
      mecanico_nome: "",
      valor: 0,
      descricao: "",
      status: "pendente"
    });
    setValeEmEdicao(null);
  };

  const resetEstoqueForm = () => {
    setEstoqueFormData({
      nome: "",
      quantidade: 0,
      valorUnitario: 0,
      estoqueMinimo: 0,
    });
    setItemEstoqueEmEdicao(null);
  };

  const handleOpenValeDialog = (vale?: Vale) => {
    if (vale) {
      setValeEmEdicao(vale);
      setValeFormData({
        data: vale.data,
        mecanico_id: vale.mecanico_id,
        mecanico_nome: vale.mecanico_nome,
        valor: vale.valor,
        descricao: vale.descricao,
        status: vale.status
      });
    } else {
      resetValeForm();
      setValeEmEdicao(null);
    }
    setIsValeDialogOpen(true);
  };

  const handleOpenEstoqueDialog = (item?: ItemEstoque) => {
    if (item) {
      setItemEstoqueEmEdicao(item);
      setEstoqueFormData({
        nome: item.nome,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        estoqueMinimo: item.estoqueMinimo,
      });
    } else {
      resetEstoqueForm();
      setItemEstoqueEmEdicao(null);
    }
    setIsEstoqueDialogOpen(true);
  };

  const handleSubmitVale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!valeFormData.mecanico_id || valeFormData.valor <= 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    try {
      if (valeEmEdicao) {
        // Editar vale existente
        await saveVale({
          ...valeFormData,
          id: valeEmEdicao.id
        } as Vale);
        
        toast.success("Vale atualizado com sucesso!");
      } else {
        // Adicionar novo vale
        await saveVale(valeFormData as Vale);
        toast.success("Vale criado com sucesso!");
      }
      
      setIsValeDialogOpen(false);
      resetValeForm();
    } catch (error) {
      console.error("Erro ao salvar vale:", error);
      toast.error("Ocorreu um erro ao salvar o vale");
    }
  };

  const handleSubmitEstoque = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!estoqueFormData.nome || estoqueFormData.valorUnitario <= 0) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    if (itemEstoqueEmEdicao) {
      // Editar item existente
      const updatedEstoque = estoque.map(item =>
        item.id === itemEstoqueEmEdicao.id
          ? { ...estoqueFormData, id: item.id }
          : item
      );
      setEstoque(updatedEstoque);
      toast.success("Item de estoque atualizado com sucesso!");
    } else {
      // Adicionar novo item
      const newItem: ItemEstoque = {
        id: (estoque.length + 1).toString(),
        ...estoqueFormData,
      };
      const updatedEstoque = [...estoque, newItem];
      setEstoque(updatedEstoque);
      toast.success("Item de estoque adicionado com sucesso!");
    }
    
    setIsEstoqueDialogOpen(false);
    resetEstoqueForm();
  };

  const handleDeleteVale = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este vale?")) {
      try {
        await deleteVale(id);
        toast.success("Vale excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir vale:", error);
        toast.error("Ocorreu um erro ao excluir o vale");
      }
    }
  };

  const handleDeleteEstoque = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item do estoque?")) {
      const itemParaExcluir = estoque.find(item => item.id === id);
      
      // Verificar se o item está sendo usado em algum vale
      if (itemParaExcluir && vales.some(v => v.descricao === itemParaExcluir.nome)) {
        toast.error("Este item não pode ser excluído pois está sendo usado em vales.");
        return;
      }
      
      const updatedEstoque = estoque.filter(item => item.id !== id);
      setEstoque(updatedEstoque);
      toast.success("Item de estoque excluído com sucesso!");
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Filtra itens com estoque baixo
  const itensComEstoqueBaixo = estoque.filter(
    item => item.quantidade <= item.estoqueMinimo
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestão de Vales e Estoque</h1>
          <div className="space-x-2">
            {(isAdmin || isUsuario) && (
              <>
                <Button onClick={() => handleOpenEstoqueDialog()}>
                  Adicionar Item ao Estoque
                </Button>
                <Button onClick={() => handleOpenValeDialog()}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Novo Vale
                </Button>
              </>
            )}
          </div>
        </div>

        {itensComEstoqueBaixo.length > 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 flex items-center text-lg">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alerta de Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {itensComEstoqueBaixo.map(item => (
                  <div key={item.id} className="flex justify-between bg-white p-2 rounded border border-amber-200">
                    <span className="font-medium">{item.nome}</span>
                    <span className="text-red-600">
                      Restam apenas {item.quantidade} unidades
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vales */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Vales Emitidos</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar vales..."
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      onClick={() => {
                        setSearchTerm("");
                        setFilteredVales(vales);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Mecânico</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      {(isAdmin || isUsuario) && <TableHead className="w-[100px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVales.length > 0 ? (
                      filteredVales.map((vale) => (
                        <TableRow key={vale.id}>
                          <TableCell>{formatarData(vale.data)}</TableCell>
                          <TableCell>{vale.mecanico_nome}</TableCell>
                          <TableCell>{formatarValor(vale.valor)}</TableCell>
                          <TableCell>{vale.status}</TableCell>
                          {(isAdmin || isUsuario) && (
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenValeDialog(vale)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteVale(vale.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={(isAdmin || isUsuario) ? 6 : 5} className="text-center py-6">
                          Nenhum vale encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Estoque */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Estoque de Produtos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      {(isAdmin || isUsuario) && <TableHead className="w-[100px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoque.length > 0 ? (
                      estoque.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>
                            <span
                              className={`${
                                item.quantidade <= item.estoqueMinimo
                                  ? "text-red-600 font-medium"
                                  : ""
                              }`}
                            >
                              {item.quantidade} un
                            </span>
                          </TableCell>
                          <TableCell>{formatarValor(item.valorUnitario)}</TableCell>
                          {(isAdmin || isUsuario) && (
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEstoqueDialog(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteEstoque(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={(isAdmin || isUsuario) ? 4 : 3} className="text-center py-6">
                          Nenhum item em estoque.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para Novo Vale - Adaptado para Supabase */}
      <Dialog open={isValeDialogOpen} onOpenChange={setIsValeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {valeEmEdicao ? "Editar Vale" : "Emitir Novo Vale"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do vale abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitVale}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    name="data"
                    type="date"
                    value={valeFormData.data}
                    onChange={handleValeInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mecanico_id">Mecânico</Label>
                  <select
                    id="mecanico_id"
                    name="mecanico_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={valeFormData.mecanico_id}
                    onChange={(e) => handleMecanicoChange(e.target.value)}
                    required
                  >
                    <option value="">Selecione um mecânico</option>
                    {mecanicos.map(mecanico => (
                      <option key={mecanico.id} value={mecanico.id}>
                        {mecanico.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="text"
                  value={valeFormData.valor === 0 ? "" : valeFormData.valor.toString().replace(".", ",")}
                  onChange={handleValeInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={valeFormData.status}
                  onChange={handleValeInputChange}
                  required
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  rows={3}
                  value={valeFormData.descricao}
                  onChange={handleValeInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsValeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Estoque */}
      <Dialog open={isEstoqueDialogOpen} onOpenChange={setIsEstoqueDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {itemEstoqueEmEdicao ? "Editar Item de Estoque" : "Adicionar Item ao Estoque"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do produto abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEstoque}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={estoqueFormData.nome}
                  onChange={handleEstoqueInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantidade">Quantidade em Estoque</Label>
                  <Input
                    id="quantidade"
                    name="quantidade"
                    type="number"
                    min="0"
                    value={estoqueFormData.quantidade}
                    onChange={handleEstoqueInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
                  <Input
                    id="estoqueMinimo"
                    name="estoqueMinimo"
                    type="number"
                    min="0"
                    value={estoqueFormData.estoqueMinimo}
                    onChange={handleEstoqueInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
                <Input
                  id="valorUnitario"
                  name="valorUnitario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={estoqueFormData.valorUnitario}
                  onChange={handleEstoqueInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEstoqueDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Vales;
