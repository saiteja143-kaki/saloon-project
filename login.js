const API_BASE = 'http://173.249.38.225/api';

// If already logged in, redirect straight to dashboard
if (localStorage.getItem('auth_token')) {
    window.location.href = 'index.html';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('btn-login');

    errorEl.classList.remove('show');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

    try {
        const res = await fetch(`${API_BASE}/api-token-auth/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('auth_token', data.token);
            window.location.href = 'index.html';
        } else {
            errorEl.classList.add('show');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
        }
    } catch (err) {
        errorEl.textContent = 'Cannot connect to server. Please try again.';
        errorEl.classList.add('show');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
    }
});
