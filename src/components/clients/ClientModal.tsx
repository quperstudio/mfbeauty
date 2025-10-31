import { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Client } from '../../types/database';
import { validatePhone, getPhoneError } from '../../lib/validators';
import { parsePhoneInput } from '../../lib/formats';
import { format } from 'date-fns';
import { SmartDatePicker } from '../ui/SmartDatePicker'; // Importado

// --- Tipos ---
type ClientFormDataBase = {
    name: string;
    phone: string;
    birthday: string;
    notes: string;
    referrer_id: string;
}

type ClientFormData = ClientFormDataBase & {
    whatsapp_link: string;
    facebook_link: string;
    instagram_link: string;
    tiktok_link: string;
}

interface SocialMedia {
    type: 'whatsapp' | 'facebook' | 'instagram' | 'tiktok';
    link: string;
}

const socialTypeOptions = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
];

// --- Funciones de Conversión ---

const mapListToFormData = (list: SocialMedia[]): Pick<ClientFormData, 'whatsapp_link' | 'facebook_link' | 'instagram_link' | 'tiktok_link'> => {
    const socialMediaFields = list.reduce((acc, sm) => {
        acc[`${sm.type}_link`] = sm.link;
        return acc;
    }, {} as Record<string, string>);

    return {
        whatsapp_link: socialMediaFields.whatsapp_link || '',
        facebook_link: socialMediaFields.facebook_link || '',
        instagram_link: socialMediaFields.instagram_link || '',
        tiktok_link: socialMediaFields.tiktok_link || '',
    }
};

const mapClientToSocialMediaList = (client: Client): SocialMedia[] => {
    const list: SocialMedia[] = [];
    if (client.whatsapp_link) list.push({ type: 'whatsapp', link: client.whatsapp_link });
    if (client.facebook_link) list.push({ type: 'facebook', link: client.facebook_link });
    if (client.instagram_link) list.push({ type: 'instagram', link: client.instagram_link });
    if (client.tiktok_link) list.push({ type: 'tiktok', link: client.tiktok_link });
    return list;
};

// --- Props ---
interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ClientFormData) => Promise<{ error: string | null }>;
    client?: Client;
    clients: Client[];
}

const initialFormData: ClientFormDataBase = {
    name: '', phone: '', birthday: '', notes: '', referrer_id: '',
}

