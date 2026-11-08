'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

function getDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  return meta.full_name || meta.name || user.email || 'Mon compte';
}

function getInitials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Fermer le menu au clic extérieur ou avec Échap
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setIsSigningOut(true);
    await supabase.auth.signOut();
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    router.replace('/login');
    router.refresh();
  };

  if (!isSupabaseConfigured) return null;

  if (!user) {
    // Emplacement réservé pendant le chargement, pour éviter un décalage du header
    return <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />;
  }

  const name = getDisplayName(user);
  const avatarUrl: string | undefined = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={name}
        className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-blue-500/50 focus-visible:ring-blue-500 focus:outline-none transition-shadow bg-blue-600 text-white text-xs font-bold flex items-center justify-center"
      >
        {avatarUrl && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar Google externe, pas besoin d'optimisation
          <img
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-40"
        >
          <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{name}</p>
            {user.email && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-60"
          >
            {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            <span>Se déconnecter</span>
          </button>
        </div>
      )}
    </div>
  );
}
