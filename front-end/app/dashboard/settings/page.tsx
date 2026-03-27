'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dni: '',
    imageURL: '',
  });

  const [imgError, setImgError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: (user as any).firstName ?? (user as any).nombre    ?? '',
        lastName:  (user as any).lastName  ?? (user as any).apellidos ?? '',
        email:     user.email              ?? '',
        dni:       (user as any).dni       ?? '',
        imageURL:  (user as any).imageURL  ?? (user as any).avatar    ?? '',
      });
      setImgError(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const redirectByRole = () => {
    switch (user?.role) {
      case 'ROOT':           router.push('/dashboard/root');   break;
      case 'HOSPITAL_ADMIN': router.push('/dashboard/admin');  break;
      case 'WORKER':         router.push('/dashboard/worker'); break;
      default:               router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status:', response.status, 'Body:', errorText);
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      updateUser(data);
      toast.success('Perfil actualizado correctamente.');
      redirectByRole();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast.error('Error al actualizar el perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const avatarSrc = !imgError && formData.imageURL ? formData.imageURL : null;

  return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Ajustes del Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Foto de perfil */}
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="relative w-28 h-28">
                  {avatarSrc ? (
                      <img
                          src={avatarSrc}
                          alt="Avatar"
                          className="w-28 h-28 rounded-full object-cover border-2 border-border"
                          onError={() => setImgError(true)}
                      />
                  ) : (
                      <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center text-3xl font-semibold text-muted-foreground border-2 border-border">
                        {formData.firstName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <Label htmlFor="imageURL">URL de la foto de perfil</Label>
                  <Input
                      id="imageURL"
                      name="imageURL"
                      placeholder="https://ejemplo.com/foto.jpg"
                      value={formData.imageURL}
                      onChange={(e) => {
                        setImgError(false);
                        handleChange(e);
                      }}
                  />
                </div>
              </div>

              {/* Nombre y apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>

              {/* DNI */}
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" name="dni" value={formData.dni} onChange={handleChange} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button type="button" variant="outline" onClick={redirectByRole}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
}