'use client';

import { FormEvent, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('El enlace no incluye un token valido.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword({ token, password });
      setSuccess(response.data.message);
      setPassword('');
      setConfirmPassword('');
      window.setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contrasena.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <Field>
            <FieldLabel htmlFor="password">Nueva contrasena</FieldLabel>
            <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Introduce la nueva contrasena"
                autoComplete="new-password"
                required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirmar contrasena</FieldLabel>
            <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contrasena"
                autoComplete="new-password"
                required
            />
          </Field>
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Actualizando...
              </>
          ) : (
              'Guardar nueva contrasena'
          )}
        </Button>
      </form>
  );
}

export default function ResetPasswordPage() {
  return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <KeyRound className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl">Nueva contrasena</CardTitle>
              <CardDescription className="mt-2">
                Introduce la nueva contrasena para recuperar tu acceso.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Spinner />}>
              <ResetPasswordForm />
            </Suspense>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
  );
}