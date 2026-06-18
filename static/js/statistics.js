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

    const labels = data.points_over_time.map(p => p.date);
    const scores = data.points_over_time.map(p => p.total_score);
    if (scoreChart) scoreChart.destroy();
    scoreChart = new Chart(document.getElementById('scoreChart'), {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Итоговый балл', data: scores, borderColor: 'blue', tension: 0.1 }] },
        options: { responsive: true, maintainAspectRatio: true }
    });

    const currentVal = elementSelect.value;
    elementSelect.innerHTML = '<option value="">Все элементы</option>';
    data.all_element_codes.forEach(code => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = code;
        if (code === currentVal) opt.selected = true;
        elementSelect.appendChild(opt);
    });

    if (elementChart) elementChart.destroy();
    elementChart = new Chart(document.getElementById('elementChart'), {
        type: 'bar',
        data: {
            labels: data.elements,
            datasets: [
                { label: 'Успешные', data: data.success_counts, backgroundColor: 'green' },
                { label: 'Всего попыток', data: data.total_counts, backgroundColor: 'gray' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });

    const unstable = data.most_unstable;
    if (unstable) {
        document.getElementById('unstableInfo').innerHTML = `Самый нестабильный элемент: <strong>${unstable.code}</strong> (успех ${(unstable.rate*100).toFixed(1)}%, ${unstable.success}/${unstable.total})`;
    } else {
        document.getElementById('unstableInfo').innerHTML = 'Нет данных';
    }

    window._statsData = data;
}

function exportStatsCsv() {
    const data = window._statsData;
    if (!data || !data.points_over_time || data.points_over_time.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }

    let rows = [];

    rows.push(['Дата', 'Тип программы', 'Итоговый балл']);
    data.points_over_time.forEach(p => {
        rows.push([p.date, p.program_type === 'short' ? 'Короткая' : 'Произвольная', p.total_score.toFixed(2).replace('.', ',')]);
    });

    rows.push([]);

    rows.push(['Элемент', 'Успешные', 'Всего', 'Процент успеха (%)']);
    if (data.elements && data.elements.length > 0) {
        for (let i = 0; i < data.elements.length; i++) {
            const code = data.elements[i];
            const success = data.success_counts[i] || 0;
            const total = data.total_counts[i] || 0;
            const rate = total > 0 ? (success / total * 100) : 0;
            rows.push([code, success, total, rate.toFixed(1).replace('.', ',')]);
        }
    } else {
        rows.push(['Нет данных', '', '', '']);
    }

    rows.push([]);
    if (data.most_unstable) {
        rows.push(['Самый нестабильный элемент:', data.most_unstable.code, 'Успех: ' + (data.most_unstable.rate*100).toFixed(1) + '%', 'Попыток: ' + data.most_unstable.total]);
    }

    const csvContent = rows.map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistics_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('exportStatsCsv').addEventListener('click', exportStatsCsv);

startDate.addEventListener('change', fetchStats);
endDate.addEventListener('change', fetchStats);
programType.addEventListener('change', fetchStats);
elementSelect.addEventListener('change', fetchStats);
fetchStats();