import { useRef, useState, useEffect, type ChangeEvent, type DragEvent } from "react";
import { GoPlus } from "react-icons/go";

interface ImagePickerProps {
  label?: string;
  images: File[];
  onChange: (files: File[]) => void;
  multiple?: boolean;
  className?: string; // For custom height/styles (e.g. header vs gallery)
  withDecoration?: boolean;
  mode?: 'grid' | 'stack'; // 'stack' is now the vertical draggable gallery
}

const ImagePicker = ({
  label,
  images,
  onChange,
  multiple = false,
  className = "",
  withDecoration = false,
  mode = 'grid'
}: ImagePickerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);



  // Sync previews when images prop changes
  useEffect(() => {
    // Revoke old previews to avoid memory leaks
    previews.forEach((p) => URL.revokeObjectURL(p));

    // Create new previews
    const newPreviews = images.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup function to revoke URLs when component unmounts or images change
    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = multiple ? [...images, ...files] : files;
      onChange(newFiles);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = images.filter((_, i) => i !== index)
    onChange(newFiles)
  }

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    onChange(newImages);
    setDraggedIndex(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* RENDER LOGIC */}
      {mode === 'stack' && multiple ? (
        <div className="flex flex-col pt-4 space-y-4">
          {/* 1. Add Button (Fixed Top) */}
          <div
            onClick={triggerPicker}
            className="relative z-50 flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:bg-gray-50 border-2 border-transparent"
            style={{ minHeight: withDecoration ? "200px" : undefined }}
          >
            {withDecoration && (
              <div className="absolute -bottom-24 -left-4 h-48 w-48 pointer-events-none opacity-50">
                <span className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-[#EA580C]" />
                <span className="absolute left-8 -bottom-8 h-32 w-32 rounded-full bg-[#FACC15]" />
                <span className="absolute -left-2 -bottom-16 h-32 w-32 rounded-full bg-[#C084FC]" />
              </div>
            )}
            <GoPlus className="z-10 text-8xl text-motion-lilac" />
          </div>

          {/* 2. Draggable Grid (Scrollable) */}
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
        <div
          onClick={triggerPicker}
          className={`relative flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-50 transition-colors hover:bg-gray-100 shadow-[0_4px_4px_rgba(0,0,0,0.15)] ${previews.length > 0 ? "border-none" : "border-2 border-transparent"
            }`}
          style={{ minHeight: withDecoration ? "460px" : undefined }}
        >
          {previews.length > 0 ? (
            multiple ? (
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
              <img
                src={previews[0]}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <div className="relative flex h-full w-full flex-col items-center justify-center text-gray-400">
              {withDecoration && (
                <div className="absolute -bottom-44 -left-4 h-64 w-64 pointer-events-none">
                  {/* Orange - Back Left */}
                  <span className="absolute -left-12 -bottom-2 h-56 w-56 rounded-full bg-[#EA580C]" />
                  {/* Yellow - Back Right */}
                  <span className="absolute left-12 -bottom-16 h-56 w-56 rounded-full bg-[#FACC15]" />
                  {/* Purple - Front Center */}
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
