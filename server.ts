import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 300;
const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodically prune expired rate-limit entries to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  const cspDirectives = [
    "default-src 'self'",
    isProd ? "script-src 'self'" : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    isProd ? "connect-src 'self'" : "connect-src 'self' ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  next();
}

function pathGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  const rawUrl = req.originalUrl || req.url;

  // Reject null bytes
  if (rawUrl.includes('\0') || rawUrl.toLowerCase().includes('%00')) {
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(req.path);
  } catch {
    res.status(400).json({ error: 'Malformed URI' });
    return;
  }

  // Block path traversal and sensitive hidden dotfiles (.env, .git, etc.)
  const segments = decodedPath.split('/');
  const hasTraversal = segments.some((seg) => seg === '..');
  const hasSensitiveDotfile = segments.some(
    (seg) => seg.startsWith('.') && seg !== '.' && seg !== '..' && seg !== '.well-known'
  );

  if (hasTraversal || hasSensitiveDotfile) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // In production, block direct access to source/config/script directories
  if (isProd && /^\/(src|scripts|server\.ts|package\.json|tsconfig\.json)(\/|$)/i.test(decodedPath)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const existing = rateLimitStore.get(clientIp);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  existing.count += 1;
  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader('Retry-After', String(Math.ceil((existing.resetAt - now) / 1000)));
    res.status(429).json({ error: 'Too Many Requests' });
    return;
  }

  next();
}

async function startServer(): Promise<void> {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(securityHeadersMiddleware);
  app.use(pathGuardMiddleware);
  app.use(rateLimitMiddleware);

  // Restrict allowed HTTP methods for this read-only audio player site
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        dotfiles: 'deny',
        etag: true,
        maxAge: '1h',
        index: 'index.html',
      })
    );

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Global error handler preventing internal stack trace disclosure
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
