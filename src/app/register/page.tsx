
'use client';

// This page can largely redirect or mirror the login page,
// as modern auth flows (social/OTP) handle registration implicitly.

import LoginPage from '@/app/login/page'; // Reuse the login page component

export default function RegisterPage() {
  if (typeof window !== 'undefined') {
    document.title = 'Sign Up | Local Hub';
  }
  // The LoginPage component already has a title "Login or Sign Up"
  // For a distinct registration page, you might slightly alter CardTitle/Description
  // But for simplicity and since the flows are similar, reusing is fine.
  return <LoginPage />;
}
