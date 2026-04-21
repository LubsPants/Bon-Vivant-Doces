import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { INITIAL_STATE, normalizeAppState } from '../lib/appState';
import { APP_STATE_ROW_ID, APP_STATE_TABLE, isSupabaseConfigured, supabase } from '../lib/supabase';
import { AppState } from '../types';

type SyncStatus = 'loading' | 'ready' | 'saving' | 'error' | 'setup_required';

const SAVE_DEBOUNCE_MS = 600;

async function persistAppState(state: AppState) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from(APP_STATE_TABLE).upsert({
    id: APP_STATE_ROW_ID,
    state,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export function useSupabaseAppState() {
  const [state, internalSetState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? 'loading' : 'setup_required'
  );
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      setSyncStatus('setup_required');
      return undefined;
    }

    let cancelled = false;

    async function loadAppState() {
      setIsLoading(true);
      setSyncStatus('loading');
      setError(null);

      const { data, error: fetchError } = await supabase
        .from(APP_STATE_TABLE)
        .select('state')
        .eq('id', APP_STATE_ROW_ID)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (fetchError) {
        setError('Nao foi possivel carregar os dados do Supabase.');
        setSyncStatus('error');
        setIsLoading(false);
        return;
      }

      if (data?.state) {
        skipNextSaveRef.current = true;
        internalSetState(normalizeAppState(data.state));
      } else {
        try {
          await persistAppState(INITIAL_STATE);
        } catch (saveError) {
          console.error(saveError);
          setError('Nao foi possivel criar o primeiro registro no Supabase.');
          setSyncStatus('error');
          setIsLoading(false);
          return;
        }
      }

      hasLoadedRef.current = true;
      setSyncStatus('ready');
      setIsLoading(false);
    }

    void loadAppState();

    return () => {
      cancelled = true;

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !hasLoadedRef.current) {
      return undefined;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return undefined;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          setSyncStatus('saving');
          setError(null);
          await persistAppState(state);
          setSyncStatus('ready');
        } catch (saveError) {
          console.error(saveError);
          setError('Nao foi possivel salvar os dados no Supabase.');
          setSyncStatus('error');
        }
      })();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);

  const setState: React.Dispatch<React.SetStateAction<AppState>> = value => {
    internalSetState(previousState => (
      typeof value === 'function'
        ? (value as (prevState: AppState) => AppState)(previousState)
        : value
    ));
  };

  return {
    state,
    setState,
    isLoading,
    isConfigured: isSupabaseConfigured,
    syncStatus,
    error,
  };
}
