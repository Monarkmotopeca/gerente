
import { toast } from "sonner";
import {
  getPendingOperations,
  removePendingOperation,
  OfflineOperation
} from "./offlineStorage";

// Simula um atraso para a API
const simulateApiDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Simula requisições para a API
const sendToApi = async (operation: OfflineOperation): Promise<boolean> => {
  // Em uma implementação real, aqui faríamos as chamadas para a API do backend
  await simulateApiDelay(300); // Simula tempo de resposta da API
  
  // Simulação de sucesso (95% das vezes) ou falha (5% das vezes)
  const success = Math.random() > 0.05;
  
  if (!success) {
    console.error(`Falha ao sincronizar: ${operation.entity} - ${operation.operation}`);
  }
  
  return success;
};

// Sincroniza os dados com o servidor
export const synchronizeData = async (): Promise<{ 
  success: boolean, 
  processed: number, 
  failed: number 
}> => {
  // Verifica se há conexão com a internet
  if (!navigator.onLine) {
    return { success: false, processed: 0, failed: 0 };
  }
  
  try {
    // Busca todas as operações pendentes
    const pendingOperations = await getPendingOperations();
    
    if (pendingOperations.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }
    
    let processed = 0;
    let failed = 0;
    
    // Exibe um toast de início
    const syncToast = toast.loading(`Sincronizando ${pendingOperations.length} alterações...`);
    
    // Processa cada operação sequencialmente
    for (const operation of pendingOperations) {
      try {
        const success = await sendToApi(operation);
        
        if (success) {
          // Remove a operação da fila
          await removePendingOperation(operation.id);
          processed++;
          
          // Atualiza o toast com o progresso
          toast.loading(`Sincronizando... (${processed}/${pendingOperations.length})`, {
            id: syncToast
          });
        } else {
          failed++;
        }
      } catch (error) {
        console.error("Erro ao sincronizar operação:", error);
        failed++;
      }
    }
    
    // Atualiza o toast final
    if (failed === 0) {
      toast.success(`Sincronização concluída! ${processed} alterações enviadas.`, {
        id: syncToast
      });
    } else {
      toast.error(`Sincronização parcial: ${failed} alterações não sincronizadas.`, {
        id: syncToast
      });
    }
    
    return {
      success: failed === 0,
      processed,
      failed
    };
  } catch (error) {
    console.error("Erro na sincronização:", error);
    toast.error("Erro ao sincronizar dados. Tente novamente mais tarde.");
    return { success: false, processed: 0, failed: 0 };
  }
};

// Verifica se há operações pendentes e as processa quando a conexão for restabelecida
export const setupSyncListener = () => {
  const handleOnline = async () => {
    try {
      const pendingOperations = await getPendingOperations();
      
      if (pendingOperations.length > 0) {
        toast.info(`Você está online novamente. Sincronizando ${pendingOperations.length} alterações...`);
        await synchronizeData();
      }
    } catch (error) {
      console.error("Erro ao verificar pendências:", error);
    }
  };
  
  window.addEventListener("online", handleOnline);
  
  // Retorna uma função para limpar o listener quando necessário
  return () => {
    window.removeEventListener("online", handleOnline);
  };
};
