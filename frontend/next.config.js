/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress the X-Powered-By header
  poweredByHeader: false,

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Limit referrer information on cross-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HSTS — enforce HTTPS for 2 years (with preload readiness)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Permissions Policy — disable features the app never uses
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // CSP — allow only the origins the app actually needs
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inline scripts + PayPal SDK + FFmpeg WASM
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.paypalobjects.com",
              // Tailwind generates inline styles
              "style-src 'self' 'unsafe-inline'",
              // Images from any HTTPS source (Google profile pics, R2 storage, etc.)
              "img-src 'self' https: data:",
              // Backend API + Google OAuth redirect endpoint
              "connect-src 'self' https://api.hackdemo.win https://accounts.google.com https://www.paypal.com",
              // PayPal renders its buttons in an iframe
              "frame-src https://www.paypal.com",
              // System fonts
              "font-src 'self'",
              // No <base> element
              "base-uri 'self'",
              // Restrict form submissions
              "form-action 'self' https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },

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
