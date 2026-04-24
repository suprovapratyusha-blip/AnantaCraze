# Deployment Guide

This project has three deployable apps:

- `frontend`: customer website
- `admin`: admin panel
- `backend`: Express API

## Recommended hosting

- Deploy `frontend` on Vercel
- Deploy `admin` on Vercel
- Deploy `backend` on Vercel or Render

Vercel is already a good fit here because the frontend already includes a `vercel.json`, and the backend also has Vercel config.

## Before you deploy

1. Rotate any secrets that were ever stored in `backend/.env`
2. Make sure `.env` files are not committed
3. Push this repo to GitHub

If `node_modules` is already tracked by git, remove it from git tracking before pushing:

```bash
git rm -r --cached frontend/node_modules admin/node_modules backend/node_modules
git commit -m "Stop tracking node_modules"
```

## Environment variables

### Backend

Set these in the backend hosting dashboard:

- `MONGODB_URI`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_SECRET_KEY`
- `CLOUDINARY_NAME`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `STRIPE_SECRET_KEY`
- `CORS_ORIGINS`

Example `CORS_ORIGINS` value:

```text
https://your-frontend.vercel.app,https://your-admin.vercel.app
```

### Frontend

Set this in the `frontend` project:

- `VITE_BACKEND_URL`

Example:

```text
https://your-backend-domain.com
```

### Admin

Set this in the `admin` project:

- `VITE_BACKEND_URL`

Example:

```text
https://your-backend-domain.com
```

## Step-by-step on Vercel

### 1. Push the repo to GitHub

Create a GitHub repository and push this project.

### 2. Deploy the backend

1. In Vercel, click `Add New > Project`
2. Import your GitHub repository
3. Set the root directory to `backend`
4. Add all backend environment variables
5. Deploy
6. Open the deployment URL and confirm `/` returns `API Working`

Save that backend URL. You will use it in the frontend and admin apps.

### 3. Deploy the frontend

1. In Vercel, create another project from the same repo
2. Set the root directory to `frontend`
3. Add `VITE_BACKEND_URL` with your backend URL
4. Deploy

### 4. Deploy the admin panel

1. In Vercel, create one more project from the same repo
2. Set the root directory to `admin`
3. Add `VITE_BACKEND_URL` with your backend URL
4. Deploy

## Connect a custom domain

After all three apps are live:

- attach your main domain to `frontend`
- attach an admin subdomain like `admin.yourdomain.com` to `admin`
- attach an API subdomain like `api.yourdomain.com` to `backend`

Then update:

- `CORS_ORIGINS` in backend with the real frontend and admin domains
- `VITE_BACKEND_URL` in frontend/admin to your final API domain

Redeploy after changing env vars.

## Optional: use Render for backend instead

If you prefer Render for the API:

1. Create a new `Web Service`
2. Connect the repo
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add the same backend environment variables
7. Deploy

Then use the Render backend URL as `VITE_BACKEND_URL` in both Vercel frontend projects.
