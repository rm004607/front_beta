import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ImagePlus, Loader2, MapPin, MessageCircle, Sparkles, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { productsAPI, aiAPI, regionsAPI } from '@/lib/api';
import { loadRegionOptionsSorted, type RegionOption } from '@/lib/regions-catalog';
import { catalogFetchUserMessage } from '@/lib/catalog-fetch-errors';
import { PRODUCT_STATUS_OPTIONS, formatProductPrice } from '@/lib/productUtils';
import { isValidTextField, isValidPhone, validatePhone, sanitizeInput, getValidationErrorMessage } from '@/lib/input-validator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type DraftImage = {
  file: File;
  previewUrl: string;
};

function communesNamesFromApiResponse(
  rid: string,
  r: { region_id: number; communes: { name: string; region_id: number }[] }
): string[] | null {
  if (Number(r.region_id) !== Number(rid)) return null;
  const names = r.communes
    .filter((c) => Number(c.region_id) === Number(rid))
    .map((c) => c.name);
  return names.length > 0 ? names : null;
}

const PostProduct = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();

  const [title, setTitle] = useState('');
  const [productStatus, setProductStatus] = useState<'new' | 'used' | 'refurbished'>('new');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [regionId, setRegionId] = useState('');
  const [comuna, setComuna] = useState('');
  const [images, setImages] = useState<DraftImage[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [communes, setCommunes] = useState<string[]>([]);
  const [communesLoading, setCommunesLoading] = useState(false);
  const [communesError, setCommunesError] = useState<string | null>(null);
  const [regionsRetryKey, setRegionsRetryKey] = useState(0);
  const [communesRetryKey, setCommunesRetryKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [improvingDescription, setImprovingDescription] = useState(false);
  const [suggestedDescription, setSuggestedDescription] = useState('');
  const [showDescriptionSuggestion, setShowDescriptionSuggestion] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imagesRef = useRef<DraftImage[]>([]);

  const isAllowedPublisher = !!user && (user.roles.includes('entrepreneur') || user.role_number === 5);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setComuna(user.comuna || '');
      setRegionId(user.region_id || '');
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRegionsLoading(true);
      setRegionsError(null);
      try {
        const list = await loadRegionOptionsSorted();
        if (cancelled) return;
        setRegions(list);
        if (list.length === 0) setRegionsError('No se recibieron regiones desde el servidor.');
      } catch (e) {
        if (!cancelled) {
          setRegions([]);
          setRegionsError(catalogFetchUserMessage(e));
        }
      } finally {
        if (!cancelled) setRegionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regionsRetryKey]);

  useEffect(() => {
    if (!regionId) {
      setCommunes([]);
      setCommunesLoading(false);
      setCommunesError(null);
      return;
    }
    let cancelled = false;
    setCommunes([]);
    setCommunesLoading(true);
    setCommunesError(null);
    (async () => {
      try {
        const r = await regionsAPI.getCommunesByRegion(String(regionId));
        if (cancelled) return;
        const names = communesNamesFromApiResponse(String(regionId), r);
        if (names) setCommunes(names);
        else setCommunesError('No se pudo leer el listado de comunas para esa región.');
      } catch (e) {
        if (!cancelled) setCommunesError(catalogFetchUserMessage(e));
      } finally {
        if (!cancelled) setCommunesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regionId, communesRetryKey]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/registro');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (isLoggedIn && user && !isAllowedPublisher) {
      toast.error('Solo emprendedores y super admin pueden publicar productos.');
      navigate('/productos');
    }
  }, [isLoggedIn, user, isAllowedPublisher, navigate]);

  const regionName = useMemo(
    () => regions.find((region) => region.id === String(regionId))?.name || '',
    [regions, regionId]
  );

  const previewCover = images[0]?.previewUrl || null;

  const handleImagesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    if (images.length + selectedFiles.length > 5) {
      toast.error('Puedes subir máximo 5 imágenes por producto.');
      event.target.value = '';
      return;
    }

    const invalid = selectedFiles.find((file) => !file.type.startsWith('image/'));
    if (invalid) {
      toast.error('Solo se permiten imágenes.');
      event.target.value = '';
      return;
    }

    const draftImages = selectedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...draftImages]);
    event.target.value = '';
  };

  const removeImageAt = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const makeCover = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      if (!selected) return prev;
      next.unshift(selected);
      return next;
    });
  };

  const handleImproveDescription = async () => {
    const baseText = description.trim();
    if (baseText.length < 20) {
      toast.error('Escribe una descripción de al menos 20 caracteres.');
      return;
    }
    try {
      setImprovingDescription(true);
      const response = await aiAPI.rewriteProductDescription(baseText);
      if (!response.suggestion?.trim()) {
        toast.error('No se pudo generar una sugerencia.');
        return;
      }
      if (!response.changed) {
        setShowDescriptionSuggestion(false);
        toast.success('Tu descripción ya está bien redactada.');
        return;
      }
      setSuggestedDescription(response.suggestion.trim());
      setShowDescriptionSuggestion(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al mejorar la descripción.');
    } finally {
      setImprovingDescription(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !description.trim() || !regionId || !comuna || images.length === 0) {
      toast.error('Completa título, descripción, región, comuna y al menos una imagen.');
      return;
    }
    if (!isValidTextField(title, 140)) {
      toast.error('El título contiene caracteres no permitidos.');
      return;
    }
    if (!isValidTextField(description, 3000)) {
      toast.error('La descripción contiene caracteres no permitidos.');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      const phoneError = validatePhone(phone);
      toast.error(getValidationErrorMessage('phone', phoneError === 'format' ? 'format' : 'length'));
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', sanitizeInput(title, 140));
      formData.append('product_status', productStatus);
      formData.append('description', sanitizeInput(description, 3000));
      formData.append('region_id', String(regionId));
      formData.append('comuna', sanitizeInput(comuna, 50));
      if (phone.trim()) formData.append('phone', sanitizeInput(phone, 20));
      if (price.trim()) formData.append('price', price.trim());
      formData.append('currency', 'CLP');
      images.forEach((image) => {
        formData.append('images', image.file);
      });

      const response = await productsAPI.createProduct(formData);
      toast.success(response.message || 'Producto publicado correctamente.');
      navigate('/productos');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al publicar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn || !isAllowedPublisher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Publicar Producto
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                Publica productos para venderlos en tu comunidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Tu producto será revisado antes de aparecer públicamente.
                </AlertDescription>
              </Alert>

              {regionsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between gap-3">
                    <span>{regionsError}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => setRegionsRetryKey((k) => k + 1)}>
                      Reintentar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="product-title">Título del producto *</Label>
                    <Input
                      id="product-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Bicicleta MTB aro 29, Torta de chocolate artesanal..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-status">Estado del producto *</Label>
                    <Select value={productStatus} onValueChange={(value: 'new' | 'used' | 'refurbished') => setProductStatus(value)}>
                      <SelectTrigger id="product-status" className="mt-1">
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-price">Precio (opcional)</Label>
                    <Input
                      id="product-price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="Ej: 25000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-4 border rounded-xl bg-primary/5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <Label className="text-base font-semibold">Ubicación del producto</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product-region">Región *</Label>
                      <Select
                        value={regionId}
                        onValueChange={(value) => {
                          setRegionId(value);
                          setComuna('');
                        }}
                        disabled={regionsLoading || regions.length === 0}
                      >
                        <SelectTrigger id="product-region" className="mt-1">
                          <SelectValue placeholder={regionsLoading ? 'Cargando regiones…' : 'Selecciona región'} />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="product-comuna">Comuna *</Label>
                      <Select
                        value={comuna}
                        onValueChange={setComuna}
                        disabled={!regionId || communesLoading || !!communesError}
                      >
                        <SelectTrigger id="product-comuna" className="mt-1">
                          <SelectValue placeholder={communesLoading ? 'Cargando comunas…' : 'Selecciona comuna'} />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {communesError && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-xs text-red-500">{communesError}</p>
                          <Button type="button" size="sm" variant="outline" onClick={() => setCommunesRetryKey((k) => k + 1)}>
                            Reintentar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="product-description">Descripción *</Label>
                  <Textarea
                    ref={descriptionTextareaRef}
                    id="product-description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (showDescriptionSuggestion) setShowDescriptionSuggestion(false);
                    }}
                    placeholder="Describe el producto, su estado, medidas, sabor, detalles importantes, etc."
                    rows={6}
                    className="mt-1"
                  />
                  <Button
                    type="button"
                    variant="default"
                    className="mt-3 border-0 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/30"
                    onClick={handleImproveDescription}
                    disabled={improvingDescription || description.trim().length < 20}
                  >
                    {improvingDescription ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mejorando redacción...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Mejorar descripción con IA
                      </>
                    )}
                  </Button>

                  {showDescriptionSuggestion && suggestedDescription && (
                    <div className="mt-3 p-3 rounded-md border border-primary/30 bg-primary/5 space-y-3">
                      <p className="text-sm font-semibold text-primary">Sugerencia de redacción</p>
                      <p className="text-sm whitespace-pre-wrap">{suggestedDescription}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setDescription(suggestedDescription);
                            setShowDescriptionSuggestion(false);
                            toast.success('Descripción actualizada con la sugerencia');
                          }}
                        >
                          Usar sugerencia
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowDescriptionSuggestion(false)}>
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="product-phone">Número de contacto / WhatsApp</Label>
                  <Input
                    id="product-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="product-images">Imágenes del producto *</Label>
                      <p className="text-xs text-muted-foreground">Máximo 5 imágenes. La primera será la portada.</p>
                    </div>
                    <Badge variant="secondary">{images.length} / 5</Badge>
                  </div>
                  <label
                    htmlFor="product-images"
                    className="flex flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-primary/20 bg-primary/5 p-6 text-center cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    <ImagePlus className="h-8 w-8 text-primary" />
                    <span className="font-medium">Subir imágenes</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG, WEBP</span>
                  </label>
                  <input
                    id="product-images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleImagesSelected}
                  />

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {images.map((image, index) => (
                        <div key={`${image.file.name}-${index}`} className="space-y-2">
                          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border">
                            <img src={image.previewUrl} alt={`Vista previa ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1"
                              onClick={() => removeImageAt(index)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={index === 0 ? 'default' : 'outline'}
                            className="w-full rounded-xl"
                            onClick={() => makeCover(index)}
                          >
                            {index === 0 ? 'Portada' : 'Usar de portada'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="rounded-xl min-w-[12rem]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      'Publicar producto'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass-card border-white/5 shadow-xl md:sticky md:top-24">
              <CardHeader>
                <CardTitle className="text-xl">Vista previa</CardTitle>
                <CardDescription>Diseño adaptado para teléfono y escritorio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="md:hidden rounded-[2rem] border border-border overflow-hidden bg-card">
                  <div className="aspect-[4/3] sm:aspect-[16/10] bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-center p-2">
                    {previewCover ? (
                      <img
                        src={previewCover}
                        alt={title || 'Producto'}
                        className="max-h-full max-w-full h-auto w-auto object-contain object-center"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[8rem] flex items-center justify-center text-sm text-muted-foreground">
                        Portada del producto
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="font-black text-lg line-clamp-1">{title || 'Título del producto'}</p>
                    <p className="text-sm font-bold text-primary">{formatProductPrice(price ? Number(price) : null)}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Badge>{PRODUCT_STATUS_OPTIONS.find((option) => option.value === productStatus)?.label}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                        0.0 (0)
                      </div>
                    </div>
                    <Button className="w-full rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white" disabled>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="hidden md:block rounded-[2rem] border border-border overflow-hidden bg-card">
                  <div className="aspect-[16/10] bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-center p-3">
                    {previewCover ? (
                      <img
                        src={previewCover}
                        alt={title || 'Producto'}
                        className="max-h-full max-w-full h-auto w-auto object-contain object-center"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[10rem] flex items-center justify-center text-sm text-muted-foreground">
                        Portada del producto
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-xl line-clamp-1">{title || 'Título del producto'}</p>
                      <Badge>{PRODUCT_STATUS_OPTIONS.find((option) => option.value === productStatus)?.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {description || 'Aquí verás la descripción del producto en escritorio.'}
                    </p>
                    <p className="text-lg font-black text-primary">{formatProductPrice(price ? Number(price) : null)}</p>
                    <p className="text-sm text-muted-foreground">{[comuna, regionName].filter(Boolean).join(' · ') || 'Ubicación'}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl" disabled>
                        <Star className="w-4 h-4 mr-2 fill-yellow-500 text-yellow-500" />
                        Reseñas
                      </Button>
                      <Button className="rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white" disabled>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostProduct;
