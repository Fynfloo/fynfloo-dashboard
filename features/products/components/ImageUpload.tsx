// features/products/components/ImageUpload.tsx
'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { Upload, X, GripVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/lib/types';

type Props = {
  images: ProductImage[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  onReorder: (images: { id: string; position: number }[]) => Promise<void>;
  disabled?: boolean;
};

type DragState = {
  draggingIndex: number;
  order: number[];
  cardWidth: number;
  cardHeight: number;
  offsetX: number;
  offsetY: number;
};

export function ImageUpload({ images, onUpload, onDelete, onReorder, disabled }: Props) {
  const uid = useId();
  const inputId = `image-upload-${uid}`;

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mainTooltipVisible, setMainTooltipVisible] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const [dragOrder, setDragOrder] = useState<number[] | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;
      setError('');
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError('Only JPEG, PNG and WebP images are allowed');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be under 5MB');
          return;
        }
      }
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          await onUpload(file);
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e?.message ?? 'Upload failed — please try again');
      } finally {
        setUploading(false);
      }
    },
    [onUpload, disabled],
  );

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function getCardIndexAtPoint(x: number, y: number): number {
    if (!gridRef.current) return -1;
    const cards = gridRef.current.querySelectorAll<HTMLElement>('[data-card-index]');
    let closest = -1;
    let closestDist = Infinity;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = Number(card.dataset.cardIndex);
      }
    });
    return closest;
  }

  function handlePointerDown(e: React.PointerEvent, index: number) {
    if (disabled || images.length <= 1) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const card =
      gridRef.current?.querySelectorAll<HTMLElement>('[data-card-index]')[
        images.findIndex((_, i) => i === index)
      ];
    const rect = card?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      draggingIndex: index,
      order: images.map((_, i) => i),
      cardWidth: rect.width,
      cardHeight: rect.height,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };

    setDraggingIndex(index);
    setDragOrder(images.map((_, i) => i));
    setFloatPos({ x: rect.left, y: rect.top });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    e.preventDefault();

    const { offsetX, offsetY, cardWidth, cardHeight } = dragRef.current;
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    setFloatPos({ x: newX, y: newY });

    // Find which slot the centre of the dragged card is nearest to
    const cardCentreX = newX + cardWidth / 2;
    const cardCentreY = newY + cardHeight / 2;
    const overOriginalIndex = getCardIndexAtPoint(cardCentreX, cardCentreY);

    if (overOriginalIndex !== -1 && overOriginalIndex !== dragRef.current.draggingIndex) {
      const currentOrder = dragRef.current.order;
      const dragPos = currentOrder.indexOf(dragRef.current.draggingIndex);
      const targetPos = currentOrder.indexOf(overOriginalIndex);

      if (dragPos !== targetPos) {
        const newOrder = [...currentOrder];
        newOrder.splice(dragPos, 1);
        newOrder.splice(targetPos, 0, dragRef.current.draggingIndex);
        dragRef.current.order = newOrder;
        setDragOrder([...newOrder]);
      }
    }
  }

  async function handlePointerUp(e: React.PointerEvent) {
    if (!dragRef.current) return;
    e.preventDefault();

    const finalOrder = dragRef.current.order;
    const originalOrder = images.map((_, i) => i);
    const changed = finalOrder.some((v, i) => v !== originalOrder[i]);

    dragRef.current = null;
    setDraggingIndex(null);
    setDragOrder(null);
    setFloatPos(null);

    if (!changed) return;

    const reordered = finalOrder.map((originalIndex, newPosition) => ({
      id: images[originalIndex].id,
      position: newPosition,
    }));

    try {
      await onReorder(reordered);
    } catch {
      setError('Failed to reorder images — please try again');
    }
  }

  function getCountText(): string {
    if (images.length === 0) return 'No images yet — add your first image';
    if (images.length === 1) return '1 image — add more to show different angles';
    if (images.length === 2) return '2 images — consider adding a detail shot';
    return `${images.length} images added`;
  }

  const displayOrder = dragOrder ?? images.map((_, i) => i);

  // Get card pixel size for the floating clone
  const firstCardRect = gridRef.current
    ?.querySelector<HTMLElement>('[data-card-index]')
    ?.getBoundingClientRect();
  const cardSize = firstCardRect
    ? { width: firstCardRect.width, height: firstCardRect.height }
    : { width: 80, height: 80 };

  return (
    <div className="space-y-3">
      <p
        className="text-xs"
        style={{ color: images.length === 0 ? 'var(--amber)' : 'var(--text-tertiary)' }}
      >
        {getCountText()}
      </p>

      <label
        htmlFor={inputId}
        onDrop={handleFileDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        className={cn(
          'flex flex-col items-center justify-center gap-2',
          'rounded-xl border-2 border-dashed p-8 transition-all duration-150',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        )}
        style={{
          borderColor: isDraggingOver ? 'var(--accent)' : 'var(--bg-border)',
          background: isDraggingOver ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        }}
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
        />
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-surface)' }}
        >
          {uploading ? (
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          ) : (
            <Upload
              className="h-5 w-5"
              style={{ color: isDraggingOver ? 'var(--accent)' : 'var(--text-tertiary)' }}
            />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {uploading
              ? 'Uploading…'
              : isDraggingOver
                ? 'Drop to upload'
                : 'Drop images here or click to upload'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            JPEG, PNG, WebP — max 5MB each
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Products with images convert significantly better
          </p>
        </div>
      </label>

      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--red)' }}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div ref={gridRef} className="grid grid-cols-4 gap-2" style={{ userSelect: 'none' }}>
          {displayOrder.map((originalIndex, displayPosition) => {
            const image = images[originalIndex];
            const isDragging = draggingIndex === originalIndex;
            const isFirst = displayPosition === 0;

            return (
              <div
                key={image.id}
                data-card-index={originalIndex}
                className="relative group rounded-lg overflow-hidden aspect-square"
                style={{
                  background: 'var(--bg-elevated)',
                  // Ghost placeholder where the card was
                  opacity: isDragging ? 0.25 : 1,
                  cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
                  // Other cards slide smoothly into new positions
                  transition: isDragging ? 'none' : 'opacity 0.2s ease',
                  touchAction: 'none',
                }}
                onPointerDown={(e) => handlePointerDown(e, originalIndex)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <img
                  src={image.url}
                  alt={image.alt ?? `Product image ${displayPosition + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                {!isDragging && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                  >
                    <div className="p-1.5 rounded-lg" style={{ color: 'white' }}>
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await onDelete(image.id);
                        } catch {
                          setError('Failed to delete image');
                        }
                      }}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'white' }}
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {isFirst && (
                  <div className="absolute top-1.5 left-1.5">
                    <div
                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                      onMouseEnter={() => setMainTooltipVisible(true)}
                      onMouseLeave={() => setMainTooltipVisible(false)}
                    >
                      Main
                    </div>
                    {mainTooltipVisible && (
                      <div
                        className="absolute top-7 left-0 w-44 px-2.5 py-2 rounded-lg text-xs z-10 pointer-events-none"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--bg-border-subtle)',
                          boxShadow: 'var(--shadow-elevated)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Your main product image — shown on the listing page. Drag to reorder.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Floating clone — follows pointer exactly, rendered outside grid flow */}
          {draggingIndex !== null && floatPos && (
            <div
              className="fixed rounded-lg overflow-hidden pointer-events-none z-50"
              style={{
                left: floatPos.x,
                top: floatPos.y,
                width: cardSize.width,
                height: cardSize.height,
                boxShadow: '0 12px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
                transform: 'rotate(1.5deg) scale(1.04)',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
              }}
            >
              <img
                src={images[draggingIndex].url}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
