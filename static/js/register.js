document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control, .form-select').forEach(el => el.classList.remove('is-invalid'));

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirm_password) {
        document.getElementById('confirmPasswordError').textContent = 'Пароли не совпадают';
        document.getElementById('confirm_password').classList.add('is-invalid');
        return;
    }

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            window.location.href = result.redirect;
        } else {
            if (result.errors) {
                for (const [field, msg] of Object.entries(result.errors)) {
                    const errorDiv = document.getElementById(`${field}Error`);
                    const input = document.getElementById(field);
                    if (errorDiv && input) {
                        errorDiv.textContent = msg;
                        input.classList.add('is-invalid');
                    }
                }
            } else {
                alert(result.error || 'Ошибка регистрации');
            }
        }
    } catch (err) {
        alert('Ошибка соединения');
    }
});