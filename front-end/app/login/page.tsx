'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AlertCircle, Building2, CheckCircle2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (nextMode: 'login' | 'recovery') => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      if (backendMessage) {
        setError(backendMessage);
      } else if (err.message === 'Network Error') {
        setError('No hay conexion con el servidor.');
      } else {
        setError('Credenciales incorrectas. Intentalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await authApi.requestPasswordReset({ email: recoveryEmail });
      setSuccess(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo iniciar la recuperacion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-balance">
              {mode === 'login' ? 'Sistema de Gestion Hospitalaria' : 'Recuperar acceso'}
            </CardTitle>
            <CardDescription className="mt-2">
              {mode === 'login'
                ? 'Trassierra - Accede a tu cuenta'
                : 'Te enviaremos un enlace para restablecer tu contrasena'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === 'login' ? handleSubmit : handlePasswordRecovery} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <FieldGroup>
              {mode === 'login' ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Introduce tu contrasena"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </Field>
                </>
              ) : (
                <Field>
                  <FieldLabel htmlFor="recoveryEmail">Correo electronico</FieldLabel>
                  <Input
                    id="recoveryEmail"
                    type="email"
                    placeholder="tu@email.com"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>
              )}
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  {mode === 'login' ? 'Iniciando sesion...' : 'Enviando enlace...'}
                </>
              ) : mode === 'login' ? (
                'Iniciar sesion'
              ) : (
                'Enviar enlace de recuperacion'
              )}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'recovery' : 'login')}
              className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {mode === 'login' ? 'He olvidado mi contrasena' : 'Volver al login'}
            </button>

            {mode === 'recovery' && (
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Cancelar
              </Link>
            )}
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
              Credenciales de prueba:
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@trassierra.com');
                  setPassword('admin123');
                  switchMode('login');
                }}
                className="w-full rounded-md bg-muted/50 p-2 text-left transition-colors hover:bg-muted"
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
                  switchMode('login');
                }}
                className="w-full rounded-md bg-muted/50 p-2 text-left transition-colors hover:bg-muted"
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
                  switchMode('login');
                }}
                className="w-full rounded-md bg-muted/50 p-2 text-left transition-colors hover:bg-muted"
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
