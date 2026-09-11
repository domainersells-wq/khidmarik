import { supabase } from '@/lib/supabase';
import type { OrderItem } from '@/types';
import { unifiedOrderService } from '@/services/unifiedOrderService';
import { notificationService } from '@/services/notificationService';

export interface OrderInput {
  customerId: string;
  storeId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress: string;
  paymentType: string;
  paymentStatus?: 'paid' | 'pending' | 'refunded';
  total: number;
  profit?: number;
  items: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    productImageUrl?: string;
    quantity: number;
    price: number;
  }>;
  customerNotes?: string;
}

export const orderService = {
  /**
   * Create an order with transactional stock deduction
   */
  async createOrder(order: OrderInput): Promise<any> {
    // 1. Insert the main order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: order.customerId,
        store_id: order.storeId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        shipping_address: order.shippingAddress,
        billing_address: order.billingAddress,
        payment_type: order.paymentType,
        payment_status: order.paymentStatus || 'pending',
        total: order.total,
        profit: order.profit || (order.total * 0.1), // Default 10% profit estimation
        status: 'pending',
        customer_notes: order.customerNotes,
        timeline_history: [{ status: 'pending', date: new Date().toISOString(), operator: 'System' }]
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // 2. Insert order items & update product variant stocks
    for (const item of order.items) {
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: item.productId,
          variant_id: item.variantId || null,
          product_name: item.productName,
          product_image_url: item.productImageUrl || null,
          quantity: item.quantity,
          price: item.price
        });

      if (itemError) {
        console.error('Error inserting order item:', itemError);
        throw new Error(itemError.message);
      }

      // Deduct stock from the database
      if (item.variantId) {
        // Fetch current stock
        const { data: variant, error: varError } = await supabase
          .from('product_variants')
          .select('stock')
          .eq('id', item.variantId)
          .single();

        if (!varError && variant) {
          const newStock = Math.max(0, variant.stock - item.quantity);
          await supabase
            .from('product_variants')
            .update({ 
              stock: newStock,
              status: newStock === 0 ? 'out_of_stock' : 'available'
            })
            .eq('id', item.variantId);
        }
      }
    }

    // 3. Create a transaction receipt forCCP or card payments
    if (order.paymentType === 'ccp' || order.paymentType === 'cib') {
      await supabase.from('transactions').insert({
        user_id: order.customerId,
        amount: order.total,
        method: order.paymentType,
        status: 'pending',
        transaction_code: `TXN-${orderData.id.slice(0, 8).toUpperCase()}`,
        type: 'payment'
      });
    }

    // 4. Create notification for vendor
    // We can query the store owner
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id, name')
      .eq('id', order.storeId)
      .single();

    if (store) {
      await notificationService.sendNotification({
        userId: store.owner_id,
        type: 'new_order',
        title: 'New Order Received!',
        message: `You received a new order of ${order.total} DA at your store "${store.name}".`,
        data: {
          referenceId: orderData.id,
          orderId: orderData.id,
          amount: order.total,
          customerName: order.customerName,
          actionUrl: '/profile?tab=orders'
        }
      });
    }

    return orderData;
  },

  /**
   * Get orders for a specific customer
   */
  async getCustomerOrders(customerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }

    return data;
  },

  /**
   * Get orders for a store owner (vendor panel)
   */
  async getStoreOrders(storeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching store orders:', error);
      return [];
    }

    return data;
  },

  /**
   * Update order status (pending -> processing -> completed)
   */
  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<void> {
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('timeline_history, customer_id')
      .eq('id', orderId)
      .single();

    const history = currentOrder?.timeline_history || [];
    const updatedHistory = [
      ...history,
      { status, date: new Date().toISOString(), operator: 'Store Manager' }
    ];

    const { error } = await supabase
      .from('orders')
      .update({
        status,
        timeline_history: updatedHistory,
        internal_notes: notes || null
      })
      .eq('id', orderId);

    if (error) throw new Error(error.message);

    // Notify customer about status change using appropriate event type
    if (currentOrder?.customer_id) {
      let notifType: 'order_accepted' | 'order_rejected' | 'order_cancelled' | 'new_order' = 'order_accepted';
      let title = `Order Status: ${status}`;
      
      if (status === 'accepted' || status === 'processing' || status === 'shipped') {
        notifType = 'order_accepted';
        title = `Order Accepted & In Progress`;
      } else if (status === 'rejected') {
        notifType = 'order_rejected';
        title = `Order Declined by Vendor`;
      } else if (status === 'cancelled') {
        notifType = 'order_cancelled';
        title = `Order Cancelled`;
      }

      await notificationService.sendNotification({
        userId: currentOrder.customer_id,
        type: notifType,
        title,
        message: `Your order #${orderId.slice(0, 8)} is now: ${status}.`,
        data: {
          referenceId: orderId,
          orderId,
          status,
          actionUrl: '/profile?tab=orders'
        }
      });
    }
  },

  /**
   * Fetch Store Analytics KPIs for Owner Dashboard
   */
  async getStoreAnalytics(storeId: string): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    pendingOrders: number;
    salesData: Array<{ name: string; sales: number }>;
    topProducts: Array<{ id: string; name: string; salesCount: number; revenue: number; imageUrl: string }>;
  }> {
    const orders = await this.getStoreOrders(storeId);

    let totalRevenue = 0;
    let totalProfit = 0;
    let pendingOrders = 0;

    const weekdaySalesMap: Record<string, number> = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };

    const productSalesMap: Record<string, { name: string; count: number; rev: number; img: string }> = {};

    orders.forEach((o) => {
      const revenue = parseFloat(o.total);
      const profit = parseFloat(o.profit || 0);

      if (o.status !== 'cancelled') {
        totalRevenue += revenue;
        totalProfit += profit;
      }
      if (o.status === 'pending') {
        pendingOrders += 1;
      }

      // Day of week sales grouping
      const date = new Date(o.created_at);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[date.getDay()];
      if (dayName in weekdaySalesMap && o.status !== 'cancelled') {
        weekdaySalesMap[dayName] += revenue;
      }

      // Group product sales count
      if (o.order_items && o.status !== 'cancelled') {
        o.order_items.forEach((item: any) => {
          if (!productSalesMap[item.product_id]) {
            productSalesMap[item.product_id] = {
              name: item.product_name,
              count: 0,
              rev: 0,
              img: item.product_image_url || 'https://placehold.co/40x40.png'
            };
          }
          productSalesMap[item.product_id].count += item.quantity;
          productSalesMap[item.product_id].rev += parseFloat(item.price) * item.quantity;
        });
      }
    });

    const salesData = Object.keys(weekdaySalesMap).map(day => ({
      name: day,
      sales: weekdaySalesMap[day]
    }));

    const topProducts = Object.keys(productSalesMap).map(pid => ({
      id: pid,
      name: productSalesMap[pid].name,
      salesCount: productSalesMap[pid].count,
      revenue: productSalesMap[pid].rev,
      imageUrl: productSalesMap[pid].img
    })).sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);

    return {
      totalRevenue,
      totalProfit,
      totalOrders: orders.length,
      pendingOrders,
      salesData,
      topProducts
    };
  }
};
