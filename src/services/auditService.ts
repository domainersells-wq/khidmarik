import { supabase } from '@/lib/supabase';

export const auditService = {
  /**
   * Log an administrative or sensitive user action
   */
  async logAction(log: {
    userId?: string;
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
    entityType: string;
    description: string;
    oldValue?: any;
    newValue?: any;
  }): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: log.userId || null,
        action_type: log.actionType,
        entity_type: log.entityType,
        description: log.description,
        old_value: log.oldValue || null,
        new_value: log.newValue || null,
        ip_address: typeof window !== 'undefined' ? '127.0.0.1' : null, // Mock local IP for now
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      });

    if (error) {
      console.error('Failed to write audit log:', error);
    }
  },

  /**
   * Fetch audit logs (primarily for the Super Admin panel)
   */
  async getAuditLogs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    return data;
  }
};
