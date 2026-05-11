'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

export type SiteEditorSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export type SiteEditorSaveResult<T> =
  | {
      ok: true;
      persisted?: T;
    }
  | {
      ok: false;
    };

type UseSiteEditorDraftSessionOptions<T> = {
  resetKey: string;
  initialValue: T;
  serialize: (value: T) => string;
  save: (value: T) => Promise<SiteEditorSaveResult<T>>;
  autosaveMs?: number;
};

type UseSiteEditorDraftSessionResult<T> = {
  draft: T;
  setDraft: Dispatch<SetStateAction<T>>;
  saveState: SiteEditorSaveState;
  hasUnsavedChanges: boolean;
  hasPendingChanges: boolean;
  saveNow: () => Promise<boolean>;
  replacePersisted: (nextValue: T) => void;
};

function valuesMatch<T>(serialize: (value: T) => string, left: T, right: T): boolean {
  return serialize(left) === serialize(right);
}

export function useSiteEditorDraftSession<T>({
  resetKey,
  initialValue,
  serialize,
  save,
  autosaveMs = 700,
}: UseSiteEditorDraftSessionOptions<T>): UseSiteEditorDraftSessionResult<T> {
  const [draft, setDraftState] = useState(initialValue);
  const [persisted, setPersistedState] = useState(initialValue);
  const [saveState, setSaveState] = useState<SiteEditorSaveState>('idle');

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const lastResetKeyRef = useRef(resetKey);
  const draftRef = useRef(initialValue);
  const persistedRef = useRef(initialValue);
  const serializeRef = useRef(serialize);

  useEffect(() => {
    serializeRef.current = serialize;
  }, [serialize]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const replacePersisted = useCallback((nextValue: T) => {
    draftRef.current = nextValue;
    persistedRef.current = nextValue;
    queuedRef.current = false;
    inFlightRef.current = false;
    setDraftState(nextValue);
    setPersistedState(nextValue);
    setSaveState('idle');
  }, []);

  useEffect(() => {
    if (lastResetKeyRef.current !== resetKey) {
      lastResetKeyRef.current = resetKey;
      replacePersisted(initialValue);
      return;
    }

    if (inFlightRef.current) {
      return;
    }

    if (!valuesMatch(serializeRef.current, draftRef.current, persistedRef.current)) {
      return;
    }

    replacePersisted(initialValue);
  }, [initialValue, replacePersisted, resetKey]);

  const hasUnsavedChanges = useMemo(
    () => !valuesMatch(serialize, draft, persisted),
    [draft, persisted, serialize],
  );

  const hasPendingChanges = hasUnsavedChanges || saveState === 'saving' || saveState === 'error';

  const setDraft = useCallback<Dispatch<SetStateAction<T>>>(
    (nextValue) => {
      setDraftState((current) => {
        const resolved =
          typeof nextValue === 'function'
            ? (nextValue as (value: T) => T)(current)
            : nextValue;

        draftRef.current = resolved;
        if (inFlightRef.current) {
          queuedRef.current = true;
        }

        return resolved;
      });
    },
    [],
  );

  useEffect(() => {
    if (saveState === 'saving' || saveState === 'error') {
      return;
    }

    if (hasUnsavedChanges) {
      setSaveState('dirty');
      return;
    }

    if (saveState === 'dirty') {
      setSaveState('idle');
    }
  }, [hasUnsavedChanges, saveState]);

  useEffect(() => {
    if (saveState !== 'saved') {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }

      if (!valuesMatch(serialize, draftRef.current, persistedRef.current)) {
        setSaveState('dirty');
        return;
      }

      setSaveState('idle');
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [saveState, serialize]);

  const saveNow = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return false;
    }

    if (valuesMatch(serialize, draftRef.current, persistedRef.current)) {
      setSaveState('idle');
      return true;
    }

    inFlightRef.current = true;
    let completedSuccessfully = true;

    try {
      do {
        queuedRef.current = false;
        const snapshot = draftRef.current;
        const snapshotSignature = serialize(snapshot);
        setSaveState('saving');

        const result = await save(snapshot);

        if (!mountedRef.current) {
          return false;
        }

        if (!result.ok) {
          setSaveState('error');
          completedSuccessfully = false;
          return false;
        }

        const nextPersisted = result.persisted ?? snapshot;
        persistedRef.current = nextPersisted;
        setPersistedState(nextPersisted);

        if (serialize(draftRef.current) === snapshotSignature) {
          draftRef.current = nextPersisted;
          setDraftState(nextPersisted);
        }

        if (valuesMatch(serialize, draftRef.current, persistedRef.current)) {
          setSaveState('saved');
        } else {
          setSaveState('dirty');
        }
      } while (
        queuedRef.current ||
        !valuesMatch(serialize, draftRef.current, persistedRef.current)
      );

      return true;
    } finally {
      inFlightRef.current = false;
      if (!completedSuccessfully && !valuesMatch(serialize, draftRef.current, persistedRef.current)) {
        setSaveState('error');
      }
    }
  }, [save, serialize]);

  useEffect(() => {
    if (autosaveMs < 0 || !hasUnsavedChanges || saveState === 'saving') {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveNow();
    }, autosaveMs);

    return () => window.clearTimeout(timer);
  }, [autosaveMs, draft, hasUnsavedChanges, saveNow, saveState]);

  return {
    draft,
    setDraft,
    saveState,
    hasUnsavedChanges,
    hasPendingChanges,
    saveNow,
    replacePersisted,
  };
}
