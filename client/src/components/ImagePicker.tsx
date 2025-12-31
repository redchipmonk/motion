/**
 * @file Image upload component with drag-and-drop reordering.
 * 
 * Supports single or multiple image uploads with preview thumbnails.
 * In 'stack' mode, allows drag-and-drop reordering of images.
 * Optional decorative circles for visual appeal on empty state.
 * 
 * @example
 * <ImagePicker images={files} onChange={setFiles} multiple mode="stack" />
 */

import { useRef, useState, useEffect, type ChangeEvent, type DragEvent } from "react";
import { GoPlus } from "react-icons/go";

interface ImagePickerProps {
  /** Optional label displayed above the picker */
  label?: string;
  /** Currently selected image files (controlled component) */
  images: File[];
  /** Callback fired when images change (add, remove, or reorder) */
  onChange: (files: File[]) => void;
  /** Allow multiple image selection */
  multiple?: boolean;
  /** Additional CSS classes for custom sizing */
  className?: string;
  /** Show decorative circles on empty state */
  withDecoration?: boolean;
  /** Layout mode: 'grid' for standard, 'stack' for vertical with drag-reorder */
  mode?: 'grid' | 'stack';
}

/**
 * Image picker component with preview and optional drag-and-drop reordering.
 * 
 * Modes:
 * - 'grid': Simple grid layout, click anywhere to add images
 * - 'stack': Vertical layout with dedicated add button and draggable thumbnails
 */
const ImagePicker = ({
  label,
  images,
  onChange,
  multiple = false,
  className = "",
  withDecoration = false,
  mode = 'grid'
}: ImagePickerProps) => {
  // Hidden file input ref - triggered programmatically
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Object URLs for image previews
  const [previews, setPreviews] = useState<string[]>([]);
  // Currently dragged image index (for reordering)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  /**
   * Syncs preview URLs when images prop changes.
   * Creates object URLs for thumbnails and revokes old ones to prevent memory leaks.
   */
  useEffect(() => {
    // Revoke old previews to avoid memory leaks
    previews.forEach((p) => URL.revokeObjectURL(p));

    // Create new previews from current images
    const newPreviews = images.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup: revoke URLs when component unmounts or images change
    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  /**
   * Handles file input change event.
   * Appends new files when multiple=true, replaces when single selection.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = multiple ? [...images, ...files] : files;
      onChange(newFiles);
    }
  };

  /**
   * Removes an image at the specified index.
   */
  const removeImage = (index: number) => {
    const newFiles = images.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  /** Programmatically opens the file picker dialog */
  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  // Drag and Drop Handlers
  // These enable reordering of images in 'stack' mode

  /**
   * Called when drag starts on an image.
   * Stores the index of the dragged item.
   */
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  /**
   * Called when dragging over a drop target.
   * Prevents default to allow drop.
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  /**
   * Called when dropping on a target.
   * Reorders the images array by moving dragged item to drop position.
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // Create new array with reordered items
    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    onChange(newImages);
    setDraggedIndex(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Optional Label */}
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {/* Hidden File Input - triggered by clicking picker area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Render Logic */}
      {mode === 'stack' && multiple ? (
        <div className="flex flex-col pt-4 space-y-4">
          {/* Add Button */}
          <div
            onClick={triggerPicker}
            className="relative z-50 flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:bg-gray-50 border-2 border-transparent"
            style={{ minHeight: withDecoration ? "200px" : undefined }}
          >
            {/* Decorative Circles */}
            {withDecoration && (
              <div className="absolute -bottom-24 -left-4 h-48 w-48 pointer-events-none opacity-50">
                <span className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[#EA580C]" />
                <span className="absolute left-8 -bottom-8 h-32 w-32 rounded-full bg-[#FACC15]" />
                <span className="absolute -left-2 -bottom-16 h-32 w-32 rounded-full bg-[#C084FC]" />
              </div>
            )}
            <GoPlus className="z-10 text-8xl text-motion-lilac" />
          </div>

          {/* Draggable Image Grid - scrollable container */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-80 pr-1 pb-4">
              {previews.map((src, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                  className={`group relative aspect-square w-full transition-all duration-200 ${draggedIndex === i ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'} cursor-grab active:cursor-grabbing`}
                >
                  <img
                    src={src}
                    alt={`Preview ${i}`}
                    className="h-full w-full rounded-xl object-cover shadow-sm border-2 border-transparent group-hover:border-motion-lilac"
                  />
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(i);
                    }}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Standard Grid / Single Mode
        // Click anywhere to open file picker
        <div
          onClick={triggerPicker}
          className={`relative flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-50 transition-colors hover:bg-gray-100 shadow-[0_4px_4px_rgba(0,0,0,0.15)] ${previews.length > 0 ? "border-none" : "border-2 border-transparent"}`}
          style={{ minHeight: withDecoration ? "460px" : undefined }}
        >
          {previews.length > 0 ? (
            // Show previews
            multiple ? (
              // Multiple: grid of thumbnails with add button
              <div className="grid w-full grid-cols-2 gap-2 p-2">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Preview ${i}`}
                    className="h-32 w-full object-cover rounded-lg"
                  />
                ))}
                <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100">
                  <GoPlus className="text-4xl text-motion-primary/50" />
                </div>
              </div>
            ) : (
              // Single: full-size preview
              <img
                src={previews[0]}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            )
          ) : (
            // Empty State
            <div className="relative flex h-full w-full flex-col items-center justify-center text-gray-400">
              {withDecoration && (
                <div className="absolute -bottom-44 -left-4 h-64 w-64 pointer-events-none">
                  {/* Orange circle - Back Left */}
                  <span className="absolute -left-12 -bottom-2 h-56 w-56 rounded-full bg-[#EA580C]" />
                  {/* Yellow circle - Back Right */}
                  <span className="absolute left-12 -bottom-16 h-56 w-56 rounded-full bg-[#FACC15]" />
                  {/* Purple circle - Front Center */}
                  <span className="absolute -left-4 -bottom-24 h-56 w-56 rounded-full bg-[#C084FC]" />
                </div>
              )}

              {/* Plus Icon - Centered */}
              <div className="z-10 flex items-center justify-center">
                <GoPlus className="text-9xl text-motion-purple/15" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImagePicker;
