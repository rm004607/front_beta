import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Star, StarOff, ChevronLeft, ChevronRight, AlertCircle, RotateCcw, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_FILES = 8;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface ServicePhotoGalleryProps {
  serviceId: string;
  /** Callback que recibe el FormData con las fotos listas para enviar */
  onUpload: (serviceId: string, formData: FormData) => Promise<void>;
}

async function validateImage(file: File): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Formato no válido (${file.type}). Solo JPG, PNG o WebP.`;
  }
  if (file.size > MAX_BYTES) {
    return `La imagen supera 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
        resolve(`Resolución mínima ${MIN_WIDTH}×${MIN_HEIGHT}px. Esta imagen es ${img.naturalWidth}×${img.naturalHeight}px.`);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve('No se pudo leer la imagen.'); };
    img.src = url;
  });
}

export function ServicePhotoGallery({ serviceId, onUpload }: ServicePhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const available = MAX_FILES - photos.length;
    if (available <= 0) {
      setGlobalErrors((e) => [...e, `Máximo ${MAX_FILES} imágenes.`]);
      return;
    }
    const toProcess = arr.slice(0, available);
    const skipped = arr.length - toProcess.length;

    const newErrors: string[] = [];
    if (skipped > 0) newErrors.push(`Solo se agregaron ${toProcess.length} imagen(es). Límite: ${MAX_FILES}.`);

    const items: PhotoItem[] = [];
    for (const file of toProcess) {
      const err = await validateImage(file);
      if (err) {
        newErrors.push(`"${file.name}": ${err}`);
        continue;
      }
      items.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        isPrimary: photos.length === 0 && items.length === 0,
        status: 'pending',
        progress: 0,
      });
    }
    if (newErrors.length) setGlobalErrors(newErrors);
    if (items.length) setPhotos((p) => [...p, ...items]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const remove = (id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length && !next.some((p) => p.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  };

  const setPrimary = (id: string) => {
    setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === id })));
  };

  const move = (id: string, dir: -1 | 1) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  // HTML5 drag-to-reorder
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    setPhotos((prev) => {
      const from = prev.findIndex((p) => p.id === draggedId);
      const to = prev.findIndex((p) => p.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };
  const handleDragEnd = () => setDraggedId(null);

  const retryPhoto = (id: string) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, status: 'pending', error: undefined, progress: 0 } : p));
  };

  const handleUpload = async () => {
    const pending = photos.filter((p) => p.status === 'pending' || p.status === 'error');
    if (!pending.length) return;

    setIsUploading(true);
    const formData = new FormData();

    // Marcar todas como uploading
    setPhotos((prev) => prev.map((p) =>
      (p.status === 'pending' || p.status === 'error') ? { ...p, status: 'uploading', progress: 10 } : p
    ));

    // Simular progreso mientras sube
    const progressInterval = setInterval(() => {
      setPhotos((prev) => prev.map((p) =>
        p.status === 'uploading' ? { ...p, progress: Math.min(p.progress + 15, 85) } : p
      ));
    }, 400);

    photos.forEach((p, i) => {
      formData.append('photos', p.file);
      formData.append(`sort_order_${i}`, String(i));
      if (p.isPrimary) formData.append('primary_index', String(i));
    });

    try {
      await onUpload(serviceId, formData);
      clearInterval(progressInterval);
      setPhotos((prev) => prev.map((p) =>
        p.status === 'uploading' ? { ...p, status: 'done', progress: 100 } : p
      ));
    } catch (err: any) {
      clearInterval(progressInterval);
      setPhotos((prev) => prev.map((p) =>
        p.status === 'uploading' ? { ...p, status: 'error', progress: 0, error: err?.message || 'Error al subir' } : p
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = photos.filter((p) => p.status === 'pending' || p.status === 'error').length;
  const errorPhotos = photos.filter((p) => p.status === 'error');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all select-none',
          isDraggingOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
          photos.length >= MAX_FILES && 'opacity-50 pointer-events-none',
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <ImagePlus size={22} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {isDraggingOver ? 'Suelta aquí' : 'Arrastra imágenes o haz clic'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG o WebP · Máx. 5MB por imagen · Mín. 800×600px · Hasta {MAX_FILES} fotos
          </p>
        </div>
        {photos.length > 0 && (
          <p className="text-xs text-muted-foreground">{photos.length}/{MAX_FILES} imágenes</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Estado vacío */}
      {photos.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-2 italic">
          Aún no hay fotos. Sube hasta {MAX_FILES} imágenes que muestren tu servicio.
        </p>
      )}

      {/* Grid de previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(photo.id)}
              onDragOver={(e) => handleDragOver(e, photo.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative group rounded-2xl overflow-hidden border-2 transition-all bg-muted cursor-grab active:cursor-grabbing',
                photo.isPrimary ? 'border-primary shadow-md shadow-primary/20' : 'border-border',
                draggedId === photo.id && 'opacity-50 scale-95',
                photo.status === 'error' && 'border-destructive',
              )}
            >
              <div className="aspect-square">
                <img src={photo.preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
              </div>

              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                {photo.status !== 'done' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPrimary(photo.id)}
                      title={photo.isPrimary ? 'Portada principal' : 'Marcar como portada'}
                      className="p-1.5 rounded-full bg-white/90 text-yellow-600 hover:bg-white transition-colors"
                    >
                      {photo.isPrimary ? <Star size={14} className="fill-yellow-500" /> : <StarOff size={14} />}
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(photo.id, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-full bg-white/90 text-foreground hover:bg-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(photo.id, 1)}
                        disabled={idx === photos.length - 1}
                        className="p-1.5 rounded-full bg-white/90 text-foreground hover:bg-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </>
                )}
                {photo.status !== 'done' && (
                  <button
                    type="button"
                    onClick={() => remove(photo.id)}
                    className="p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
                {photo.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => retryPhoto(photo.id)}
                    className="p-1.5 rounded-full bg-white/90 text-primary hover:bg-white transition-colors"
                    title="Reintentar"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Badges de estado */}
              {photo.isPrimary && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  <Star size={8} className="fill-white" />
                  Portada
                </div>
              )}
              {photo.status === 'done' && (
                <div className="absolute top-1.5 right-1.5 bg-secondary text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  ✓ Subida
                </div>
              )}
              {photo.status === 'error' && (
                <div className="absolute bottom-0 inset-x-0 bg-destructive/90 text-white text-[9px] font-medium px-2 py-1 text-center truncate">
                  Error — toca para reintentar
                </div>
              )}

              {/* Progress bar */}
              {photo.status === 'uploading' && (
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/30">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${photo.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Errores globales de validación */}
      {globalErrors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-destructive text-sm font-bold">
            <AlertCircle size={16} />
            <span>No se pudieron agregar algunas imágenes:</span>
          </div>
          <ul className="space-y-1">
            {globalErrors.map((err, i) => (
              <li key={i} className="text-xs text-destructive/80 ml-6">· {err}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setGlobalErrors([])}
            className="text-xs text-muted-foreground hover:text-foreground ml-6 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Errores de upload por foto */}
      {errorPhotos.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-destructive text-sm font-bold">
            <AlertCircle size={16} />
            <span>Error al subir {errorPhotos.length} imagen(es):</span>
          </div>
          {errorPhotos.map((p) => (
            <div key={p.id} className="flex items-center gap-2 ml-6">
              <span className="text-xs text-destructive/80 truncate flex-1">· {p.file.name}: {p.error}</span>
              <button
                type="button"
                onClick={() => retryPhoto(p.id)}
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
              >
                <RotateCcw size={11} />
                Reintentar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón de subida */}
      {photos.length > 0 && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || pendingCount === 0}
          className="w-full h-12 rounded-xl font-bold"
        >
          {isUploading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Subiendo...
            </>
          ) : pendingCount > 0 ? (
            <>
              <Upload size={18} className="mr-2" />
              Subir {pendingCount} foto{pendingCount !== 1 ? 's' : ''}
            </>
          ) : (
            'Todas las fotos subidas ✓'
          )}
        </Button>
      )}
    </div>
  );
}
