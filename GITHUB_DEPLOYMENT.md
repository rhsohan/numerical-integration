# Hosting Your Website Live on GitHub Pages

This guide outlines exactly how to create a GitHub repository for this project and host it live on the web for free using **GitHub Pages** with the automated **GitHub Actions** workflow already configured in your workspace.

---

## Prerequisites
1. A free account on [GitHub](https://github.com/).
2. [Git](https://git-scm.com/) installed on your local computer.

---

## Step-by-Step Hosting Guide

### Step 1: Initialize Git locally
Open your terminal (PowerShell, Command Prompt, or Git Bash) inside your project directory (`c:\laragon\www\numerical`) and run the following commands to initialize your local repository and commit your files:

```bash
# Initialize local Git repository
git init

# Add all files to staging (including the new GitHub workflow)
git add .

# Create the initial commit
git commit -m "Initial commit with SVG dividers, favicon, and GitHub Pages workflow"

# Rename default branch to main
git branch -M main
```

---

### Step 2: Create a new repository on GitHub
1. Log in to [GitHub](https://github.com/).
2. Click the **"+"** icon in the top-right corner and select **New repository**.
3. Name your repository (for example, `numerical-integration`).
4. Keep the repository **Public** (required for free GitHub Pages hosting).
5. **Do NOT** check "Add a README file", "Add .gitignore", or "Choose a license" (since we already have local files).
6. Click **Create repository**.

---

### Step 3: Link your local project to GitHub and Push
Copy the commands under **"…or push an existing repository from the command line"** from the GitHub repository page, and run them in your local terminal:

```bash
# Link local repository to GitHub (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push the code to GitHub
git push -u origin main
```

---

### Step 4: Enable GitHub Pages with GitHub Actions
1. On your GitHub repository page, navigate to the **Settings** tab.
2. Select **Pages** from the left-hand sidebar under the "Code and automation" section.
3. Under **Build and deployment**, look for the **Source** dropdown menu.
4. Select **GitHub Actions** (instead of "Deploy from a branch").

---

### Step 5: Watch the Deployment
1. Go to the **Actions** tab in your GitHub repository.
2. You will see a running workflow named **"Deploy to GitHub Pages"**.
3. Once the workflow turns green (completed), click on the job to view the live URL!
4. Your website will be hosted at a URL like:
   `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`

---

## Why this Setup is Portable
* **Relative Base Path:** We set `base: './'` in [vite.config.js](file:///c:/laragon/www/numerical/vite.config.js). This compiles the static HTML/CSS/JS files to search relative to their root folder, allowing them to load perfectly on any domain subdirectory (like `/YOUR_REPOSITORY_NAME/`) without manual path configuration.
* **Automatic Builds:** Every time you run `git push`, the GitHub Actions server will automatically compile the latest CSS, SVG dividers, and favicons into the `dist/` directory and deploy it instantly.
