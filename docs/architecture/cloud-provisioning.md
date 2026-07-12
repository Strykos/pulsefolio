# Cloud Provisioning Checklist

## Accounts to create
- [ ] GitHub repo: `pulsefolio`
- [ ] Vercel — web dashboard
- [ ] Railway or Fly.io — API + worker
- [ ] Neon — PostgreSQL (staging + prod branches)
- [ ] Upstash — Redis
- [ ] Cloudflare — DNS for pulsefolio.io

## Environment variables

### Vercel (apps/web)
```
NEXT_PUBLIC_API_URL=https://api.pulsefolio.io
NEXT_PUBLIC_WS_URL=wss://api.pulsefolio.io/api/v1/stream
```

### Railway (API)
```
DATABASE_URL=postgresql://...@neon.tech/pulsefolio
REDIS_URL=rediss://...@upstash.io
JWT_SECRET=<random-64-chars>
CORS_ORIGINS=https://app.pulsefolio.io,http://localhost:3000
OPENAI_API_KEY=<optional>
```

### Railway (Worker)
```
DATABASE_URL=<same as API>
REDIS_URL=<same as API>
```

## DNS
| Record | Target |
|--------|--------|
| app.pulsefolio.io | Vercel CNAME |
| api.pulsefolio.io | Railway CNAME |

## Staging
- staging.pulsefolio.io → Vercel preview
- api-staging.pulsefolio.io → Railway staging service
- Neon staging branch

## Estimated cost
~$20–40/month at low traffic
