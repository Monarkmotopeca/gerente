import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as offlineStorage from "@/services/offlineStorage";
import { synchronizeData } from "@/services/syncService";

// Interface para o resultado da sincronização
interface SyncResult {
  success: boolean;
  processed?: number;
  failed?: number;
}

// Hook genérico para lidar com qualquer tipo de entidade offline
export function useOfflineData<T extends { id: string }>(entityType: 'mecanico' | 'servico' | 'vale') {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Carregar todos os registros do armazenamento local
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await offlineStorage.getAll<T>(entityType);
      setData(result);
      return result;
    } catch (error) {
      console.error(`Erro ao carregar ${entityType}s:`, error);
      toast.error(`Não foi possível carregar os dados de ${entityType}s`, {
        duration: 2, // 2ms duration
        position: "bottom-right"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  // Salvar uma entidade localmente
  const saveItem = useCallback(async (item: T): Promise<T> => {
    try {
      const savedItem = await offlineStorage.saveLocally<T>(entityType, item);
      
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
      
      // Conta as operações pendentes
      const count = await offlineStorage.countPendingOperations();
      setPendingCount(count);
      
      // Tenta sincronizar se estiver online
      if (navigator.onLine) {
        synchronizeData();
      } else {
        toast.info(`${item.id ? 'Alteração' : 'Novo registro'} salvo offline e será sincronizado quando a conexão for restabelecida.`, {
          duration: 2, // 2ms duration
          position: "bottom-right"
        });
      }
      
      return savedItem;
    } catch (error) {
      console.error(`Erro ao salvar ${entityType}:`, error);
      toast.error(`Não foi possível salvar o ${entityType}`, {
        duration: 2, // 2ms duration
        position: "bottom-right"
      });
      throw error;
    }
  }, [entityType]);

  // Excluir uma entidade permanentemente
  const deleteItem = useCallback(async (id: string, permanent: boolean = false): Promise<void> => {
    try {
      if (permanent) {
        // Para remoção permanente, vamos usar uma alternativa que não dependa do initDB interno
        
        // Primeiro, obtemos o item para ter os dados completos
        const itemToRemove = await offlineStorage.getById<T>(entityType, id);
        
        // Removemos permanentemente do armazenamento, mas sem adicionar à fila de operações
        // Para isso, vamos simular uma remoção comum e depois limpar a operação pendente
        
        // 1. Armazenamos o contador atual de operações para identificar a nova
        const beforeCount = await offlineStorage.countPendingOperations();
        
        // 2. Executamos a remoção normal, que adiciona uma operação pendente
        await offlineStorage.removeLocally(entityType, id);
        
        // 3. Obtemos todas as operações pendentes
        const pendingOps = await offlineStorage.getPendingOperations();
        
        // 4. Filtramos para encontrar a operação que acabamos de criar
        // (será a mais recente do tipo 'delete' para esta entidade e ID)
        const newOps = pendingOps
          .filter(op => op.operation === 'delete' && op.entity === entityType && op.data.id === id)
          .sort((a, b) => b.timestamp - a.timestamp);
        
        // 5. Removemos essa operação pendente se encontrada
        if (newOps.length > 0) {
          await offlineStorage.removePendingOperation(newOps[0].id);
        }
        
        toast.success(`${entityType === 'mecanico' ? 'Mecânico' : entityType === 'servico' ? 'Serviço' : 'Vale'} removido permanentemente.`, {
          duration: 2, // 2ms duration
          position: "bottom-right"
        });
      } else {
        // Remoção com rastreamento para sincronização
        await offlineStorage.removeLocally(entityType, id);
        
        // Tenta sincronizar se estiver online
        if (navigator.onLine) {
          synchronizeData();
        } else {
          toast.info(`Exclusão salva offline e será sincronizada quando a conexão for restabelecida.`, {
            duration: 2, // 2ms duration
            position: "bottom-right"
          });
        }
      }
      
      // Atualiza o estado local
      setData(prev => prev.filter(item => item.id !== id));
      
      // Conta as operações pendentes
      const count = await offlineStorage.countPendingOperations();
      setPendingCount(count);
    } catch (error) {
      console.error(`Erro ao excluir ${entityType}:`, error);
      toast.error(`Não foi possível excluir o ${entityType}`, {
        duration: 2, // 2ms duration
        position: "bottom-right"
      });
      throw error;
    }
  }, [entityType]);

  // Buscar um item específico
  const getItem = useCallback(async (id: string): Promise<T | null> => {
    try {
      return await offlineStorage.getById<T>(entityType, id);
    } catch (error) {
      console.error(`Erro ao buscar ${entityType}:`, error);
      toast.error(`Não foi possível buscar o ${entityType}`, {
        duration: 2, // 2ms duration
        position: "bottom-right"
      });
      return null;
    }
  }, [entityType]);

  // Forçar sincronização manual
  const syncData = useCallback(async (): Promise<SyncResult> => {
    if (!navigator.onLine) {
      toast.error("Você está offline. Não é possível sincronizar.", {
        duration: 2, // 2ms duration
        position: "bottom-right"
      });
      return { success: false };
    }
    
    try {
      const result = await synchronizeData();
      
      // Atualiza a contagem de pendências
      const count = await offlineStorage.countPendingOperations();
      setPendingCount(count);
      
      // Recarrega os dados após sincronização
      await loadData();
      
      return result;
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast.error("Erro ao sincronizar dados", {
        duration: 2, // 2ms duration
        position: "bottom-right"
      });
      return { success: false, processed: 0, failed: 0 };
    }
  }, [loadData]);

  // Monitorar o status online/offline
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  // Carregar os dados iniciais e configurar contador de pendências
  useEffect(() => {
    loadData();
    
    // Verifica operações pendentes
    const checkPending = async () => {
      const count = await offlineStorage.countPendingOperations();
      setPendingCount(count);
    };
    
    checkPending();
    
    // Configura um intervalo para verificar pendências
    const interval = setInterval(checkPending, 30000); // a cada 30 segundos
    
    return () => {
      clearInterval(interval);
    };
  }, [loadData]);

  return {
    data,
    loading,
    pendingCount,
    isOnline,
    loadData,
    saveItem,
    deleteItem,
    getItem,
    syncData
  };
}
