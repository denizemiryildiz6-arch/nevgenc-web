# HTTP Güvenlik Başlıkları

GitHub Pages HTTPS sağlar ancak proje seviyesinde keyfi HTTP response header tanımlama imkânı sınırlıdır. NevGenç belediye alan adına/reverse proxy'ye taşındığında aşağıdaki başlıklar origin/CDN seviyesinde verilmelidir.

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: default-src 'self'; script-src 'self' https://unpkg.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; upgrade-insecure-requests
```

`frame-ancestors` ve HSTS gibi bazı direktifler `<meta>` ile güvenilir biçimde uygulanamaz; HTTP response header olarak verilmelidir.
