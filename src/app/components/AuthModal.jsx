import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, RefreshCcw, X } from 'lucide-react';
import {
  forgotPassword,
  isUnauthorizedError,
  loginUser,
  registerUser,
  resolveApiEndpoint,
  resetPassword,
  setAccessToken,
  setStoredUser,
} from '../lib/api';

function extractAccessToken(response) {
  if (typeof response?.access_token === 'string' && response.access_token.trim()) {
    return response.access_token.trim();
  }

  if (typeof response?.accessToken === 'string' && response.accessToken.trim()) {
    return response.accessToken.trim();
  }

  if (typeof response?.token === 'string' && response.token.trim()) {
    return response.token.trim();
  }

  return '';
}

function normalizeAuthenticatedUser(response) {
  const source = response?.user && typeof response.user === 'object' ? response.user : response;

  if (!source || typeof source !== 'object') {
    return null;
  }

  const normalizedUser = {
    id: source.id ?? null,
    email: typeof source.email === 'string' ? source.email : '',
    full_name: typeof source.full_name === 'string' ? source.full_name : '',
    created_at: typeof source.created_at === 'string' ? source.created_at : '',
  };

  if (!normalizedUser.id && !normalizedUser.email && !normalizedUser.full_name) {
    return null;
  }

  return normalizedUser;
}

function readAuthTokenFromLocation() {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  const candidates = [
    url.searchParams.get('access_token'),
    url.searchParams.get('accessToken'),
    url.searchParams.get('token'),
    url.searchParams.get('reset_token'),
    url.searchParams.get('code'),
  ].filter(Boolean);

  if (candidates.length > 0) {
    return candidates[0].trim();
  }

  if (url.hash.startsWith('#')) {
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const hashToken = hashParams.get('access_token') || hashParams.get('token');
    if (hashToken) {
      return hashToken.trim();
    }
  }

  return '';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    confirm_password: '',
    reset_token: '',
    new_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot';
  const isResetPassword = mode === 'reset';

  const title = useMemo(() => {
    if (isRegister) {
      return 'Create Account';
    }

    if (isForgotPassword) {
      return 'Forgot Password';
    }

    if (isResetPassword) {
      return 'Set New Password';
    }

    return 'Sign In';
  }, [isForgotPassword, isRegister, isResetPassword]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const token = readAuthTokenFromLocation();
    if (token) {
      setMode('reset');
      setFormData((prev) => ({ ...prev, reset_token: token }));
    }
  }, [isOpen]);

  const resetTransientState = () => {
    setError('');
    setSuccessMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    resetTransientState();
    setFormData((prev) => ({
      ...prev,
      password: '',
      confirm_password: '',
      new_password: '',
      full_name: nextMode === 'register' ? prev.full_name : '',
      reset_token: nextMode === 'reset' ? prev.reset_token : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    resetTransientState();

    try {
      if (isForgotPassword) {
        await forgotPassword({ email: formData.email.trim() });
        setSuccessMessage(
          'If an account exists for that email, we sent password reset instructions.',
        );
        return;
      }

      if (isResetPassword) {
        if (!formData.reset_token.trim()) {
          throw new Error('Please enter the reset token from your email link.');
        }

        if (!formData.new_password.trim()) {
          throw new Error('Please enter a new password.');
        }

        if (formData.new_password !== formData.confirm_password) {
          throw new Error('Passwords do not match.');
        }

        await resetPassword({
          token: formData.reset_token.trim(),
          new_password: formData.new_password,
        });

        setSuccessMessage('Your password was updated. You can sign in now.');
        setMode('login');
        setFormData((prev) => ({
          ...prev,
          password: '',
          confirm_password: '',
          new_password: '',
          reset_token: '',
        }));
        return;
      }

      const loginPayload = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const registrationPayload = {
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
      };

      let authenticatedUser = null;
      let tokenResponse = null;

      if (isLogin) {
        tokenResponse = await loginUser(loginPayload);
      } else {
        const registrationResponse = await registerUser(registrationPayload);
        authenticatedUser = normalizeAuthenticatedUser(registrationResponse);
        tokenResponse = await loginUser(loginPayload);
      }

      const accessToken = extractAccessToken(tokenResponse);

      if (!accessToken) {
        throw new Error('Authentication succeeded but no access token was returned.');
      }

      const fallbackUser =
        authenticatedUser ??
        normalizeAuthenticatedUser(tokenResponse) ?? {
          id: null,
          email: formData.email.trim(),
          full_name: formData.full_name.trim() || '',
          created_at: '',
        };

      setAccessToken(accessToken);
      setStoredUser(fallbackUser);

      await onAuthSuccess(fallbackUser);
      onClose();
    } catch (err) {
      if (isUnauthorizedError(err)) {
        setAccessToken('');
        setStoredUser(null);
      }

      setError(err?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleGoogleSignIn = () => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    window.location.assign(resolveApiEndpoint('/auth/google'));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
              AI Meeting Notes
            </p>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              isRegister ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="#4285F4"
              d="M21.35 11.1h-9.18v2.94h5.28c-.23 1.34-1.42 3.92-5.28 3.92-3.18 0-5.77-2.63-5.77-5.87s2.59-5.87 5.77-5.87c1.81 0 3.02.77 3.72 1.44l2.53-2.44C17.6 3.65 15.24 2.67 12.17 2.67 6.71 2.67 2.27 7 2.27 12.46S6.71 22.25 12.17 22.25c5.7 0 9.47-4.02 9.47-9.69 0-.65-.07-1.15-.29-1.46Z"
            />
          </svg>
          Continue with Google
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          )}

          {(isLogin || isRegister || isForgotPassword) && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          )}

          {(isLogin || isRegister) && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none"
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
          )}

          {isForgotPassword && (
            <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
              Enter the email address associated with your account and we will send reset instructions.
            </p>
          )}

          {isResetPassword && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reset Token
                </label>
                <input
                  type="text"
                  value={formData.reset_token}
                  onChange={handleInputChange('reset_token')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Paste the token from your email link"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={handleInputChange('new_password')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none"
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
            </>
          )}

          {successMessage && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait...
              </span>
            ) : isForgotPassword ? (
              'Send reset email'
            ) : isResetPassword ? (
              'Update password'
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-center">
          {isLogin && (
            <button
              type="button"
              onClick={() => handleModeChange('forgot')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </button>
          )}

          {(isLogin || isRegister) && (
            <button
              type="button"
              onClick={() => handleModeChange(isLogin ? 'register' : 'login')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          )}

          {(isForgotPassword || isResetPassword) && (
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Back to sign in
            </button>
          )}
        </div>

        {(isForgotPassword || isResetPassword) && (
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Return to login
          </button>
        )}
      </div>
    </div>
  );
}
