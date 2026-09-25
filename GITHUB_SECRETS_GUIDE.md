# GitHub Secrets Setup Guide for NewsAxis

This guide provides step-by-step instructions on how to securely save your Appwrite credentials in GitHub Secrets for CI/CD, deployments, and production environments.

---

## 1. Secrets Overview

Add the following repository secrets in your GitHub repository:

| Secret Name | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `VITE_APPWRITE_ENDPOINT` | `https://sgp.cloud.appwrite.io/v1` | Appwrite API endpoint (Singapore regional endpoint for project `6a854c5d0026a9224d01`) |
| `VITE_APPWRITE_PROJECT_ID` | `6a854c5d0026a9224d01` | Your Appwrite Project ID |
| `APPWRITE_API_KEY` | `standard_8d908df942748395872387098595c63acf0c28d30f846fb749285c398d63595a6e3362097e8d7870c13ee7fcfae4f1e8fbdded73e5afb31dc5cd3c9a409696f4439bb4040cf0c426a1d5411361745933485d020a42071d677e23f95a72bc9e6f88ea42cbe60883c8fdf477595a0595a83394cb2cf5d3d0aeb65688bb8b71a3eb` | Server API key for backend ingestion, TTL cleanup, and storage |
| `VITE_APPWRITE_DATABASE_ID` | `6ab613fc0006b9fedac1` | Database ID (`newsaxis-main`) |
| `VITE_APPWRITE_BUCKET_ID` | `6ab614cc0022aa43fab8` | Storage Bucket ID (`newsaxis-media`) |

---

## 2. Step-by-Step GitHub Configuration

1. Navigate to your repository: **`https://github.com/rgokul08/NewsAxis`**
2. Click on the **Settings** tab (gear icon at the top of the repository).
3. In the left sidebar, expand **Secrets and variables** and select **Actions**.
4. Click the green **New repository secret** button.
5. Add each secret name and value from the table above:
   - Name: `VITE_APPWRITE_ENDPOINT`, Secret: `https://sgp.cloud.appwrite.io/v1`
   - Name: `VITE_APPWRITE_PROJECT_ID`, Secret: `6a854c5d0026a9224d01`
   - Name: `APPWRITE_API_KEY`, Secret: `standard_8d908df942748395872387098595c63acf0c28d30f846fb749285c398d63595a6e3362097e8d7870c13ee7fcfae4f1e8fbdded73e5afb31dc5cd3c9a409696f4439bb4040cf0c426a1d5411361745933485d020a42071d677e23f95a72bc9e6f88ea42cbe60883c8fdf477595a0595a83394cb2cf5d3d0aeb65688bb8b71a3eb`
   - Name: `VITE_APPWRITE_DATABASE_ID`, Secret: `6ab613fc0006b9fedac1`
   - Name: `VITE_APPWRITE_BUCKET_ID`, Secret: `6ab614cc0022aa43fab8`
6. Click **Add secret** for each.

---

## 3. GitHub Actions CI/CD Integration

To inject these secrets during your build or deployment workflow, reference them in your `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy NewsAxis

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build frontend with Appwrite environment
        env:
          VITE_APPWRITE_ENDPOINT: ${{ secrets.VITE_APPWRITE_ENDPOINT }}
          VITE_APPWRITE_PROJECT_ID: ${{ secrets.VITE_APPWRITE_PROJECT_ID }}
          VITE_APPWRITE_DATABASE_ID: ${{ secrets.VITE_APPWRITE_DATABASE_ID }}
          VITE_APPWRITE_BUCKET_ID: ${{ secrets.VITE_APPWRITE_BUCKET_ID }}
        run: npm run build
```

---

## 4. Local Development

For local development, these same keys are saved in your `.env.local` file (which is git-ignored and never committed to version control).
