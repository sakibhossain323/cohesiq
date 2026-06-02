# 🚀 Cohesiq: EC2 Deployment Guide

This guide provides step-by-step instructions to deploy the Cohesiq platform (Next.js, FastAPI, PostgreSQL) onto an AWS EC2 instance using Docker Compose. The `m7i-flex.large` (2 vCPU, 8GB RAM) is a powerful, modern instance that will run this stack flawlessly without any memory issues during Next.js builds.

*(Note: Ensure you have special credits or a promotional free trial for the `m7i-flex.large`, as it is not part of the standard 12-month AWS Free Tier. The standard free tier only covers `t2.micro`/`t3.micro`).*

---

## Step 1: Launch the EC2 Instance

1. Go to the **AWS EC2 Console** and click **Launch Instance**.
2. **Name:** `cohesiq-production-server`
3. **AMI (OS):** Select **Ubuntu 24.04 LTS** (or 22.04 LTS).
4. **Instance Type:** Select **m7i-flex.large**.
5. **Key Pair:** Create a new key pair (e.g., `cohesiq-key.pem`) and download it.
6. **Network Settings:** 
   - Check **Allow SSH traffic from** (My IP or Anywhere).
   - Check **Allow HTTP traffic from the internet**.
   - Check **Allow HTTPS traffic from the internet**.
7. **Configure Storage:** Increase the Root Volume to at least **30 GB (gp3)** (Docker images and PostgreSQL data require decent space).
8. Click **Launch Instance**.

---

## Step 2: Connect and Install Dependencies

Open your terminal and SSH into your newly created EC2 instance:
```bash
# Update permissions on your key
chmod 400 cohesiq-key.pem

# SSH into the server
ssh -i cohesiq-key.pem ubuntu@3.224.147.223
```

Once inside the server, update packages and install **Docker**, **Docker Compose**, and **Git**:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install git and curl
sudo apt install -y git curl

# Download and run the official Docker automated installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add the ubuntu user to the docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker ubuntu
```
> [!NOTE]
> **Important:** Type `exit` to log out of the server, then SSH back in immediately so the group permission changes take effect.

---

## Step 3: Clone the Repository

Since this is a private GitHub repo, you'll need to generate a Deploy Key or use a Personal Access Token. The easiest way is HTTPS + Personal Access Token.

```bash
# Clone the repository
git clone https://github.com/sakibhossain323/cohesiq.git
cd cohesiq
```

---

## Step 4: Configure Environment Variables

You need to set up the environment variables securely on the server for both the frontend and backend. Do not commit these to GitHub.

### 1. Backend Environment Variables
```bash
# Copy the backend example env file
cp backend/.env.example backend/.env

# Open it and paste your actual production keys
nano backend/.env
```
Make sure you configure:
- `CLERK_SECRET_KEY`
- `DATABASE_URL` (Ensure it points to the Docker Compose DB service, e.g., `postgresql+asyncpg://postgres:postgres@db:5432/cohesiq_db`)
- `GEMINI_API_KEY` and `GROQ_API_KEY`

### 2. Frontend Environment Variables
```bash
# Copy the frontend example env file
cp frontend/cohesiq-v0/.env.example frontend/cohesiq-v0/.env

# Open it and paste your actual production keys
nano frontend/cohesiq-v0/.env
```
Make sure you configure:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

---

## Step 5: Build and Run the Stack

Now, spin up the entire architecture (Frontend, Backend, Database) in detached mode.

```bash
# Build and start the containers in the background
docker compose up -d --build
```

You can verify the containers are healthy by running:
```bash
docker compose ps
docker compose logs -f backend   # Follow backend logs to ensure DB migrations ran
```

---

## Step 6: Expose via IP Address (Caddy Reverse Proxy)

Since you are accessing the app directly via your IP, we will use **Caddy** to route traffic so you don't have to type `:3000` in the browser.

1. **Install Caddy on EC2:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

2. **Configure Caddy (`/etc/caddy/Caddyfile`):**
```bash
sudo nano /etc/caddy/Caddyfile
```
Delete the existing contents and paste this configuration:
```text
http://3.224.147.223 {
    reverse_proxy localhost:3000
}

http://3.224.147.223:8000 {
    reverse_proxy localhost:8000
}
```

3. **Restart Caddy:**
```bash
sudo systemctl restart caddy
```

**Done!** Your Next.js frontend is now live at `http://3.224.147.223` and your FastAPI backend at `http://3.224.147.223:8000`. 
*(Note: Because you are not using a domain name, this is served over standard HTTP. Make sure your Clerk dashboard is in Development mode so cookies aren't blocked by missing SSL).*

---

## 🛠️ Step 7: (Optional) Database Seeding
If you need to seed the production database with your mock data, run them as modules to avoid Python import errors:
```bash
docker compose exec backend python -m scripts.generate_seed_data
docker compose exec backend python -m scripts.seed_db
```