export default function ClientModal({ isOpen, onClose, onSave, client, clients }: ClientModalProps) {
    
    const [formData, setFormData] = useState<ClientFormDataBase>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

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
                birthday: client.birthday || '',
                notes: client.notes || '',
                referrer_id: client.referrer_id || '',
            });

            const initialSocialMedia = mapClientToSocialMediaList(client);
            setSocialMediaList(initialSocialMedia);
            
            setNewSocialMediaLink(client.phone); 
            setNewSocialMediaType('whatsapp');

        } else {
            setFormData(initialFormData);
            setSocialMediaList([]);
            setNewSocialMediaLink('');
            setNewSocialMediaType('whatsapp');
        }
        
        setErrors({});
        setSocialMediaInputError('');
    }, [client, isOpen]);

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
            setFormData(prev => ({ ...prev, birthday: '' }));
        }
    }, []);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        const phoneError = getPhoneError(formData.phone);
        if (phoneError) newErrors.phone = phoneError;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const socialMediaLinks = mapListToFormData(socialMediaList);

        const dataToSave: ClientFormData = {
            ...formData,
            ...socialMediaLinks, 
        };

        setLoading(true);
        const result = await onSave(dataToSave);
        setLoading(false);

        if (result.error) {
            setErrors({ submit: result.error });
        } else {
            onClose();
        }
    };

    const handlePhoneChange = (value: string) => {
        const cleaned = parsePhoneInput(value);
        setFormData({ ...formData, phone: cleaned });

        const whatsappExists = socialMediaList.some(sm => sm.type === 'whatsapp');
        if (newSocialMediaType === 'whatsapp' && !whatsappExists) {
            setNewSocialMediaLink(cleaned);
        }

        if (errors.phone && validatePhone(cleaned)) {
            setErrors({ ...errors, phone: '' });
        }
    };

    
    const handleAddSocialMedia = () => {
        if (!newSocialMediaLink.trim()) {
            setSocialMediaInputError('El enlace/usuario no puede estar vacío.');
            return;
        }
        const exists = socialMediaList.some(sm => sm.type === newSocialMediaType);
        if (exists) {
            setSocialMediaInputError(`Ya existe una red social de tipo ${newSocialMediaType}.`);
            return;
        }
        setSocialMediaList(prev => [...prev, { type: newSocialMediaType, link: newSocialMediaLink.trim() }]);
        
        setNewSocialMediaLink(newSocialMediaType === 'whatsapp' ? formData.phone : '');
        setSocialMediaInputError('');
    };

    const handleRemoveSocialMedia = (typeToRemove: SocialMedia['type']) => {
        setSocialMediaList(prev => prev.filter(sm => sm.type !== typeToRemove));
    };

    const handleSocialTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as SocialMedia['type'];
        setNewSocialMediaType(newType);
        
        if (newType === 'whatsapp') {
            setNewSocialMediaLink(formData.phone);
        } else {
            if (newSocialMediaLink === formData.phone) {
                setNewSocialMediaLink('');
            }
        }
        setSocialMediaInputError('');
    };

    const referrerOptions = useMemo(() => ([
        { value: '', label: 'Ninguno' },
        ...clients
            .filter((c) => c.id !== client?.id)
            .map((c) => ({ value: c.id, label: c.name })),
    ]), [clients, client?.id]);
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={client ? 'Editar Cliente' : 'Nuevo Cliente'}
            size="lg"
        >
            <form onSubmit={handleSubmit} id="client-form" className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                        label="Nombre Completo *"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        error={errors.name}
                        placeholder="María García"
                        disabled={loading}
                    />

                    <Input
                        label="Teléfono *"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        error={errors.phone}
                        placeholder="6641234567"
                        maxLength={10}
                        disabled={loading}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha de Cumpleaños</label>
                        <SmartDatePicker
                            value={formData.birthday}
                            onChange={handleBirthdayChange}
                            placeholder="Ej: 3 de Junio, 03/06/90"
                            className={loading ? 'pointer-events-none opacity-60' : ''}
                        />
                    </div>

                    <Select
                        label="Referido Por"
                        name="referrer_id"
                        value={formData.referrer_id || ''}
                        onChange={handleFormChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
                        options={referrerOptions}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleFormChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base"
                        rows={3}
                        placeholder="Notas adicionales sobre el cliente..."
                        disabled={loading}
                    />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Redes Sociales (Opcional)</h4>
                    
                    <div className="flex flex-col gap-2">
                        <div className="w-full">
                            <Select
                                label="Tipo"
                                value={newSocialMediaType}
                                onChange={handleSocialTypeChange}
                                options={socialTypeOptions}
                                disabled={loading}
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                label="Enlace o Usuario"
                                value={newSocialMediaLink}
                                onChange={(e) => setNewSocialMediaLink(e.target.value)}
                                placeholder={newSocialMediaType === 'whatsapp' ? 'Número de teléfono' : 'Usuario o enlace'}
                                disabled={loading}
                            />
                        </div>
                        <div className="w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddSocialMedia}
                                disabled={loading}
                                className="w-full"
                            >
                                + Agregar
                            </Button>
                        </div>
                    </div>

                    {socialMediaInputError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{socialMediaInputError}</p>
                    )}

                    <div className="space-y-2">
                        {socialMediaList.map((sm) => (
                            <div
                                key={sm.type}
                                className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold capitalize text-sm">{sm.type}:</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{sm.link}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => handleRemoveSocialMedia(sm.type)}
                                    disabled={loading}
                                    className="text-red-500 hover:text-red-700 !p-1 !h-auto"
                                >
                                    &#10005;
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
                
                {errors.submit && (
                    <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                        {errors.submit}
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading} className="w-full sm:w-auto">
                        {client ? 'Actualizar' : 'Crear'} Cliente
                    </Button>
                </div>
            </form>
        </Modal>
    );
}