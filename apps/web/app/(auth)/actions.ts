'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
} from '@welldesk/shared';

export async function login(values: LoginInput) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  // Auth is shared between dietitian and client accounts, so a client who
  // lands on this form by mistake would otherwise authenticate
  // successfully, redirect to /dashboard, and get silently bounced back to
  // a blank /login by requireProfile() — confusing, looks like a broken
  // login. Detect that case and route to where their account actually is.
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
  if (!profile) {
    const { data: client } = await supabase.from('clients').select('id').eq('user_id', data.user.id).maybeSingle();
    if (client) {
      redirect('/portal');
    }
    await supabase.auth.signOut();
    return { error: 'No WellDesk dietitian account found for this email. If you\'re a client, use the client portal login instead.' };
  }

  redirect('/dashboard');
}

export async function register(values: RegisterInput) {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: fullName,
        gender: parsed.data.gender,
        practice_name: `${parsed.data.firstName}'s Practice`,
      },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { message: 'Account created — check your email to confirm before logging in.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function requestPasswordReset(values: ForgotPasswordInput) {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });

  // Always report success — don't reveal whether an email is registered.
  if (error) {
    console.error('resetPasswordForEmail failed', error.message);
  }
  return { success: true };
}
