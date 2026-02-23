"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

type PostgresChangeFilter = {
  schema?: string;
  table: string;
  event?: RealtimeEvent;
  filter?: string;
};

/**
 * Subscribe to Supabase Realtime postgres_changes for a table.
 * Calls onPayload when changes occur. Cleans up on unmount.
 *
 * @param options.table - Table name (e.g. 'handover_logs', 'tasks')
 * @param options.event - Event type: 'INSERT' | 'UPDATE' | 'DELETE' | '*' (default: '*')
 * @param options.filter - Optional filter, e.g. 'case_id=eq.xxx'
 * @param onPayload - Callback when a change is received
 * @param channelId - Unique channel id to avoid conflicts when multiple subscriptions exist
 */
export function useRealtimeTable(
  options: PostgresChangeFilter,
  onPayload: () => void,
  channelId?: string
) {
  const { table, event = "*", schema = "public", filter } = options;
  const id = channelId ?? `realtime-${table}-${filter ?? "all"}`;
  const onPayloadRef = useRef(onPayload);
  onPayloadRef.current = onPayload;

  useEffect(() => {
    const config: {
      event: RealtimeEvent;
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema,
      table,
    };
    if (filter) config.filter = filter;

    const channel = supabase
      .channel(id)
      .on("postgres_changes", config, () => {
        onPayloadRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, table, event, schema, filter]);
}
