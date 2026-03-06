# Saloon Website Deployment Guide

This guide covers everything you need to completely replace your old website on your VPS, deploy your new Django + HTML/JS website, and create your Admin username and password for login!

## Phase 1: Committing Your Local Changes

Before we touch the server, I have already updated `login.js`, `app.js`, and `settings.py` on your Mac so that they point to your custom domain (`http://hrinfinity.fastcopies.in`). 

You need to push these changes to your GitHub repository so your server can download them.

1. Open your Mac Terminal.
2. Go to your project folder:
   ```bash
   cd "/Users/saitejakaki/Desktop/saloon website"
   ```
3. Commit and push the updates:
   ```bash
   git add .
   git commit -m "Update API URLs to custom domain for production"
   git push origin main
   ```

---

## Phase 2: Pulling or Cloning the Code on the Server

Now, let's get the code onto your server.

1. Log into your VPS via Termius SSH.
2. Go to the web folder:
   ```bash
   cd /var/www
   ```

3. **Check if your code is already there:**
   If the `saloon` folder already exists and is a git repository, you can just pull the latest changes:
   ```bash
   cd saloon
   git pull origin main
   ```

   **OR, if this is the first time:**
   If the `saloon` folder does *not* exist yet, clone it freshly:
   ```bash
   git clone https://github.com/saiteja143-kaki/saloon-project.git saloon
   cd saloon
   ```
   *(Note: If your GitHub repository is private, it will ask for your GitHub username and a Personal Access Token as the password).*



---

## Phase 3: Setting Up the Django Backend

Once your new files are sitting inside `/var/www/saloon`, do the following in your Termius SSH terminal:

1. Go to your backend folder:
   ```bash
   cd /var/www/saloon/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   sudo apt update
   sudo apt install python3-venv python3-pip -y
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your Database (SQLite):
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

---

## Phase 4: Creating Your Login Username & Password

This is where you create the admin account to log into the dashboard!

1. Make sure you are still inside `/var/www/saloon/backend` with the virtual environment activated (`(venv)` should be visible in your terminal prompt).
2. Run this command to create your superuser:
   ```bash
   python manage.py createsuperuser
   ```
3. The terminal will ask you for:
   - **Username**: Type your desired username (e.g., `admin`) and press Enter.
   - **Email address**: You can leave this blank and just press Enter.
   - **Password**: Type your desired password. *(Note: you won't see the letters as you type, this is normal for security)*
   - **Password (again)**: Retype it to confirm.
   
Congratulations! You now have a working username and password for your `login.html` page.

---

## Phase 5: Starting the Server Process

You need the backend running constantly so your web app can work. 

1. Start the Django server in the background using `nohup` so it stays running even when you close Termius:
   ```bash
   nohup python manage.py runserver 0.0.0.0:8000 &
   ```
2. Press `Enter` one more time after you run that command to get your prompt back.

*(Note: In a true production environment, it is better to set up **Gunicorn** and **Nginx** instead of `runserver`. If you'd like me to set up a professional Gunicorn background service later, just let me know!)*

---

## Phase 6: Ensure Nginx/Apache is Serving Your Site

Your server needs to know where your `index.html` lives so people can visit your IP address in the browser.
If you already had a website, your Nginx or Apache config is likely already pointing to `/var/www/saloon`.

If so, you should now be able to go to:
**http://hrinfinity.fastcopies.in**

You will see your new website, click the login button, and use the superuser account you just created!
