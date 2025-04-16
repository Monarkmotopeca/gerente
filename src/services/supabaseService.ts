
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface para o resultado da sincronização
export interface SyncResult {
  success: boolean;
  processed?: number;
  failed?: number;
}

/**
 * Salva um item no Supabase
 * @param table Nome da tabela no Supabase ('mecanicos', 'servicos', 'vales')
 * @param data Dados a serem salvos
 * @returns O item salvo com ID
 */
export async function saveItem<T extends { id?: string | null }>(
  table: 'mecanicos' | 'servicos' | 'vales',
  data: T
): Promise<T> {
  try {
    // Verifica se estamos inserindo ou atualizando
    const isNewItem = !data.id;
    
    // Remove o ID se for nulo ou undefined para permitir que o Supabase gere um novo
    const dataToSave = { ...data };
    if (isNewItem) {
      delete dataToSave.id;
    }
    
    let result;
    
    if (isNewItem) {
      // Inserção
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert(dataToSave)
        .select()
        .single();
        
      if (error) throw error;
      result = insertedData;
    } else {
      // Atualização
      const { data: updatedData, error } = await supabase
        .from(table)
        .update(dataToSave)
        .eq('id', data.id)
        .select()
        .single();
        
      if (error) throw error;
      result = updatedData;
    }
    
    return result as T;
  } catch (error) {
    console.error(`Erro ao salvar ${table}:`, error);
    throw error;
  }
}

/**
 * Obtém todos os registros de uma tabela
 * @param table Nome da tabela no Supabase
 * @returns Array com todos os registros
 */
export async function getAll<T>(table: 'mecanicos' | 'servicos' | 'vales'): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as T[];
  } catch (error) {
    console.error(`Erro ao obter registros de ${table}:`, error);
    throw error;
  }
}

/**
 * Busca um registro pelo ID
 * @param table Nome da tabela no Supabase
 * @param id ID do registro
 * @returns Registro encontrado ou null
 */
export async function getById<T>(
  table: 'mecanicos' | 'servicos' | 'vales',
  id: string
): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Código para "no rows returned"
        return null;
      }
      throw error;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Erro ao buscar ${table} com ID ${id}:`, error);
    throw error;
  }
}

/**
 * Remove um registro
 * @param table Nome da tabela no Supabase
 * @param id ID do registro a ser removido
 */
export async function removeItem(
  table: 'mecanicos' | 'servicos' | 'vales',
  id: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    console.error(`Erro ao remover ${table} com ID ${id}:`, error);
    throw error;
  }
}
