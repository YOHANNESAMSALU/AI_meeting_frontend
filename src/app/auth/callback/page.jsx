import AuthCallbackClient from './AuthCallbackClient';

function readToken(searchParams) {
  if (!searchParams) {
    return '';
  }

  const value =
    searchParams.token ||
    searchParams.access_token ||
    searchParams.accessToken ||
    searchParams.sessionToken ||
    '';

  return typeof value === 'string' ? value.trim() : '';
}

export default function AuthCallbackPage({ searchParams }) {
  return <AuthCallbackClient token={readToken(searchParams)} />;
}
