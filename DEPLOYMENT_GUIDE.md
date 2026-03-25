# Saloon Website Deployment Guide (Production)

This guide provides step-by-step instructions to deploy your SaloonFlow application (Django Backend + HTML/JS Frontend) to a production server (VPS).

## Prerequisites
- A Linux VPS (Ubuntu 20.04/22.04 recommended)
- Your domain: `hrinfinity.fastcopies.in`
- GitHub repository with the latest code

---

## Step 1: Prepare the Server
Update packages and install necessary dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv nginx git -y
```

## Step 2: Clone/Pull the Code
Clone your project to `/var/www/` or pull latest changes:
```bash
cd /var/www
# If first time:
sudo git clone https://github.com/saiteja143-kaki/saloon-project.git saloon
sudo chown -R $USER:$USER /var/www/saloon
cd /var/www/saloon
# If already exists:
cd /var/www/saloon
git pull origin main
```

## Step 3: Setup Backend (Django)
1. **Create/Activate Virtual Environment**:
   ```bash
   cd /var/www/saloon/backend
   python3 -m venv venv
   source venv/bin/activate
   ```
2. **Install Requirements**:
   ```bash
   pip install -r requirements.txt
   pip install gunicorn
   ```
3. **Database Migrations** (Includes the new Notes feature):
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
4. **Create Admin User** (If not already done):
   ```bash
   python manage.py createsuperuser
   ```

## Step 4: Configure Nginx
Nginx will serve your frontend files and proxy API requests to Django.

1. **Create Nginx Configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/saloon
   ```
2. **Add the following config**:
   ```nginx
   server {
       listen 80;
       server_name hrinfinity.fastcopies.in;

       root /var/www/saloon;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /admin/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
       }

       location /static/ {
           alias /var/www/saloon/backend/static/;
       }
   }
   ```
3. **Enable Site and Restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/saloon /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Step 5: Run Backend with Systemd
To keep the backend running reliably in the background:

1. **Create Service File**:
   ```bash
   sudo nano /etc/systemd/system/saloon-backend.service
   ```
2. **Add the following**:
   ```ini
   [Unit]
   Description=SaloonFlow Backend Gunicorn Service
   After=network.target

   [Service]
   User=saiteja
   Group=www-data
   WorkingDirectory=/var/www/saloon/backend
   ExecStart=/var/www/saloon/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 core.wsgi:application

   [Install]
   WantedBy=multi-user.target
   ```
3. **Start and Enable Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start saloon-backend
   sudo systemctl enable saloon-backend
   ```

## Step 6: Collect Static Files
```bash
cd /var/www/saloon/backend
source venv/bin/activate
python manage.py collectstatic --noinput
```

## Step 7: Secure with SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d hrinfinity.fastcopies.in
```

---

## Important Checklist
- [ ] **DEBUG = False**: Ensure `DEBUG = False` in `backend/core/settings.py` for production.
- [ ] **ALLOWED_HOSTS**: Ensure your domain is listed.
- [ ] **Migrations**: Always run `python manage.py migrate` after pulling new code.
- [ ] **Collect Static**: Essential for admin panel items to show correctly.
