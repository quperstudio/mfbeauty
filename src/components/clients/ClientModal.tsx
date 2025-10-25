import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client, ClientTag } from '../../types/database';
import { clientSchema, ClientSchemaType } from '../../schemas/client.schema';
import { parsePhoneInput, formatPhoneRealTime, cleanSocialMediaInput, getSocialMediaIcon } from '../../lib/formats';
import { SOCIAL_MEDIA_LABELS, SocialMediaType } from '../../lib/constants';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from "@/lib/utils";
import TagInput from '@/components/ui/TagInput';
import { useTagsQuery, useClientTagsQuery } from '../../hooks/queries/useTags.query';
import { useAuth } from '../../contexts/AuthContext';
import * as clientService from '../../services/client.service';
import { useToast } from "@/components/hooks/use-toast"; // 👈 CAMBIO 1: Importar el hook de Toast de shadcn/ui

// ===================================
// TIPOS DE DATOS
// ===================================
type ClientFormDataBase = {
    name: string;
    phone: string;
    birthday: string | null;
    notes: string;
    referrer_id: string;
}

interface SocialMedia {
    type: SocialMediaType;
    link: string;
}

const socialTypeOptions = [
    { value: 'whatsapp' as SocialMediaType, label: SOCIAL_MEDIA_LABELS.whatsapp },
    { value: 'facebook' as SocialMediaType, label: SOCIAL_MEDIA_LABELS.facebook },
    { value: 'instagram' as SocialMediaType, label: SOCIAL_MEDIA_LABELS.instagram },
    { value: 'tiktok' as SocialMediaType, label: SOCIAL_MEDIA_LABELS.tiktok },
];

// ===================================
// FUNCIONES DE MAPEO
// ===================================

const mapListToFormData = (list: SocialMedia[]): Pick<ClientSchemaType, 'whatsapp_link' | 'facebook_link' | 'instagram_link' | 'tiktok_link'> => {
    const socialMediaFields = list.reduce((acc, sm) => {
        acc[`${sm.type}_link`] = sm.link;
        return acc;
    }, {} as Record<string, string>);

    return {
        whatsapp_link: socialMediaFields.whatsapp_link || '',
        facebook_link: socialMediaFields.facebook_link || '',
        instagram_link: socialMediaFields.instagram_link || '',
        tiktok_link: socialMediaFields.tiktok_link || '',
    } as Pick<ClientSchemaType, 'whatsapp_link' | 'facebook_link' | 'instagram_link' | 'tiktok_link'>;
};

const mapClientToSocialMediaList = (client: Client): SocialMedia[] => {
    const list: SocialMedia[] = [];
    if (client.whatsapp_link) list.push({ type: 'whatsapp', link: client.whatsapp_link });
    if (client.facebook_link) list.push({ type: 'facebook', link: client.facebook_link });
    if (client.instagram_link) list.push({ type: 'instagram', link: client.instagram_link });
    if (client.tiktok_link) list.push({ type: 'tiktok', link: client.tiktok_link });
    return list;
};

// ===================================
// PROPIEDADES Y ESTADO INICIAL
// ===================================
interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ClientSchemaType, tagIds: string[]) => Promise<{ error: string | null }>;
    client?: Client;
    clients: Client[];
}

