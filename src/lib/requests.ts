import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Coords } from '@/utils/geo';

export type RequestStatus = 'new' | 'accepted' | 'done' | 'cancelled';

export type ServiceRequest = {
  id: string;
  mechanic_id: string;
  mechanic_name: string;
  rider_phone: string | null;
  message: string | null;
  latitude: number | null;
  longitude: number | null;
  status: RequestStatus;
  created_at: string;
};

// Demo mode keeps requests on the device so the inbox can be tried without a backend.
const demoRequests: ServiceRequest[] = [];

/** Rider → shop: "I need help here". The database pushes the shop owner. */
export async function createServiceRequest(input: { mechanicId: string; mechanicName: string; message: string; location: Coords | null }) {
  if (!supabase) {
    demoRequests.unshift({
      id: `local-${Date.now()}`,
      mechanic_id: input.mechanicId,
      mechanic_name: input.mechanicName,
      rider_phone: '012000000',
      message: input.message || null,
      latitude: input.location?.latitude ?? null,
      longitude: input.location?.longitude ?? null,
      status: 'new',
      created_at: new Date().toISOString(),
    });
    return;
  }
  const { error } = await supabase.rpc('create_service_request', {
    p_mechanic_id: input.mechanicId,
    p_message: input.message || null,
    p_lat: input.location?.latitude ?? null,
    p_lng: input.location?.longitude ?? null,
  });
  if (error) throw error;
}

/** The mechanic's inbox: requests for every shop they own, newest first. */
export async function fetchMyRequests(): Promise<ServiceRequest[]> {
  if (!supabase) return [...demoRequests];
  const { data, error } = await supabase.rpc('my_requests');
  if (error) throw error;
  return (data ?? []) as ServiceRequest[];
}

export async function setRequestStatus(id: string, status: RequestStatus) {
  if (!supabase) {
    const r = demoRequests.find((x) => x.id === id);
    if (r) r.status = status;
    return;
  }
  const { error } = await supabase.rpc('set_request_status', { p_id: id, p_status: status });
  if (error) throw error;
}

const listeners = new Set<() => void>();
let channel: RealtimeChannel | null = null;

/** Calls back when any request the user may see changes (new request, status update). */
export function subscribeToRequestChanges(onChange: () => void) {
  const client = supabase;
  if (!client) return () => {};
  listeners.add(onChange);
  if (!channel) {
    channel = client
      .channel('service-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        listeners.forEach((listener) => listener());
      })
      .subscribe();
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && channel) {
      client.removeChannel(channel);
      channel = null;
    }
  };
}
