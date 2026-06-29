/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API calls to backend in dev. In production, Vercel rewrites handle this.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.hackdemo.win/api/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
};

module.exports = nextConfig;