const initialFormData: ClientFormDataBase = {
    name: '', phone: '', birthday: null, notes: '', referrer_id: '',
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================
export default function ClientModal({ isOpen, onClose, onSave, client, clients }: ClientModalProps) {
    const { user } = useAuth();
    const { tags: availableTags, createTag, deleteTag } = useTagsQuery();
    const { clientTags, syncTags } = useClientTagsQuery(client?.id || null);
    const { toast } = useToast(); // 👈 CAMBIO 2: Obtener la función toast del hook

    const [formData, setFormData] = useState<ClientFormDataBase>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState<ClientTag[]>([]);
    const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);

    const [socialMediaList, setSocialMediaList] = useState<SocialMedia[]>([]);
    const [newSocialMediaType, setNewSocialMediaType] = useState<SocialMedia['type']>('whatsapp');
    const [newSocialMediaLink, setNewSocialMediaLink] = useState<string>('');
    const [socialMediaInputError, setSocialMediaInputError] = useState<string>('');

    useEffect(() => {
        if (!isOpen) return;

        if (client) {
            setFormData({
                name: client.name,
                phone: client.phone,
                birthday: client.birthday || null,
                notes: client.notes || '',
                referrer_id: client.referrer_id || '',
            });

            const initialSocialMedia = mapClientToSocialMediaList(client);
            setSocialMediaList(initialSocialMedia);

            setNewSocialMediaLink('');
            setNewSocialMediaType('whatsapp');
            setSelectedTags(clientTags);

        } else {
            setFormData(initialFormData);
            setSocialMediaList([]);
            setNewSocialMediaLink('');
            setSelectedTags([]);
            setNewSocialMediaType('whatsapp');
        }

        setErrors({});
        setSocialMediaInputError('');
    }, [client, isOpen, clientTags]); // Agregué clientTags a las dependencias por seguridad

    const socialMediaOptions = useMemo(() => {
        const existingTypes = new Set(socialMediaList.map(sm => sm.type));
        const availableOptions = socialTypeOptions.filter(opt => !existingTypes.has(opt.value as SocialMedia['type']));
        return availableOptions;
    }, [socialMediaList]);

    // ===================================
    // MANEJADORES DE CAMBIOS Y ACCIONES
    // ===================================

    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name !== 'phone') {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    const handleBirthdayChange = useCallback((date: Date | null) => {
        if (date) {
            const dateString = format(date, 'yyyy-MM-dd');
            setFormData(prev => ({ ...prev, birthday: dateString }));
        } else {
            setFormData(prev => ({ ...prev, birthday: null }));
        }
    }, []);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        try {
            const socialMediaLinks = mapListToFormData(socialMediaList);
            const dataToValidate = {
                ...formData,
                ...socialMediaLinks,
            };
            clientSchema.parse(dataToValidate);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                error.issues.forEach((err) => {
                    const field = err.path[0] as string;
                    newErrors[field] = err.message;
                });
            }
            setErrors(newErrors);
            return false;
        }
    }, [formData, socialMediaList]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            // Reemplazo de toast.error de Sonner por toast de shadcn/ui con variant: 'destructive'
            toast({
                variant: 'destructive',
                title: 'Fallo en la validación',
                description: 'Por favor, revisa los campos marcados en rojo para corregir los errores.',
            });
            return;
        }

        setPhoneCheckLoading(true);
        const duplicateClient = await clientService.checkDuplicatePhone(formData.phone, client?.id);
        setPhoneCheckLoading(false);

        if (duplicateClient) {
            // Reemplazo de toast.error de Sonner por toast de shadcn/ui con variant: 'destructive'
            toast({
                variant: 'destructive',
                title: `Error: Teléfono duplicado.`,
                description: `Este número ya está registrado para el cliente ${duplicateClient.name}.`,
            });
            return;
        }

        const socialMediaLinks = mapListToFormData(socialMediaList);

        const rawData = {
            ...formData,
            ...socialMediaLinks,
        };

        const sanitizedData: ClientSchemaType = {
            name: rawData.name.trim(),
            phone: rawData.phone,
            birthday: rawData.birthday?.trim() || null,
            notes: rawData.notes?.trim() || null,
            referrer_id: rawData.referrer_id?.trim() || null,
            whatsapp_link: socialMediaLinks.whatsapp_link?.trim() || null,
            facebook_link: socialMediaLinks.facebook_link?.trim() || null,
            instagram_link: socialMediaLinks.instagram_link?.trim() || null,
            tiktok_link: socialMediaLinks.tiktok_link?.trim() || null,
            created_by_user_id: client ? undefined : (user?.id || null),
        };

        const tagIds = selectedTags.map(tag => tag.id);

        setLoading(true);
        const result = await onSave(sanitizedData, tagIds);
        setLoading(false);

        if (result.error) {
            // Reemplazo de toast.error de Sonner por toast de shadcn/ui con variant: 'destructive'
            toast({
                variant: 'destructive',
                title: 'Error al guardar el cliente',
                description: result.error,
            });
        } else {
            onClose();
            // Reemplazo de toast.success de Sonner por toast por defecto (éxito)
            toast({
                title: 'Operación Exitosa',
                description: `Cliente ${client ? 'actualizado' : 'creado'} con éxito!`,
            });
        }
    };

    const handlePhoneChange = (value: string) => {
        const cleaned = parsePhoneInput(value);
        setFormData({ ...formData, phone: cleaned });

        if (!client) {
            const whatsappExists = socialMediaList.some(sm => sm.type === 'whatsapp');
            if (newSocialMediaType === 'whatsapp' && !whatsappExists) {
                setNewSocialMediaLink(cleaned);
            }
        }
        
        if (errors.phone) {
            setErrors({ ...errors, phone: '' });
        }
    };

    const handleSocialMediaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSocialMedia();
        }
    };


    const handleAddSocialMedia = () => {
        if (!newSocialMediaLink.trim()) {
            setSocialMediaInputError('El enlace/usuario no puede estar vacío.');
            // Reemplazo de toast.warning de Sonner por toast de shadcn/ui por defecto
            toast({
                title: 'Advertencia',
                description: 'Ingresa un usuario o enlace para la red social.',
            });
            return;
        }
        const exists = socialMediaList.some(sm => sm.type === newSocialMediaType);
        if (exists) {
            setSocialMediaInputError(`Ya existe una red social de tipo ${newSocialMediaType}.`);
            // Reemplazo de toast.warning de Sonner por toast de shadcn/ui por defecto
            toast({
                title: 'Advertencia',
                description: `Ya existe una red social de tipo ${SOCIAL_MEDIA_LABELS[newSocialMediaType]}.`,
            });
            return;
        }
        
        const cleanedLink = cleanSocialMediaInput(newSocialMediaType, newSocialMediaLink.trim());
        const updatedList = [...socialMediaList, { type: newSocialMediaType, link: cleanedLink }];
        setSocialMediaList(updatedList);

        const existingTypes = new Set(updatedList.map(sm => sm.type));
        const availableOptions = socialTypeOptions.filter(opt => !existingTypes.has(opt.value as SocialMedia['type']));

        const nextDefaultType = availableOptions.length > 0 ? availableOptions[0].value as SocialMedia['type'] : 'whatsapp';
        setNewSocialMediaType(nextDefaultType);
        
        setNewSocialMediaLink('');
        setSocialMediaInputError('');
    };

    const handleRemoveSocialMedia = (typeToRemove: SocialMedia['type']) => {
        setSocialMediaList(prev => prev.filter(sm => sm.type !== typeToRemove));
        
        if (socialMediaOptions.length > 0) {
            setNewSocialMediaType(socialMediaOptions[0].value as SocialMedia['type']);
            setNewSocialMediaLink('');
        } else {
            setNewSocialMediaLink('');
        }
    };

    const referrerOptions = useMemo(() => {
        const options = [
            { value: '__RESET__', label: 'Ninguno' }, 
            ...clients
                .filter((c) => c.id !== client?.id)
                .map((c) => ({ value: c.id, label: c.name })),
        ];
        return options;
    }, [clients, client?.id]);
    

    // ===================================
    // RENDERIZADO
    // ===================================
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border flex flex-col h-full max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} id="client-form" className="flex flex-col flex-grow h-0 min-h-0">
                    <ScrollArea className="flex-grow h-0 min-h-0">
                        <div className="space-y-3 p-2 sm:space-y-4">
                            
                            {/* CAMPOS: Nombre y Teléfono (Fila 1) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label htmlFor="client-name" className="block text-sm font-medium text-muted-foreground mb-1.5">Nombre Completo *</label>
                                    <Input
                                        id="client-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        error={errors.name}
                                        placeholder="Ej. Marisela Félix"
                                        disabled={loading}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive mt-1.5">{errors.name}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label htmlFor="client-phone" className="block text-sm font-medium text-muted-foreground mb-1.5">Teléfono *</label>
                                    <Input
                                        id="client-phone"
                                        name="phone"
                                        value={formatPhoneRealTime(formData.phone)}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        error={errors.phone}
                                        placeholder="(667) 341 2404"
                                        maxLength={15}
                                        disabled={loading}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-destructive mt-1.5">{errors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Sección Redes Sociales (Fila 2 - Input/Select) */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-muted-foreground">Redes sociales</Label>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 items-end">
                                    <Select
                                        value={newSocialMediaType}
                                        onValueChange={(value) => {
                                            const newType = value as SocialMedia['type'];
                                            setNewSocialMediaType(newType);
                                            setNewSocialMediaLink('');
                                            setSocialMediaInputError('');
                                        }}
                                        disabled={loading || socialMediaOptions.length === 0}
                                        name="newSocialMediaType"
                                    >
                                        <SelectTrigger className={cn(socialMediaInputError && "border-destructive")}>
                                            <SelectValue placeholder={socialMediaOptions.length === 0 ? 'Todas añadidas' : 'Selecciona Tipo'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {socialMediaOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        value={newSocialMediaLink}
                                        onChange={(e) => setNewSocialMediaLink(e.target.value)}
                                        onKeyDown={handleSocialMediaKeyDown}
                                        placeholder={newSocialMediaType === 'whatsapp' ? 'Número de teléfono (presiona Enter)' : 'Usuario o enlace (presiona Enter)'}
                                        disabled={loading || socialMediaOptions.length === 0}
                                        error={socialMediaInputError}
                                    />
                                </div>

                                {socialMediaInputError && (
                                    <p className="text-sm text-destructive">{socialMediaInputError}</p>
                                )}

                                {/* Lista de Redes Sociales añadidas */}
                                <div className="space-y-2">
                                    {socialMediaList.map((sm) => (
                                        <div
                                            key={sm.type}
                                            className="flex items-center justify-between p-2 bg-secondary/30 text-secondary-foreground rounded-lg"
                                        >
                                            <div className="flex items-center gap-2 pl-2">
                                                {React.createElement(getSocialMediaIcon(sm.type)!, { className: "w-4 h-4" })}
                                                <span className="text-sm">{sm.link}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveSocialMedia(sm.type)}
                                                disabled={loading}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CAMPOS: Cumpleaños y Referido Por (Fila 3) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <DatePicker
                                    label="Fecha de Cumpleaños"
                                    value={formData.birthday}
                                    onChange={handleBirthdayChange}
                                    placeholder="Selecciona una fecha"
                                    disabled={loading}
                                />
                                <div>
                                    <Label htmlFor="referrer-select" className="block text-sm font-medium text-muted-foreground mb-1">Referido Por</Label>
                                    <Select
                                        value={formData.referrer_id || ''}
                                        onValueChange={(value) => {
                                            const finalValue = value === '__RESET__' ? '' : value;
                                            setFormData(prev => ({ ...prev, referrer_id: finalValue }));
                                        }}
                                        disabled={loading}
                                        name="referrer_id"
                                    >
                                        <SelectTrigger id="referrer-select" className={errors.referrer_id ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Ninguno" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {referrerOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.referrer_id && (
                                        <p className="text-sm text-destructive mt-1.5">{errors.referrer_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* CAMPO: Etiquetas (Fila 4 - Separado) */}
                            <TagInput
                                label="Etiquetas"
                                placeholder="Escribe y presiona Enter para agregar..."
                                selectedTags={selectedTags}
                                availableTags={availableTags}
                                onAddTag={async (tagName) => {
                                    const { tag, error } = await createTag({ name: tagName });
                                    if (tag && !error) {
                                        setSelectedTags(prev => [...prev, tag]);
                                    }
                                }}
                                onRemoveTag={(tagId) => {
                                    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
                                }}
                                onDeleteTagGlobally={async (tagId) => {
                                    await deleteTag(tagId);
                                    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
                                }}
                                maxTags={5}
                                disabled={loading}
                                canDeleteGlobally={true}
                            />

                            {/* CAMPO: Notas (Fila 5 - Ancho Completo) */}
                            <div>
                                <label htmlFor="client-notes" className="block text-sm font-medium text-muted-foreground mb-1.5">Notas</label>
                                <Textarea
                                    id="client-notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleFormChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                                    rows={3}
                                    placeholder="Notas adicionales sobre el cliente..."
                                    disabled={loading}
                                />
                            </div>

                            {/* ❌ Se elimina la visualización de errors.submit aquí para que lo maneje Sonner */}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="pb-2 pt-4 border-t border-border bg-background">
                        <Button
                            type="button"
                            variant="outline"
                            size="default"
                            onClick={onClose}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            size="default"
                            disabled={loading || phoneCheckLoading}
                            className="w-full sm:w-auto"
                        >
                            {loading || phoneCheckLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                                    {phoneCheckLoading ? 'Validando...' : 'Guardando...'}
                                </div>
                            ) : (
                                <>{client ? 'Actualizar' : 'Crear'} Cliente</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}