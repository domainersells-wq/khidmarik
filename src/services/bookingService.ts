import { supabase } from '@/lib/supabase';
import type { Appointment } from '@/types';
import { notificationService } from '@/services/notificationService';

export const bookingService = {
  /**
   * Fetch appointments for a user (either patient/customer or professional/provider)
   */
  async getAppointments(userId: string, isProvider: boolean = false): Promise<Appointment[]> {
    const column = isProvider ? 'provider_id' : 'customer_id';

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:profiles!appointments_customer_id_fkey(name, avatar_url),
        provider:profiles!appointments_provider_id_fkey(name, avatar_url, role)
      `)
      .eq(column, userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    const extractLocation = (notes?: string): string => {
      if (!notes) return '';
      const match = notes.match(/Location:\s*([^\n]+)/);
      return match ? match[1].trim() : '';
    };

    return data.map((apt: any) => ({
      reservationId: apt.id,
      professionalId: apt.provider_id,
      professionalName: apt.provider?.name || 'Professional',
      professionalCategory: apt.provider?.role || 'Service Provider',
      clinicLogoUrl: apt.provider?.avatar_url || 'https://placehold.co/100x100.png',
      date: apt.date,
      timeSlot: apt.time_slot,
      patientName: apt.patient_name,
      reasonForVisit: apt.reason_for_visit,
      status: apt.status,
      notes: apt.notes,
      location: extractLocation(apt.notes)
    }));
  },

  /**
   * Create a new appointment
   */
  async createAppointment(appointment: {
    customerId: string;
    providerId: string;
    date: string;
    timeSlot: string;
    patientName: string;
    reasonForVisit: string;
    notes?: string;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        customer_id: appointment.customerId,
        provider_id: appointment.providerId,
        date: appointment.date,
        time_slot: appointment.timeSlot,
        patient_name: appointment.patientName,
        reason_for_visit: appointment.reasonForVisit,
        notes: appointment.notes || null,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Notify provider of new booking
    await notificationService.sendNotification({
      userId: appointment.providerId,
      type: 'booking_created',
      title: 'New Service Booking Received',
      message: `A new appointment was booked by ${appointment.patientName} for ${appointment.date} at ${appointment.timeSlot}.`,
      data: {
        referenceId: data.id,
        bookingId: data.id,
        actionUrl: '/dashboard/professional-services'
      }
    });

    // Also send confirmation notification to customer
    await notificationService.sendNotification({
      userId: appointment.customerId,
      type: 'booking_confirmed',
      title: 'Service Booking Confirmed!',
      message: `Your booking for "${appointment.reasonForVisit}" on ${appointment.date} at ${appointment.timeSlot} is confirmed.`,
      data: {
        referenceId: data.id,
        bookingId: data.id,
        actionUrl: '/profile'
      }
    });

    return data;
  },

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(id: string, status: 'confirmed' | 'completed' | 'cancelled'): Promise<void> {
    const { data: currentApt } = await supabase
      .from('appointments')
      .select('customer_id, provider_id, reason_for_visit, date')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(error.message);

    // Send status update notification
    if (currentApt?.customer_id) {
      const type = status === 'cancelled' ? 'booking_cancelled' : 'booking_confirmed';
      const title = status === 'cancelled' ? 'Service Booking Cancelled' : `Service Booking ${status}`;

      await notificationService.sendNotification({
        userId: currentApt.customer_id,
        type,
        title,
        message: `Your booking on ${currentApt.date} for "${currentApt.reason_for_visit}" status is now: ${status}.`,
        data: {
          referenceId: id,
          bookingId: id,
          status,
          actionUrl: '/profile'
        }
      });
    }
  }
};
