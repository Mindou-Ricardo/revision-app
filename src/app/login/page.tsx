import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppLogo } from '@/components/AppLogo';
import { GoogleSignInButton } from './GoogleSignInButton';

export const metadata: Metadata = {
  title: 'Connexion — Memora',
};

async function LoginError({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mb-5 px-3 py-2 rounded-xl text-xs font-medium text-center bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
    >
      La connexion a échoué. Réessaie.
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-900/5 p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <AppLogo className="w-16 h-16 mb-4 drop-shadow-sm" />
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Memora
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Connecte-toi pour retrouver tes répertoires et ta progression sur tous tes appareils.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginError searchParams={searchParams} />
        </Suspense>

        <GoogleSignInButton />

        <p className="mt-6 text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
          Seuls ton nom, ton e-mail et ta photo de profil Google sont utilisés.
        </p>
      </div>
    </main>
  );
}
