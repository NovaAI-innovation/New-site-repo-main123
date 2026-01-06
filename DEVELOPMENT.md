# Local Development Guide

This guide explains how to run the website locally to see the gallery images and test changes.

## Quick Start - Opening as a File (NEW!)

**Good news!** With the cloud-hosted API, you can now **open gallery.html directly** without running any servers!

Simply double-click `gallery.html` or any HTML file and it will fetch images from the production API at:
`https://backend-drab-alpha-85.vercel.app`

This works because:
- The API is cloud-hosted and publicly accessible
- CORS is configured to allow file:// protocol (null origin)
- The configuration auto-detects and uses the production URL

## Prerequisites for Local Development

- Python 3.7+ (optional, only if testing with local backend)
- A web browser (Chrome, Firefox, Edge, etc.)

## API Configuration

The website automatically detects which API to use:

| Environment | API URL | How to Access |
|------------|---------|---------------|
| **File Protocol** | https://backend-drab-alpha-85.vercel.app | Double-click HTML files |
| **Production** | https://backend-drab-alpha-85.vercel.app | Any hosted domain |
| **Local Dev** | http://localhost:8000 | http://localhost:8080 |

The configuration is in `api-config.js` and automatically switches based on hostname.

## Running in Development Mode (Optional)

**Note:** You only need this if you want to test backend changes locally. For frontend development, just open the files directly!

### Step 1: Start the Backend API Server (Optional)

The backend serves the gallery images from the database.

```bash
# Navigate to the backend directory
cd backend

# Start the FastAPI server (if using uvicorn)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# OR if using Python directly
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: **http://localhost:8000**

You can verify it's running by visiting: http://localhost:8000/health

### Step 2: Start the Frontend Development Server

The frontend needs to be served via HTTP (not opened directly as a file).

**Option A: Using Python's built-in HTTP server (recommended for quick testing)**

```bash
# Navigate to the frontend directory
cd New-site-repo-main

# Start a simple HTTP server on port 8080
python -m http.server 8080

# OR for Python 2
python -m SimpleHTTPServer 8080
```

**Option B: Using Node.js http-server (if you have Node installed)**

```bash
# Install http-server globally (one time only)
npm install -g http-server

# Navigate to the frontend directory
cd New-site-repo-main

# Start the server
http-server -p 8080
```

**Option C: Using VS Code Live Server extension**

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` or `gallery.html`
3. Select "Open with Live Server"

### Step 3: Access the Gallery

Open your browser and navigate to:

- **Gallery page**: http://localhost:8080/gallery.html
- **Test page**: http://localhost:8080/test-gallery-api.html
- **Home page**: http://localhost:8080/index.html

## Important Notes

### ⚠️ Do NOT open HTML files directly

**Don't do this:**
- Double-clicking HTML files to open in browser
- Using `file:///` URLs

**Why?** Browser security policies block API requests when using the `file://` protocol.

**Always do this:**
- Serve files through an HTTP server
- Access via `http://localhost:8080`

### Automatic Environment Detection

The `api-config.js` file automatically detects your environment:

- **When hostname is `localhost` or `127.0.0.1`**: Uses `http://localhost:8000` as the API URL
- **When deployed to production**: Update line 36 in `api-config.js` with your production API URL

### Manual API URL Override (for testing)

You can manually override the API URL in the browser console:

```javascript
// Set a custom API URL
localStorage.setItem('API_BASE_URL', 'http://localhost:8000');

// Remove the override
localStorage.removeItem('API_BASE_URL');

// Reload the page to apply changes
location.reload();
```

## Troubleshooting

### Gallery shows "Loading gallery..." forever

**Causes:**
1. Backend server is not running
2. Backend is running on a different port
3. CORS issues

**Solutions:**
1. Check if backend is running: http://localhost:8000/health
2. Check backend logs for errors
3. Open browser console (F12) and look for error messages
4. Verify you're accessing via `http://localhost:8080` (not `file://`)

### Gallery shows "No images available"

**Causes:**
1. Database is empty
2. Backend connection is working but no images are stored

**Solutions:**
1. Check the API directly: http://localhost:8000/api/gallery-images
2. Use the CMS to upload images
3. Check backend logs

### CORS errors in browser console

**Causes:**
- Frontend origin not in backend's CORS allowed origins

**Solutions:**
1. Check `backend/app/config.py` - ensure your port is in `CORS_ORIGINS`
2. Default allowed origins include:
   - http://localhost:8080
   - http://localhost:3000
   - http://localhost:5500
3. If using a different port, add it to `CORS_ORIGINS` in the backend config

### Images fail to load (broken image icons)

**Causes:**
- Cloudinary URLs are invalid or expired
- Network connectivity issues

**Solutions:**
1. Check if you can access a Cloudinary URL directly in your browser
2. Verify Cloudinary configuration in backend
3. Check browser network tab (F12) for failed requests

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd New-site-repo-main
python -m http.server 8080

# Then open in browser:
# http://localhost:8080/gallery.html
```

## Production Deployment

When deploying to production:

1. Update line 36 in `api-config.js` with your production API URL:
   ```javascript
   return 'https://your-api-domain.com';
   ```

2. Ensure your production backend includes your production frontend domain in `CORS_ORIGINS`

3. Consider using environment variables or a build process to manage different configurations

## Useful Development URLs

- Backend API Health: http://localhost:8000/health
- Database Health: http://localhost:8000/health/db
- Cloudinary Health: http://localhost:8000/health/cloudinary
- Gallery Images API: http://localhost:8000/api/gallery-images
- API Documentation (if enabled): http://localhost:8000/docs
- Frontend Gallery: http://localhost:8080/gallery.html
- API Connection Test: http://localhost:8080/test-gallery-api.html
