document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok) {
            window.location.href = result.redirect;
        } else {
            if (result.error) {
                document.getElementById('usernameError').textContent = result.error;
                document.getElementById('username').classList.add('is-invalid');
            } else {
                alert('Неверный логин или пароль');
            }
        }
    } catch (err) {
        alert('Ошибка соединения');
    }
});