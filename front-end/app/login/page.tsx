'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Building2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      // Aquí podrías redirigir al usuario si el login es exitoso
      // window.location.href = '/dashboard';
    } catch (err: any) {
      // 1. Intentamos extraer el mensaje que viene del backend (Spring Boot)
      // En Axios, el error está en err.response.data
      const backendMessage = err.response?.data?.message;

      // 2. Si hay mensaje del backend lo usamos, si no, ponemos uno genérico
      if (backendMessage) {
        setError(backendMessage);
      } else if (err.message === "Network Error") {
        setError('No hay conexión con el servidor.');
      } else {
        setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      }

      console.error('Login error details:', err.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-balance">
              Sistema de Gestion Hospitalaria
            </CardTitle>
            <CardDescription className="mt-2">
              Trassierra - Accede a tu cuenta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Iniciando sesion...
                </>
              ) : (
                'Iniciar sesion'
              )}
            </Button>
          </form>

          {/* Test credentials - Remove in production */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
              Credenciales de prueba:
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@trassierra.com');
                  setPassword('admin123');
                }}
                className="w-full p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <span className="font-medium text-primary">Super Admin (ROOT)</span>
                <br />
                <span className="text-muted-foreground">superadmin@trassierra.com / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@hospital-reina-sofia.com');
                  setPassword('admin123');
                }}
                className="w-full p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <span className="font-medium text-primary">Admin Hospital</span>
                <br />
                <span className="text-muted-foreground">admin@hospital-reina-sofia.com / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('trabajador@hospital-reina-sofia.com');
                  setPassword('worker123');
                }}
                className="w-full p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <span className="font-medium text-primary">Trabajador</span>
                <br />
                <span className="text-muted-foreground">trabajador@hospital-reina-sofia.com / worker123</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
