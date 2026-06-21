import type { NextConfig } from "next";

const SUPABASE_HOST = "vorcxrxggfybhucpimfx.supabase.co";

const securityHeaders = [
  // Prevent iframing — private internal tool must not be embeddable
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Block MIME sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Enforce HTTPS for 1 year, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Disable referrer information from private internal URLs
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Restrict browser features not needed by a private operations tool
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content-Security-Policy
  // - default-src: restrict to self
  // - script-src: self + Next.js inline scripts (unsafe-inline required for Next.js App Router)
  // - style-src: self + unsafe-inline for Tailwind CSS
  // - connect-src: self + Supabase REST/Auth/Storage/Realtime
  // - img-src: self + data URIs (for base64 previews)
  // - font-src: self only (fonts are local, no external CDN)
  // - object-src: none
  // - frame-ancestors: none (belt-and-braces with X-Frame-Options)
  // - base-uri: self
  // - form-action: self
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
      `style-src 'self' 'unsafe-inline'`,
      `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST}`,
      `img-src 'self' data: blob: https://${SUPABASE_HOST} https://api.qrserver.com`,
      `font-src 'self'`,
      `object-src 'none'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // pdf-parse (and its dependency pdfjs-dist) use a Web Worker internally.
  // When Webpack bundles them for the server it cannot resolve the worker chunk
  // path (.next/dev/server/chunks/pdf.worker.mjs), causing a 500 on the
  // /api/documents/[documentId]/extract route.
  // Externalising them forces Node.js to require() them directly, bypassing
  // the Webpack bundle and the missing-worker problem entirely.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
