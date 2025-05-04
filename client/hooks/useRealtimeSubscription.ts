"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  supabase,
  REALTIME_EVENTS,
  RealtimePostEvent,
  RealtimeEventType,
} from "@/lib/supabase";
import { useAuth } from "./useAuth";

type EventCallback<T> = (payload: T) => void;
type EventUnsubscribe = () => void;

const REALTIME_CHANNEL = "post-events";

export function useRealtimeSubscription(clientType: "USER" | "ADMIN") {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const eventCallbacksRef = useRef<Map<string, Set<EventCallback<any>>>>(
    new Map()
  );

  // Initialize the channel when the hook is mounted
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(REALTIME_CHANNEL);

    channel
      .on("presence", { event: "sync" }, () => {
        setIsConnected(true);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("Realtime users joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("Realtime users left:", leftPresences);
      })
      .on("broadcast", { event: REALTIME_EVENTS.NEW_POST }, (payload) => {
        triggerCallbacks(REALTIME_EVENTS.NEW_POST, payload.payload);
      })
      .on("broadcast", { event: REALTIME_EVENTS.POST_REVIEWED }, (payload) => {
        triggerCallbacks(REALTIME_EVENTS.POST_REVIEWED, payload.payload);
      })
      .on("broadcast", { event: REALTIME_EVENTS.POST_APPROVED }, (payload) => {
        triggerCallbacks(REALTIME_EVENTS.POST_APPROVED, payload.payload);
      })
      .on("broadcast", { event: REALTIME_EVENTS.POST_REJECTED }, (payload) => {
        triggerCallbacks(REALTIME_EVENTS.POST_REJECTED, payload.payload);
      })
      .on("broadcast", { event: REALTIME_EVENTS.POST_REMOVED }, (payload) => {
        triggerCallbacks(REALTIME_EVENTS.POST_REMOVED, payload.payload);
      });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track user presence with their role in the channel
        const presenceTrackStatus = await channel.track({
          user_id: user.id,
          client_type: clientType,
          online_at: new Date().toISOString(),
        });

        console.log("Presence track status:", presenceTrackStatus);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    });

    // Store the channel reference
    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        setIsConnected(false);
      }
    };
  }, [user, clientType]);

  // Helper function to trigger callbacks for a specific event
  const triggerCallbacks = (eventType: string, payload: any) => {
    const callbacks = eventCallbacksRef.current.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error executing callback for ${eventType}:`, error);
        }
      });
    }
  };

  // Function to emit a new post event
  const emitNewPost = useCallback(
    (post: RealtimePostEvent) => {
      if (!channelRef.current || !isConnected) {
        console.error("Cannot emit event: channel not connected");
        return;
      }

      channelRef.current.send({
        type: "broadcast",
        event: REALTIME_EVENTS.NEW_POST,
        payload: post,
      });
    },
    [isConnected]
  );

  // Generic function to subscribe to events
  const onEvent = useCallback(
    <T = any>(
      eventType: RealtimeEventType,
      callback: EventCallback<T>
    ): EventUnsubscribe => {
      if (!eventCallbacksRef.current.has(eventType)) {
        eventCallbacksRef.current.set(eventType, new Set());
      }

      const callbackSet = eventCallbacksRef.current.get(eventType)!;
      callbackSet.add(callback as EventCallback<any>);

      // Return unsubscribe function
      return () => {
        const callbackSet = eventCallbacksRef.current.get(eventType);
        if (callbackSet) {
          callbackSet.delete(callback as EventCallback<any>);
        }
      };
    },
    []
  );

  return {
    isConnected,
    emitNewPost,
    onEvent,
  };
}
