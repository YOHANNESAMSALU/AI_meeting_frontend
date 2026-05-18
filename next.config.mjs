const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://ai-meeting-backend-dvt7.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
