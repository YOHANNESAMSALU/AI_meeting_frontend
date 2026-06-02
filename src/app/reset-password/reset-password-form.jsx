'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from '../lib/api';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = useMemo(() => {
    return (
      searchParams.get('token') ||
      searchParams.get('access_token') ||
      searchParams.get('reset_token') ||
      searchParams.get('code') ||
      ''
    );
  }, [searchParams]);

  const [formData, setFormData] = useState({
    token: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (tokenFromUrl) {
      setFormData((prev) => ({ ...prev, token: tokenFromUrl }));
    }
  }, [tokenFromUrl]);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!formData.token.trim()) {
        throw new Error('Please enter the reset token from your email.');
      }

      if (!formData.new_password.trim()) {
        throw new Error('Please enter a new password.');
      }

      if (formData.new_password !== formData.confirm_password) {
        throw new Error('Passwords do not match.');
      }

      await resetPassword({
        token: formData.token.trim(),
        new_password: formData.new_password,
      });

      setSuccessMessage('Your password has been updated. You can return to the sign-in screen.');
      setFormData({
        token: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (submitError) {
      setError(submitError?.message || 'Unable to reset your password right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_100%)] p-8 text-white sm:p-10">
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="relative flex h-full flex-col justify-between gap-12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-100">
                  AI Meeting Notes
                </p>
                <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                  Reset your account and get back to the workspace.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-7 text-blue-100/90">
                  Use the token from your email link to create a new password. Once that is saved,
                  you can return to the normal sign-in flow and continue with Google or email.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-50">
                <ShieldCheck className="h-4 w-4" />
                Secure password reset
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                Password reset
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Choose a new password</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Enter the reset token from your email and set a fresh password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Reset Token</label>
                <input
                  type="text"
                  value={formData.token}
                  onChange={handleInputChange('token')}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  placeholder="Paste token from email"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={handleInputChange('new_password')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={handleInputChange('confirm_password')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {successMessage && (
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" />
                    Update password
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <a
                href="/"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Return to the app
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
