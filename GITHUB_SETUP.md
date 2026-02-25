# GitHub Setup

To push this project to GitHub:

1. **Create a new repository** on GitHub (e.g. `sweatbox-gym`).

2. **Initialize Git** (if not already):
   ```bash
   git init
   ```

3. **Add remote**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   ```
   Or with SSH:
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
   ```

4. **Stage and commit**:
   ```bash
   git add .
   git commit -m "SweatBox gym app: admin, dietitian, Flutter, Supabase"
   ```

5. **Push**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

> **Note**: `.env.local` and other env files are in `.gitignore` – do not commit secrets. Add them manually on each deployment environment.
