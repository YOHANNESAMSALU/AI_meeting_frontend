import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, RefreshCcw, X } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-10 rounded-full p-2 text-gray-500 hover:bg-gray-100"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="grid md:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              AI
            </div>
          </div>

          <h2 className="text-4xl font-normal text-[#202124]">
            {isLogin
              ? "Sign in"
              : isRegister
              ? "Create account"
              : isForgotPassword
              ? "Forgot password"
              : "Reset password"}
          </h2>

          <p className="mt-4 text-base text-[#5f6368]">
            Access your AI Meeting Notes workspace and continue where you left
            off.
          </p>

          <div className="mt-10 hidden md:block">
            <div className="rounded-2xl border border-gray-200 p-5">
              <h4 className="font-medium text-gray-900">
                AI Meeting Notes
              </h4>
              <p className="mt-2 text-sm text-gray-600">
                Capture meetings, generate summaries, and collaborate with your
                team using AI.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="border-t md:border-l md:border-t-0 border-gray-100 p-8 md:p-12">

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white text-sm font-medium text-[#3c4043] transition hover:bg-gray-50"
          >
            <FcGoogle className="h-5 w-5" />

            Continue with Google
          </button>

          <div className="my-8 flex items-center">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {isRegister && (
              <div className="relative">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange("full_name")}
                  placeholder="Full Name"
                  className="h-14 w-full rounded-lg border border-[#dadce0] px-4 text-sm outline-none focus:border-[#1a73e8]"
                  required
                />
              </div>
            )}

            {(isLogin || isRegister || isForgotPassword) && (
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="Email"
                  className="h-14 w-full rounded-lg border border-[#dadce0] px-4 text-sm outline-none focus:border-[#1a73e8]"
                  required
                />
              </div>
            )}

            {(isLogin || isRegister) && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  placeholder="Password"
                  className="h-14 w-full rounded-lg border border-[#dadce0] px-4 pr-12 text-sm outline-none focus:border-[#1a73e8]"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            )}

            {isForgotPassword && (
              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                Enter your email address and we'll send password reset
                instructions.
              </div>
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

            <div className="flex items-center justify-between pt-4">

              <button
                type="button"
                onClick={() =>
                  handleModeChange(
                    isLogin ? "register" : "login"
                  )
                }
                className="text-sm font-medium text-[#1a73e8]"
              >
                {isLogin
                  ? "Create account"
                  : "Already have an account?"}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-[#1a73e8] px-8 py-2.5 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : isForgotPassword ? (
                  "Send Email"
                ) : isLogin ? (
                  "Next"
                ) : (
                  "Create Account"
                )}
              </button>

            </div>

            {isLogin && (
              <button
                type="button"
                onClick={() => handleModeChange("forgot")}
                className="text-sm text-[#1a73e8]"
              >
                Forgot password?
              </button>
            )}
          </form>

        </div>
      </div>
    </div>
  </div>
);
}
