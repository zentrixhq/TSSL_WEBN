import { supabase } from './supabase';

// Get or create a session ID for cart
export function getSessionId(): string {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
}

function dispatchCartUpdate() {
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

// Add item to cart
export async function addToCart(offerId: string, quantity: number = 1) {
  const sessionId = getSessionId();

  try {
    // Check if item already exists in cart
    const { data: existing, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('offer_id', offerId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Update quantity if item exists
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existing.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          offer_id: offerId,
          quantity
        });

      if (insertError) throw insertError;
    }

    dispatchCartUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error };
  }
}

// Get cart items with offer details
export async function getCartItems() {
  const sessionId = getSessionId();

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product_offers (
          *,
          products (*)
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return { data: null, error };
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartItemId);

    if (error) throw error;
    dispatchCartUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { success: false, error };
  }
}

// Remove item from cart
export async function removeFromCart(cartItemId: string) {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
    dispatchCartUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, error };
  }
}

// Get cart count
export async function getCartCount() {
  const sessionId = getSessionId();

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('session_id', sessionId);

    if (error) throw error;

    const count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return { count, error: null };
  } catch (error) {
    console.error('Error getting cart count:', error);
    return { count: 0, error };
  }
}

// Clear cart
export async function clearCart() {
  const sessionId = getSessionId();

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
    dispatchCartUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error };
  }
}
