import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { isUnauthorizedError, loginUser, registerUser, setAccessToken, setStoredUser } from '../lib/api';

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

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginPayload = { email: formData.email, password: formData.password };
      const registrationPayload = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
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

      const fallbackUser = authenticatedUser ?? normalizeAuthenticatedUser(tokenResponse) ?? {
        id: null,
        email: formData.email,
        full_name: formData.full_name || '',
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

      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', full_name: '' });
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
