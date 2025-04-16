
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { UserPlus, Pencil, Trash2 } from "lucide-react";

// Interface para usuário sem senha
interface User {
  id: string;
  nome: string;
  username: string;
  perfil: "admin" | "usuario" | "mecanico";
}

// Interface para formulário de adição de usuário (com senha)
interface UserFormData {
  nome: string;
  username: string;
  perfil: "admin" | "usuario" | "mecanico";
  password: string;
}

const UserManagement = () => {
  const { getUserList, addUser, removeUser, updateUserPassword, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Estado para formulário de adição de usuário
  const [formData, setFormData] = useState<UserFormData>({
    nome: "",
    username: "",
    perfil: "usuario",
    password: "",
  });
  
  // Estado para alteração de senha
  const [newPassword, setNewPassword] = useState("");
  
  // Carregar lista de usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await getUserList();
      setUsers(userList);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar lista de usuários", {
        duration: 2,
        position: "bottom-right"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Efeito para carregar usuários ao montar o componente
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Manipuladores para o formulário de adição
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      perfil: value as "admin" | "usuario" | "mecanico" 
    }));
  };
  
  // Adicionar novo usuário
  const handleAddUser = async () => {
    try {
      // Verificar se todos os campos foram preenchidos
      if (!formData.nome || !formData.username || !formData.password) {
        toast.error("Preencha todos os campos obrigatórios", {
          duration: 2,
          position: "bottom-right"
        });
        return;
      }
      
      // Enviar dados para adicionar usuário
      await addUser({
        nome: formData.nome,
        username: formData.username,
        perfil: formData.perfil,
        password: formData.password
      });
      
      // Fechar o diálogo e limpar o formulário
      setOpenAddDialog(false);
      setFormData({
        nome: "",
        username: "",
        perfil: "usuario",
        password: "",
      });
      
      // Recarregar a lista de usuários
      await loadUsers();
      
      toast.success("Usuário adicionado com sucesso", {
        duration: 2,
        position: "bottom-right"
      });
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      toast.error("Erro ao adicionar usuário", {
        duration: 2,
        position: "bottom-right"
      });
    }
  };
  
  // Remover usuário
  const handleRemoveUser = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este usuário?")) {
      try {
        await removeUser(id);
        await loadUsers();
        toast.success("Usuário removido com sucesso", {
          duration: 2,
          position: "bottom-right"
        });
      } catch (error) {
        console.error("Erro ao remover usuário:", error);
        toast.error("Erro ao remover usuário", {
          duration: 2,
          position: "bottom-right"
        });
      }
    }
  };
  
  // Abrir diálogo para alterar senha
  const handleOpenPasswordDialog = (userId: string) => {
    setSelectedUserId(userId);
    setNewPassword("");
    setOpenPasswordDialog(true);
  };
  
  // Alterar senha
  const handleChangePassword = async () => {
    try {
      if (!selectedUserId || !newPassword) {
        toast.error("Senha inválida", {
          duration: 2,
          position: "bottom-right"
        });
        return;
      }
      
      await updateUserPassword(selectedUserId, newPassword);
      setOpenPasswordDialog(false);
      toast.success("Senha alterada com sucesso", {
        duration: 2,
        position: "bottom-right"
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha", {
        duration: 2,
        position: "bottom-right"
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>
              Adicione, edite ou remova usuários do sistema
            </CardDescription>
          </div>
          
          <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para adicionar um novo usuário ao sistema.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Nome de usuário para login"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="perfil">Perfil</Label>
                  <Select 
                    value={formData.perfil} 
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="usuario">Usuário</SelectItem>
                      <SelectItem value="mecanico">Mecânico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Senha do usuário"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <p>Carregando usuários...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell className="capitalize">
                    {user.perfil === "admin" ? "Administrador" : 
                     user.perfil === "usuario" ? "Usuário" : "Mecânico"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPasswordDialog(user.id)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Alterar senha</span>
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={user.id === currentUser?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para o usuário.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManagement;
