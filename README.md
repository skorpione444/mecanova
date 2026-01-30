# Mecanova

Premium Spirits Import & Distribution - Landing Page

A modern, elegant landing page for Mecanova, showcasing premium agave spirits (Tequila, Mezcal, Raicilla) and premium spirits distribution services.

## Features

- Modern, responsive design with dark theme
- Tailwind CSS via CDN
- Iconify icons integration
- Custom typography (JetBrains Mono, Jost, Manrope, Playfair Display)
- Portfolio showcase section
- Contact form
- Smooth animations and transitions

## Getting Started

Simply open `index.html` in your browser to view the landing page.

## Technologies Used

- HTML5
- Tailwind CSS (Browser CDN)
- Iconify Icons
- Google Fonts

## Development

Simply open `index.html` in your browser to view the landing page.

For local development with Mapbox:
1. Create a `config.js` file in the root directory with:
   ```javascript
   window.MAPBOX_TOKEN = 'your_mapbox_token_here';
   ```
2. The `config.js` file is gitignored for security.

## Netlify Deployment

This site is configured to deploy on Netlify with automatic Mapbox token injection.

### Setup Instructions:

1. **Connect your GitHub repository to Netlify**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub repository

2. **Set the Mapbox Token Environment Variable**
   - In Netlify dashboard, go to: **Site settings** > **Environment variables**
   - Click **Add variable**
   - Variable name: `MAPBOX_TOKEN`
   - Variable value: Your Mapbox access token (starts with `pk.eyJ...`)
   - Click **Save**

3. **Deploy**
   - Netlify will automatically build and deploy your site
   - The build script (`build-config.js`) will generate `config.js` from the environment variable
   - The Mapbox globe should now work on your deployed site

### Build Process

The build process automatically:
- Reads the `MAPBOX_TOKEN` environment variable
- Generates `config.js` with the token
- Deploys the site with the generated config file

**Note:** The `config.js` file is gitignored for security. It's generated during the Netlify build process from environment variables.

