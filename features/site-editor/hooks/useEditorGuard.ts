'use client';

import { useEffect, useRef, useState } from 'react';

export function useEditorGuard({ onLeaveWithoutSaving }: { onLeaveWithoutSaving: () => void }) {
  const [hasUnsavedInspectorChanges, setHasUnsavedInspectorChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);

  // Keep the callback stable across renders without making it a dependency.
  const onLeaveRef = useRef(onLeaveWithoutSaving);
  useEffect(() => {
    onLeaveRef.current = onLeaveWithoutSaving;
  });

  useEffect(() => {
    if (!hasUnsavedInspectorChanges) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedInspectorChanges]);

  function requestNavigation(action: () => void) {
    if (hasUnsavedInspectorChanges) {
      setPendingAction(() => action);
      setIsUnsavedDialogOpen(true);
      return;
    }
    action();
  }

  function handleStayWithUnsavedChanges() {
    setPendingAction(null);
    setIsUnsavedDialogOpen(false);
  }

  function handleLeaveWithUnsavedChanges() {
    const action = pendingAction;
    setPendingAction(null);
    setIsUnsavedDialogOpen(false);
    setHasUnsavedInspectorChanges(false);
    onLeaveRef.current();
    action?.();
  }

  return {
    hasUnsavedInspectorChanges,
    setHasUnsavedInspectorChanges,
    isUnsavedDialogOpen,
    requestNavigation,
    handleStayWithUnsavedChanges,
    handleLeaveWithUnsavedChanges,
  };
}
