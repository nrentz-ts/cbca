# Code Based Custom Actions - ThoughtSpot Embed App

A web application demonstrating ThoughtSpot's Visual Embed SDK with custom actions.

## Configuration

The application uses ThoughtSpot's Visual Embed SDK. Make sure to configure your ThoughtSpot instance details in the `index.js` file.

### ThoughtSpot Host

This demo is currently configured to run from:
- **Host**: `https://pm-aws-v1.thoughtspotstaging.cloud`

To use a different ThoughtSpot instance, update the `tsClusterUrl` variable in `index.js`.

## Features

- **Liveboard Embed**: Display ThoughtSpot liveboards - this is where most custom actions of the demo reside.
- **Full App Embed**: Embed the complete ThoughtSpot application
- **Search Embed**: Enable natural language search functionality
- **Spotter Embed**: AI-powered assistant for data exploration
- **Searchbar Embed**: Quick search interface

## Tech Stack
<details>
- Vanilla JavaScript (ES6 Modules)
- ThoughtSpot Visual Embed SDK v1.42.0
- HTML5 & CSS3
</details>

## Local Development
<details>

### Prerequisites

Before you begin, make sure you have the following installed on your computer:
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/downloads)

To verify they're installed, open your terminal and run:
```bash
node --version
npm --version
git --version
```

### Step-by-Step Setup

1. **Clone the repository**
   
   Open your terminal and run:
   ```bash
   git clone https://github.com/nrentz-ts/cbca.git
   ```

2. **Navigate to the project folder**
   
   ```bash
   cd cbca
   ```

3. **Install dependencies**
   
   This will download all the required packages:
   ```bash
   npm install
   ```

4. **Run the development server**
   
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Open your web browser and go to:
   ```
   http://localhost:3000
   ```

That's it! The application should now be running locally on your machine.

### Stopping the Server

To stop the development server, press `Ctrl + C` in your terminal.
</details>

## Deploy to Vercel
<details>

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
</details>

## License

Private

