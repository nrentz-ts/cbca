# Code Based Custom Actions - ThoughtSpot Embed App

A web application demonstrating ThoughtSpot's Visual Embed SDK with custom actions.

## Features

- **Liveboard Embed**: Display ThoughtSpot liveboards
- **Full App Embed**: Embed the complete ThoughtSpot application
- **Search Embed**: Enable natural language search functionality
- **Spotter Embed**: AI-powered assistant for data exploration
- **Searchbar Embed**: Quick search interface

## Tech Stack

- Vanilla JavaScript (ES6 Modules)
- ThoughtSpot Visual Embed SDK v1.42.0
- HTML5 & CSS3

## Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Deploy to Vercel

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your GitHub repository: `https://github.com/nrentz-ts/cbca`
5. Click "Deploy"

Vercel will automatically detect this as a static site and deploy it.

## Project Structure

```
├── index.html          # Main HTML file
├── index.js            # Main JavaScript logic
├── script.js           # Additional scripts
├── actions.js          # Custom actions logic
├── style.css           # Styles
├── package.json        # Dependencies
└── vercel.json         # Vercel configuration
```

## Configuration

The application uses ThoughtSpot's Visual Embed SDK. Make sure to configure your ThoughtSpot instance details in the `index.js` file.

## License

Private

