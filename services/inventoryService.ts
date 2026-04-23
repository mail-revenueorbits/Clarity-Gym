import { InventoryItem, InventorySale } from '../types';
import { supabase } from './supabase';

interface DbInventoryItem {
  id: string;
  name: string;
  category: 'Supplement' | 'Merchandise' | 'Beverage' | 'Other';
  quantity: number;
  price: number;
  purchase_price: number;
  created_at: string;
}

interface DbInventorySale {
  id: string;
  item_id: string;
  quantity: number;
  total_amount: number;
  method: string;
  date: string;
  created_at: string;
}

function dbToItem(row: DbInventoryItem): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    price: row.price,
    purchasePrice: row.purchase_price,
  };
}

function dbToSale(row: DbInventorySale): InventorySale {
  return {
    id: row.id,
    itemId: row.item_id,
    quantity: row.quantity,
    totalAmount: row.total_amount,
    date: row.date,
    method: row.method as any,
  };
}

export const inventoryService = {
  async fetchItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(dbToItem);
  },

  async fetchSales(): Promise<InventorySale[]> {
    const { data, error } = await supabase
      .from('inventory_sales')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(dbToSale);
  },

  async createItem(item: InventoryItem): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        purchase_price: item.purchasePrice,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToItem(data);
  },

  async updateItem(item: InventoryItem): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .update({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        purchase_price: item.purchasePrice,
      })
      .eq('id', item.id)
      .select()
      .single();
    if (error) throw error;
    return dbToItem(data);
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async recordSale(sale: InventorySale): Promise<InventorySale> {
    const { data, error } = await supabase
      .from('inventory_sales')
      .insert({
        id: sale.id,
        item_id: sale.itemId,
        quantity: sale.quantity,
        total_amount: sale.totalAmount,
        method: sale.method,
        date: sale.date,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToSale(data);
  },
};
