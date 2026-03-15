import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from './useOnlineStatus';
import {
  addPendingIdentification,
  getPendingIdentifications,
  getAllPendingIdentifications,
  updatePendingStatus,
  removePendingIdentification,
  PendingIdentification,
} from '@/lib/offline-db';
import { useToast } from '@/hooks/use-toast';

export function useOfflineQueue() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const { toast } = useToast();

  const refreshCount = useCallback(async () => {
    try {
      const all = await getAllPendingIdentifications();
      setPendingCount(all.length);
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  // Queue a new identification
  const queueIdentification = useCallback(async (
    imageData: string,
    coordinates: { latitude: number; longitude: number } | null
  ) => {
    const id = await addPendingIdentification(imageData, coordinates);
    await refreshCount();
    toast({
      title: "📷 Queued for identification",
      description: "Your photo will be identified when you're back online.",
    });
    return id;
  }, [refreshCount, toast]);

  // Process the queue
  const processQueue = useCallback(async () => {
    if (processingRef.current || !navigator.onLine) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const pending = await getPendingIdentifications();
      if (pending.length === 0) {
        setIsProcessing(false);
        processingRef.current = false;
        return;
      }

      for (const item of pending) {
        if (!navigator.onLine) break;

        try {
          await updatePendingStatus(item.id, 'processing');

          const { data, error } = await supabase.functions.invoke('identify-species', {
            body: {
              imageData: item.imageData,
              coordinates: item.coordinates,
            },
          });

          if (error || data?.error) {
            const msg = data?.error || error?.message || '';
            const isNoOrganism = msg.toLowerCase().includes('no living organism');
            
            if (isNoOrganism) {
              // Remove from queue - not retryable
              await removePendingIdentification(item.id);
              toast({
                title: "Queued photo processed",
                description: "No living organism was found in one of your queued photos.",
              });
            } else {
              await updatePendingStatus(item.id, item.retryCount >= 2 ? 'failed' : 'pending');
            }
          } else {
            // Success - remove from queue
            await removePendingIdentification(item.id);
            toast({
              title: "✅ Queued species identified!",
              description: `Found: ${data.name}`,
            });
          }
        } catch (err) {
          console.error('Error processing queued item:', err);
          await updatePendingStatus(item.id, 'pending');
        }
      }
    } finally {
      await refreshCount();
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [toast, refreshCount]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Initial count
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return {
    isOnline,
    pendingCount,
    isProcessing,
    queueIdentification,
    processQueue,
    refreshCount,
  };
}
