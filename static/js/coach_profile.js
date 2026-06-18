const searchInput = document.getElementById('athleteSearchInput');
const resultsDiv = document.getElementById('searchResults');
let searchTimeout;

searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    if (query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }
    searchTimeout = setTimeout(() => {
        fetch(`/api/search_athletes?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) {
                    resultsDiv.innerHTML = '<div class="text-muted text-center p-3">Ничего не найдено</div>';
                    return;
                }
                let html = '';
                data.forEach(ath => {
                    html += `
                        <div class="search-result-item" data-id="${ath.id}">
                            <div class="athlete-name">${ath.full_name}</div>
                            <div class="athlete-birth">Дата рождения: ${ath.birth_date || 'не указана'}</div>
                        </div>
                    `;
                });
                resultsDiv.innerHTML = html;
                document.querySelectorAll('.search-result-item').forEach(el => {
                    el.addEventListener('click', function() {
                        const athleteId = this.dataset.id;
                        fetch('/api/send_invitation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ athlete_id: athleteId })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.error) alert(data.error);
                            else {
                                alert('Приглашение отправлено!');
                                location.reload();
                            }
                        });
                    });
                });
            });
    }, 300);
});