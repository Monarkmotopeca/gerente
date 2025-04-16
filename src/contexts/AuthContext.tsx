
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import * as offlineStorage from "@/services/offlineStorage";

type User = {
  id: string;
  nome: string;
  username: string;
  perfil: "admin" | "usuario" | "mecanico";
};

type UserWithPassword = User & {
  password: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  getUserList: () => Promise<User[]>;
  addUser: (user: Omit<UserWithPassword, "id">) => Promise<User>;
  removeUser: (id: string) => Promise<void>;
  updateUserPassword: (id: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Mock de usuários para testar o sistema - será armazenado no localStorage
const LOCAL_STORAGE_USERS_KEY = "oficina_users";
const DEFAULT_USERS = [
  {
    id: "1",
    nome: "Administrador",
    username: "admin",
    password: "admin",
    perfil: "admin" as const,
  },
  {
    id: "2",
    nome: "Usuário Padrão",
    username: "usuario",
    password: "usuario123",
    perfil: "usuario" as const,
  },
  {
    id: "3",
    nome: "Mecânico",
    username: "mecanico",
    password: "mecanico123",
    perfil: "mecanico" as const,
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithPassword[]>([]);
  
  // Inicializa os usuários a partir do localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Se não existir, inicializa com os usuários padrão
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      setUsers(DEFAULT_USERS);
    }
  }, []);
  
  // Verificar autenticação ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("oficina_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    
    // Configurar temporizador de inatividade (90 minutos)
    let inactivityTimeout: number;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = window.setTimeout(() => {
        if (user) {
          logout();
          toast.warning("Sessão encerrada por inatividade", {
            duration: 2,
            position: "bottom-right"
          });
        }
      }, 90 * 60 * 1000); // 90 minutos
    };
    
    // Eventos para resetar o temporizador
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(inactivityTimeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
    };
  }, [user]);
  
  // Obtém a lista de usuários (sem as senhas)
  const getUserList = async (): Promise<User[]> => {
    // Aguarda um pouco para simular requisição de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  };

  // Adiciona um novo usuário
  const addUser = async (userData: Omit<UserWithPassword, "id">): Promise<User> => {
    // Verificar se já existe usuário com o mesmo nome de usuário
    const existingUser = users.find(u => u.username === userData.username);
    if (existingUser) {
      toast.error("Já existe um usuário com este nome", {
        duration: 2,
        position: "bottom-right"
      });
      throw new Error("Nome de usuário já em uso");
    }
    
    // Cria um novo ID para o usuário (simulando um banco de dados)
    const newUser = {
      ...userData,
      id: Date.now().toString(),
    };
    
    // Atualiza a lista de usuários
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
    
    // Retorna o usuário sem a senha
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  };

  // Remove um usuário
  const removeUser = async (id: string): Promise<void> => {
    // Não permite remover o próprio usuário logado
    if (user?.id === id) {
      toast.error("Você não pode remover sua própria conta", {
        duration: 2,
        position: "bottom-right"
      });
      throw new Error("Não é possível remover o usuário logado");
    }
    
    // Encontra o usuário
    const userToRemove = users.find(u => u.id === id);
    if (!userToRemove) {
      toast.error("Usuário não encontrado", {
        duration: 2,
        position: "bottom-right"
      });
      throw new Error("Usuário não encontrado");
    }
    
    // Não permite remover o último administrador
    if (userToRemove.perfil === "admin") {
      const adminCount = users.filter(u => u.perfil === "admin").length;
      if (adminCount <= 1) {
        toast.error("Não é possível remover o último administrador", {
          duration: 2,
          position: "bottom-right"
        });
        throw new Error("Não é possível remover o último administrador");
      }
    }
    
    // Atualiza a lista de usuários
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
  };

  // Atualiza a senha de um usuário
  const updateUserPassword = async (id: string, newPassword: string): Promise<void> => {
    // Encontra o usuário
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      toast.error("Usuário não encontrado", {
        duration: 2,
        position: "bottom-right"
      });
      throw new Error("Usuário não encontrado");
    }
    
    // Atualiza a senha
    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: newPassword,
    };
    
    setUsers(updatedUsers);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
  };
  
  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = users.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem("oficina_user", JSON.stringify(userWithoutPassword));
      return true;
    }
    
    return false;
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("oficina_user");
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      loading, 
      getUserList, 
      addUser, 
      removeUser, 
      updateUserPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
