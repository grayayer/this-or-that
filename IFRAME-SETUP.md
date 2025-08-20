# Iframe Embedding Setup Guide

This guide explains how to configure your server to allow iframe embedding of the This or That app from specified domains.

## Problem Solved

The `frame-ancestors` directive in Content-Security-Policy cannot be set via HTML `<meta>` tags - it must be configured as an HTTP header on your web server.

## Server Configuration Files

I've created configuration files for the most common hosting platforms:

### 1. Apache (.htaccess)

- **File**: `.htaccess`
- **Usage**: Place in your website's root directory
- **Hosting**: Most shared hosting, cPanel, Apache servers

### 2. Netlify (_headers)

- **File**: `_headers`
- **Usage**: Place in your website's root directory
- **Hosting**: Netlify deployments

### 3. Vercel (vercel.json)

- **File**: `vercel.json`
- **Usage**: Place in your website's root directory
- **Hosting**: Vercel deployments

### 4. Nginx (nginx.conf)

- **File**: `nginx.conf`
- **Usage**: Add directives to your server block
- **Hosting**: VPS, dedicated servers with Nginx

## Allowed Domains

The configuration allows iframe embedding from these domains:

- `'self'` (same origin)
- `https://stg-datahub-stage.kinsta.cloud`
- `https://datahub.com`
- `https://demo.datahub.com`
- `https://data.test`
- `https://studiok40.com`

## Testing Iframe Embedding

### 1. Deploy with Configuration

Deploy your app with the appropriate configuration file for your hosting platform.

### 2. Test with Gated Demo

Use the provided `gated-demo.html` file to test iframe embedding:

```html
<iframe
    src="https://thisorthat.app/index.html"
    width="100%"
    height="600"
    frameborder="0">
</iframe>
```

### 3. Verify Headers

Check that the headers are being sent correctly:

```bash
curl -I https://thisorthat.app/index.html
```

Look for:

```
Content-Security-Policy: frame-ancestors 'self' https://stg-datahub-stage.kinsta.cloud https://datahub.com https://demo.datahub.com https://data.test https://studiok40.com;
```

## Troubleshooting

### Console Error: "Refused to display in a frame"

- **Cause**: CSP headers not configured correctly
- **Solution**: Ensure the correct configuration file is deployed and active

### Console Error: "frame-ancestors directive is ignored"

- **Cause**: Trying to set CSP via meta tag
- **Solution**: Use server-level configuration (already fixed)

### Headers Not Applied

- **Apache**: Ensure mod_headers is enabled
- **Nginx**: Restart nginx after configuration changes
- **Netlify/Vercel**: Redeploy after adding configuration files

## Adding New Domains

To allow embedding from additional domains, add them to the `frame-ancestors` directive:

```
frame-ancestors 'self' https://example.com https://another-domain.com;
```

## Security Notes

- The configuration includes additional security headers
- CORS is enabled for API requests
- Static assets are cached for performance
- XSS protection and content type sniffing prevention are enabled

## Files Overview

- `gated-demo.html` - Demo gating page with HubSpot form integration
- `index.html` - Main application (CSP meta tag removed)
- `.htaccess` - Apache configuration
- `_headers` - Netlify configuration
- `vercel.json` - Vercel configuration
- `nginx.conf` - Nginx configuration example
