import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSiteEditorDraftSession } from '@/features/site-editor/lib/useSiteEditorDraftSession';

describe('useSiteEditorDraftSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('autosaves draft changes and marks the session as saved', async () => {
    const save = vi.fn(async (value: string) => ({
      ok: true as const,
      persisted: value,
    }));

    const { result } = renderHook(() =>
      useSiteEditorDraftSession({
        resetKey: 'page-1',
        initialValue: 'Original title',
        serialize: (value) => value,
        save,
        autosaveMs: 300,
      }),
    );

    act(() => {
      result.current.setDraft('Updated title');
    });

    expect(result.current.saveState).toBe('dirty');
    expect(result.current.hasPendingChanges).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledWith('Updated title');
    expect(result.current.draft).toBe('Updated title');
    expect(result.current.hasPendingChanges).toBe(false);
    expect(['saved', 'idle']).toContain(result.current.saveState);
  });

  it('queues newer edits while a save is already in flight', async () => {
    let resolveFirstSave:
      | ((value: { ok: true; persisted: string }) => void)
      | undefined;

    const save = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<{ ok: true; persisted: string }>((resolve) => {
            resolveFirstSave = resolve;
          }),
      )
      .mockImplementationOnce(async (value: string) => ({
        ok: true as const,
        persisted: value,
      }));

    const { result } = renderHook(() =>
      useSiteEditorDraftSession({
        resetKey: 'section-hero',
        initialValue: 'First headline',
        serialize: (value) => value,
        save,
        autosaveMs: -1,
      }),
    );

    act(() => {
      result.current.setDraft('Second headline');
    });

    await act(async () => {
      void result.current.saveNow();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.saveState).toBe('saving');

    act(() => {
      result.current.setDraft('Third headline');
    });

    await act(async () => {
      resolveFirstSave?.({ ok: true, persisted: 'Second headline' });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenNthCalledWith(2, 'Third headline');
    expect(result.current.draft).toBe('Third headline');
    expect(result.current.hasPendingChanges).toBe(false);
    expect(['saved', 'idle']).toContain(result.current.saveState);
  });
});
