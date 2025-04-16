
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as supabaseService from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";

// Interface para o resultado da sincronização
interface SyncResult {
  success: boolean;
  processed?: number;
  failed?: number;
}

// Hook genérico para lidar com qualquer tipo de entidade no Supabase
export function useOfflineData<T extends { id: string }>(entityType: 'mecanicos' | 'servicos' | 'vales') {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Carregar todos os registros do Supabase
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supabaseService.getAll<T>(entityType);
      setData(result);
      return result;
    } catch (error) {
      console.error(`Erro ao carregar ${entityType}:`, error);
      toast.error(`Não foi possível carregar os dados de ${entityType}`, {
        duration: 2,
        position: "bottom-right"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  // Salvar uma entidade
  const saveItem = useCallback(async (item: T): Promise<T> => {
    try {
      if (!navigator.onLine) {
        toast.error("Você está offline. Não é possível salvar dados.", {
          duration: 2,
          position: "bottom-right"
        });
        throw new Error("Offline");
      }
      
      const savedItem = await supabaseService.saveItem<T>(entityType, item);
      
      // Atualiza o estado local
      setData(prev => {
        const existing = prev.findIndex(i => i.id === savedItem.id);
        if (existing >= 0) {
          // Atualiza o item existente
          return prev.map(i => i.id === savedItem.id ? savedItem : i);
        } else {
          // Adiciona novo item
          return [...prev, savedItem];
        }
      });
      
      toast.success(item.id ? 'Item atualizado com sucesso.' : 'Item criado com sucesso.', {
        duration: 2,
        position: "bottom-right"
      });
      
      return savedItem;
    } catch (error) {
      console.error(`Erro ao salvar ${entityType}:`, error);
      toast.error(`Não foi possível salvar o ${entityType}`, {
        duration: 2,
        position: "bottom-right"
      });
      throw error;
    }
  }, [entityType]);

  // Excluir uma entidade
  const deleteItem = useCallback(async (id: string, permanent: boolean = false): Promise<void> => {
    try {
      if (!navigator.onLine) {
        toast.error("Você está offline. Não é possível excluir dados.", {
          duration: 2,
          position: "bottom-right"
        });
        throw new Error("Offline");
      }
      
      await supabaseService.removeItem(entityType, id);
      
      // Atualiza o estado local
      setData(prev => prev.filter(item => item.id !== id));
      
      toast.success(`${entityType === 'mecanicos' ? 'Mecânico' : entityType === 'servicos' ? 'Serviço' : 'Vale'} removido com sucesso.`, {
        duration: 2,
        position: "bottom-right"
      });
    } catch (error) {
      console.error(`Erro ao excluir ${entityType}:`, error);
      toast.error(`Não foi possível excluir o ${entityType}`, {
        duration: 2,
        position: "bottom-right"
      });
      throw error;
    }
  }, [entityType]);

  // Buscar um item específico
  const getItem = useCallback(async (id: string): Promise<T | null> => {
    try {
      return await supabaseService.getById<T>(entityType, id);
    } catch (error) {
      console.error(`Erro ao buscar ${entityType}:`, error);
      toast.error(`Não foi possível buscar o ${entityType}`, {
        duration: 2,
        position: "bottom-right"
      });
      return null;
    }
  }, [entityType]);

  // Configurar atualização em tempo real
  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel('public:changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: entityType },
        (payload) => {
          // Recarregar dados quando houver mudanças
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, loadData]);

  // Monitorar o status online/offline
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      // Quando voltar a ficar online, recarrega os dados
      if (navigator.onLine) {
        loadData();
      }
    };
    
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [loadData]);

  // Carregar os dados iniciais e configurar tempo real
  useEffect(() => {
    loadData();
    
    // Configurar inscrição para atualizações em tempo real
    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      unsubscribe();
    };
  }, [loadData, setupRealtimeSubscription]);

  return {
    data,
    loading,
    isOnline,
    loadData,
    saveItem,
    deleteItem,
    getItem,
    // Não precisamos mais do pendingCount e syncData, pois agora as operações são síncronas com o Supabase
  };
}
