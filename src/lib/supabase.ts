import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface Product {
  id: string;
  name: string;
  category: string;
  offers: number;
  description: string;
  price: number;
  image_url: string;
  is_trending: boolean;
  is_active: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  last_order_at: string | null;
}

export interface Order {
  id: string;
  customer_id: string | null;
  product_id: string | null;
  quantity: number;
  total_amount: number;
  status: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  customer?: Customer;
}
