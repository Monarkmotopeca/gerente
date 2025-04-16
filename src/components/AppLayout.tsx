
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { 
  Bike, Home, Users, Wrench, Receipt, BarChart3, 
  LogOut, CloudOff, CheckCircle, CloudUpload, Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState(0);

  useEffect(() => {
    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online && pendingUploads > 0) {
        toast.success(`Conexão restabelecida. Sincronizando ${pendingUploads} alterações...`, {
          duration: 2,
          position: "bottom-right"
        });
        // Aqui chamaríamos a função de sincronização
        synchronizeData().then(() => {
          toast.success("Sincronização concluída com sucesso!", {
            duration: 2,
            position: "bottom-right"
          });
          setPendingUploads(0);
        }).catch(error => {
          toast.error("Erro na sincronização. Tente novamente mais tarde.", {
            duration: 2,
            position: "bottom-right"
          });
          console.error("Sync error:", error);
        });
      } else if (online) {
        toast.success("Conexão restabelecida.", {
          duration: 2,
          position: "bottom-right"
        });
      } else {
        toast.warning(
          "Você está offline. As alterações serão salvas localmente e sincronizadas quando a conexão for restabelecida.",
          { duration: 2, position: "bottom-right" }
        );
      }
    };

    // Pegar o número de itens pendentes do IndexedDB
    checkPendingUploads().then(count => {
      setPendingUploads(count);
    });

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    // Verifica status inicial
    handleOnlineStatus();

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [pendingUploads]);

  // Estas funções seriam implementadas com mais detalhes no sistema real
  const synchronizeData = async () => {
    // Implementação real que buscaria dados do IndexedDB e enviaria para o servidor
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulação
    return Promise.resolve();
  };

  const checkPendingUploads = async () => {
    // Implementação real que verificaria dados não sincronizados no IndexedDB
    return Promise.resolve(Math.floor(Math.random() * 5)); // Simulação
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    { title: "Dashboard", icon: Home, path: "/dashboard" },
    { title: "Mecânicos", icon: Users, path: "/mecanicos" },
    { title: "Serviços", icon: Wrench, path: "/servicos" },
    { title: "Vales", icon: Receipt, path: "/vales" },
    { title: "Relatórios", icon: BarChart3, path: "/relatorios" },
    { title: "Usuários", icon: Settings, path: "/usuarios" }
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center space-x-2">
              <Bike className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">MONARK MOTOPEÇAS</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        isActive={window.location.pathname === item.path}
                      >
                        <a 
                          href={item.path} 
                          className="flex items-center space-x-2"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">{user?.username?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.nome}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.perfil}</p>
                  </div>
                </div>
                <ModeToggle />
              </div>
              
              {isOnline ? (
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 self-start">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 self-start">
                  <CloudOff className="mr-1 h-3 w-3" />
                  Offline
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <h2 className="ml-4 text-xl font-semibold">
                {menuItems.find(item => item.path === window.location.pathname)?.title || "Dashboard"}
              </h2>
            </div>
          </div>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
