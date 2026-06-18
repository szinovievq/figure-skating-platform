document.querySelectorAll('.accept-invitation').forEach(btn => {
    btn.addEventListener('click', function() {
        fetch('/api/respond_invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitation_id: this.dataset.id, action: 'accept' })
        }).then(res => res.json()).then(data => { if (data.message) location.reload(); else alert('Ошибка'); });
    });
});
document.querySelectorAll('.decline-invitation').forEach(btn => {
    btn.addEventListener('click', function() {
        fetch('/api/respond_invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitation_id: this.dataset.id, action: 'decline' })
        }).then(res => res.json()).then(data => { if (data.message) location.reload(); else alert('Ошибка'); });
    });
});

const removeBtn = document.getElementById('removeCoachBtn');
if (removeBtn) {
    removeBtn.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите отвязаться от тренера?')) {
            fetch('/api/remove_coach', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(res => res.json())
            .then(data => { if (data.message) location.reload(); else alert('Ошибка: ' + (data.error || '')); });
        }
    });
}

let scoreChart, elementChart;
const elementSelect = document.getElementById('elementSelect');
const startDate = document.getElementById('statsStartDate');
const endDate = document.getElementById('statsEndDate');
const programType = document.getElementById('statsProgramType');

async function fetchStats() {
    const params = new URLSearchParams();
    if (startDate.value) params.append('start', startDate.value);
    if (endDate.value) params.append('end', endDate.value);
    if (programType.value && programType.value !== 'all') params.append('program_type', programType.value);
    if (elementSelect.value && elementSelect.value !== '') params.append('element_code', elementSelect.value);

    const url = `/stats/data/${window.athleteId}?${params.toString()}`;
    const resp = await fetch(url);
    const data = await resp.json();

    document.getElementById('avgShortScore').innerText = data.avg_short !== null ? data.avg_short.toFixed(2) : '—';
    document.getElementById('avgFreeScore').innerText = data.avg_free !== null ? data.avg_free.toFixed(2) : '—';

    const labels = data.points_over_time ? data.points_over_time.map(p => p.date) : [];
    const scores = data.points_over_time ? data.points_over_time.map(p => p.total_score) : [];
    if (scoreChart) scoreChart.destroy();
    scoreChart = new Chart(document.getElementById('scoreChart'), {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Итоговый балл', data: scores, borderColor: 'blue', tension: 0.1 }] },
        options: { responsive: true, maintainAspectRatio: true }
    });

    const currentVal = elementSelect.value;
    elementSelect.innerHTML = '<option value="">Все элементы</option>';
    if (data.all_element_codes) {
        data.all_element_codes.forEach(code => {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = code;
            if (code === currentVal) opt.selected = true;
            elementSelect.appendChild(opt);
        });
    }

    const elemLabels = data.elements || [];
    const successData = data.success_counts || [];
    const totalData = data.total_counts || [];
    if (elementChart) elementChart.destroy();
    elementChart = new Chart(document.getElementById('elementChart'), {
        type: 'bar',
        data: {
            labels: elemLabels,
            datasets: [
                { label: 'Успешные', data: successData, backgroundColor: 'green' },
                { label: 'Всего попыток', data: totalData, backgroundColor: 'gray' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });

    const unstable = data.most_unstable;
    if (unstable) {
        document.getElementById('unstableInfo').innerHTML = `Самый нестабильный элемент: <strong>${unstable.code}</strong> (успех ${(unstable.rate*100).toFixed(1)}%, ${unstable.success}/${unstable.total})`;
    } else {
        document.getElementById('unstableInfo').innerHTML = 'Нет данных по элементам';
    }

    window._statsData = data;
}

startDate.addEventListener('change', fetchStats);
endDate.addEventListener('change', fetchStats);
programType.addEventListener('change', fetchStats);
elementSelect.addEventListener('change', fetchStats);
fetchStats();