# Deployment Guide - Meta Ads Spy

This guide covers deploying your Meta Ads Spy service to various cloud platforms and servers.

## Quick Deploy Options (Recommended)

### 1. **Heroku** (Easiest - Free tier available)

#### Setup Steps:
1. **Install Heroku CLI**:
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set META_ACCESS_TOKEN=your_token
   heroku config:set META_APP_ID=your_app_id
   heroku config:set META_APP_SECRET=your_app_secret
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

5. **Open Your App**:
   ```bash
   heroku open
   ```

**Cost**: Free tier available, paid plans start at $7/month

---

### 2. **Vercel** (Great for Node.js apps)

#### Setup Steps:
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables** via Vercel dashboard:
   - Go to your project settings
   - Add `META_ACCESS_TOKEN`, `META_APP_ID`, `META_APP_SECRET`

**Cost**: Free tier generous, pro plans start at $20/month

---

### 3. **Railway** (Modern alternative to Heroku)

#### Setup Steps:
1. **Connect GitHub**:
   - Go to https://railway.app
   - Connect your GitHub account
   - Select your `meta-ads-spy` repository

2. **Set Environment Variables** in Railway dashboard:
   - `META_ACCESS_TOKEN`
   - `META_APP_ID` 
   - `META_APP_SECRET`
   - `PORT` (automatically set by Railway)

3. **Deploy**: Automatic on git push

**Cost**: $5/month for starter plan

---

### 4. **DigitalOcean App Platform**

#### Setup Steps:
1. **Connect Repository**:
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository

2. **Configure Build**:
   - Build Command: `npm install`
   - Run Command: `npm start`

3. **Set Environment Variables** in app settings

**Cost**: $5-12/month depending on resources

---

## VPS/Server Options (More Control)

### 5. **DigitalOcean Droplet** (Recommended VPS)

#### Server Setup:
```bash
# Create Ubuntu 20.04 droplet ($6/month)
# SSH into your server

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone your repository
git clone https://github.com/johnbukhin/meta-ads-spy.git
cd meta-ads-spy

# Install dependencies
npm install --production

# Create environment file
nano .env
# Add your environment variables

# Start with PM2
pm2 start server.js --name "meta-ads-spy"
pm2 startup
pm2 save

# Install Nginx for reverse proxy
sudo apt install nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/meta-ads-spy
```

#### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/meta-ads-spy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Cost**: $6/month for basic droplet

---

### 6. **AWS EC2** (Enterprise-grade)

#### Setup Steps:
1. **Launch EC2 Instance**:
   - Choose Ubuntu 20.04 LTS
   - t2.micro (free tier eligible)
   - Configure security groups (ports 22, 80, 443)

2. **Server Setup** (same as DigitalOcean)

3. **Optional**: Use AWS Application Load Balancer for SSL

**Cost**: Free tier for 12 months, then ~$8/month

---

## Production Configuration Files

Let me add production-ready configuration files to your project:

### PM2 Ecosystem File
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'meta-ads-spy',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - META_ACCESS_TOKEN=${META_ACCESS_TOKEN}
      - META_APP_ID=${META_APP_ID}
      - META_APP_SECRET=${META_APP_SECRET}
    restart: unless-stopped
```

---

## Recommended Deployment Path

### For Beginners:
1. **Heroku** - Easiest setup, free tier
2. **Vercel** - Great performance, simple deployment

### For Intermediate:
1. **Railway** - Modern, good pricing
2. **DigitalOcean App Platform** - Balanced features

### For Advanced:
1. **DigitalOcean Droplet** - Full control, great value
2. **AWS EC2** - Enterprise features, scalable

---

## Security Considerations

### Environment Variables
Never commit these to your repository:
- `META_ACCESS_TOKEN`
- `META_APP_SECRET`
- Any database credentials

### HTTPS
Always use HTTPS in production:
- Free SSL with Let's Encrypt
- Cloudflare for additional protection

### Rate Limiting
Consider adding additional rate limiting for public access:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## Monitoring & Maintenance

### Health Checks
Add a health endpoint:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

### Logging
Use structured logging:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Backup Strategy
- Regular database backups (if you add a database)
- Code is backed up in GitHub
- Environment variables documented securely

---

## Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| Heroku | 550 hours/month | $7/month | Beginners |
| Vercel | Generous free | $20/month | Frontend focus |
| Railway | Limited free | $5/month | Modern workflow |
| DigitalOcean | None | $5-12/month | Balanced |
| VPS | None | $6/month | Full control |
| AWS | 12 months free | $8+/month | Enterprise |

---

## Quick Start: Deploy to Heroku Now

If you want to deploy immediately:

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-meta-ads-spy

# Set environment variables
heroku config:set META_ACCESS_TOKEN=your_token_here
heroku config:set META_APP_ID=your_app_id_here
heroku config:set META_APP_SECRET=your_app_secret_here

# Deploy
git push heroku main

# Open your live app
heroku open
```

Your Meta Ads Spy will be live at: `https://your-meta-ads-spy.herokuapp.com`

Need help with any specific deployment option? Let me know!