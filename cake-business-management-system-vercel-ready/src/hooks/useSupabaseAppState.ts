import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { INITIAL_STATE, normalizeAppState } from '../lib/appState';
import { APP_STATE_ROW_ID, APP_STATE_TABLE, isSupabaseConfigured, supabase } from '../lib/supabase';
import { AppState } from '../types';

type SyncStatus = 'loading' | 'ready' | 'saving' | 'error' | 'setup_required';

const LOCAL_STATE_KEY = 'bon-vivant-app-state-cache';
const LOCAL_STATE_UPDATED_AT_KEY = 'bon-vivant-app-state-cache-updated-at';

function readLocalCache() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawState = window.localStorage.getItem(LOCAL_STATE_KEY);
    const rawUpdatedAt = window.localStorage.getItem(LOCAL_STATE_UPDATED_AT_KEY);

    if (!rawState) {
      return null;
    }

    return {
      state: normalizeAppState(JSON.parse(rawState)),
      updatedAt: rawUpdatedAt || null,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

function writeLocalCache(state: AppState, updatedAt: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
    window.localStorage.setItem(LOCAL_STATE_UPDATED_AT_KEY, updatedAt);
  } catch (error) {
    console.error(error);
  }
}

function getTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function persistAppState(state: AppState, updatedAt: string) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from(APP_STATE_TABLE).upsert({
    id: APP_STATE_ROW_ID,
    state,
    updated_at: updatedAt,
  });

  if (error) {
    throw error;
  }
}

export function useSupabaseAppState() {
  const localCache = readLocalCache();
  const [state, internalSetState] = useState<AppState>(localCache?.state ?? INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? 'loading' : 'setup_required'
  );
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const stateRef = useRef<AppState>(localCache?.state ?? INITIAL_STATE);
  const lastUpdatedAtRef = useRef<string>(localCache?.updatedAt ?? new Date().toISOString());

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

      const localState = readLocalCache();

      const { data, error: fetchError } = await supabase
        .from(APP_STATE_TABLE)
        .select('state, updated_at')
        .eq('id', APP_STATE_ROW_ID)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (fetchError) {
        if (localState) {
          skipNextSaveRef.current = true;
          internalSetState(localState.state);
          stateRef.current = localState.state;
          lastUpdatedAtRef.current = localState.updatedAt ?? new Date().toISOString();
          setSyncStatus('error');
          setError('Os dados locais foram carregados, mas a sincronizacao online falhou.');
          setIsLoading(false);
          hasLoadedRef.current = true;
          return;
        }

        setError('Nao foi possivel carregar os dados do Supabase.');
        setSyncStatus('error');
        setIsLoading(false);
        return;
      }

      const remoteState = data?.state ? normalizeAppState(data.state) : null;
      const remoteUpdatedAt = data?.updated_at ?? null;

      const localTimestamp = getTimestamp(localState?.updatedAt);
      const remoteTimestamp = getTimestamp(remoteUpdatedAt);

      if (localState && localTimestamp > remoteTimestamp) {
        skipNextSaveRef.current = true;
        internalSetState(localState.state);
        stateRef.current = localState.state;
        lastUpdatedAtRef.current = localState.updatedAt ?? new Date().toISOString();

        try {
          await persistAppState(localState.state, lastUpdatedAtRef.current);
          setSyncStatus('ready');
          setError(null);
        } catch (saveError) {
          console.error(saveError);
          setSyncStatus('error');
          setError('Os dados locais foram mantidos, mas ainda nao sincronizaram com o sistema.');
        }

        setIsLoading(false);
        hasLoadedRef.current = true;
        return;
      }

      if (remoteState) {
        skipNextSaveRef.current = true;
        internalSetState(remoteState);
        stateRef.current = remoteState;
        lastUpdatedAtRef.current = remoteUpdatedAt ?? new Date().toISOString();
        writeLocalCache(remoteState, lastUpdatedAtRef.current);
      } else {
        const createdAt = new Date().toISOString();

        try {
          await persistAppState(INITIAL_STATE, createdAt);
          lastUpdatedAtRef.current = createdAt;
          writeLocalCache(INITIAL_STATE, createdAt);
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
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !hasLoadedRef.current) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const updatedAt = new Date().toISOString();
    lastUpdatedAtRef.current = updatedAt;
    writeLocalCache(state, updatedAt);

    void (async () => {
      try {
        setSyncStatus('saving');
        setError(null);
        await persistAppState(state, updatedAt);
        setSyncStatus('ready');
      } catch (saveError) {
        console.error(saveError);
        setError('Os dados ficaram salvos neste aparelho, mas nao sincronizaram com o sistema.');
        setSyncStatus('error');
      }
    })();
  }, [state]);

  const setState: React.Dispatch<React.SetStateAction<AppState>> = value => {
    const nextState = typeof value === 'function'
      ? (value as (prevState: AppState) => AppState)(stateRef.current)
      : value;

    const updatedAt = new Date().toISOString();

    stateRef.current = nextState;
    lastUpdatedAtRef.current = updatedAt;
    writeLocalCache(nextState, updatedAt);
    internalSetState(nextState);
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
