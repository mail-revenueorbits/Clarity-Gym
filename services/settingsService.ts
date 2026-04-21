import { supabase } from './supabase';

export interface PricingMatrix {
  [category: string]: {
    [duration: string]: number;
  };
}

export const settingsService = {
  async getPricingMatrix(): Promise<PricingMatrix> {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('id', 'pricing_matrix')
      .single();

    if (error) {
      console.error('Error fetching pricing matrix:', error);
      // Return a fallback if not found
      return {
        "Gym": { "1 Month": 2500, "3 Months": 6000, "6 Months": 12000, "1 Year": 18000 },
        "Gym + Cardio": { "1 Month": 3500, "3 Months": 8000, "6 Months": 15000, "1 Year": 24000 },
        "Gym + Cardio + PT": { "1 Month": 8000, "3 Months": 20000, "6 Months": 35000, "1 Year": 60000 }
      };
    }

    return data.value as PricingMatrix;
  },

  async updatePricingMatrix(matrix: PricingMatrix): Promise<void> {
    const { error } = await supabase
      .from('settings')
      .update({ value: matrix, updated_at: new Date().toISOString() })
      .eq('id', 'pricing_matrix');

    if (error) throw error;
  }
};
