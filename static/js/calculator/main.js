function addElementFromSearch() {
    let val = $('#elementSearch').val().trim();
    if (!val) return;
    if (val.includes('+')) {
        let partsCodes = val.split('+').filter(p => p.trim() !== '');
        if (partsCodes.length < 2) {
            alert('Каскад должен содержать минимум 2 прыжка');
            return;
        }
        let partsData = [];
        let completed = 0;
        for (let code of partsCodes) {
            $.get(`/calculator/api/elements?q=${code}`, function(data) {
                let found = data.find(e => e.code === code);
                if (found) {
                    partsData.push({
                        code: found.code,
                        desc: found.description,
                        base: found.base_value,
                        category: found.category,
                        underrotation: '',
                        edge: '',
                        q: false,
                        vi1: false,
                        vi2: false,
                        fall: false,
                        invalid: false,
                        goe: 0
                    });
                } else {
                    partsData.push({
                        code: code,
                        desc: code,
                        base: 0,
                        category: 'jump',
                        underrotation: '',
                        edge: '',
                        q: false,
                        vi1: false,
                        vi2: false,
                        fall: false,
                        invalid: false,
                        goe: 0
                    });
                }
                completed++;
                if (completed === partsCodes.length) {
                    let descParts = partsData.map(p => p.desc);
                    let cascadeDesc = 'Комбинация ' + descParts.join(' + ');
                    currentElements.push({
                        code: val,
                        desc: cascadeDesc,
                        base: partsData.reduce((sum, p) => sum + p.base, 0),
                        second_half: false,
                        isCascade: true,
                        parts: partsData,
                        category: 'cascade',
                        goe: 0
                    });
                    renderTable();
                    $('#elementSearch').val('');
                }
            });
        }
    } else {
        $.get(`/calculator/api/elements?q=${val}`, function(data) {
            let found = data.find(e => e.code === val);
            if (found) {
                currentElements.push({
                    code: found.code,
                    desc: found.description,
                    base: found.base_value,
                    goe: 0,
                    second_half: false,
                    underrotation: '',
                    edge: '',
                    q: false,
                    vi1: false,
                    vi2: false,
                    fall: false,
                    invalid: false,
                    isCascade: false,
                    category: found.category
                });
                renderTable();
                $('#elementSearch').val('');
            } else {
                currentElements.push({
                    code: val,
                    desc: val,
                    base: 0,
                    goe: 0,
                    second_half: false,
                    underrotation: '',
                    edge: '',
                    q: false,
                    vi1: false,
                    vi2: false,
                    fall: false,
                    invalid: false,
                    isCascade: false,
                    category: 'unknown'
                });
                renderTable();
                $('#elementSearch').val('');
            }
        });
    }
}

function downloadCsv() {
    const rows = [];
    rows.push(['#', 'Элемент', 'BV', 'GOE', ' ', 'Сумма']);
    currentElements.forEach((el, idx) => {
        rows.push([
            idx+1,
            getDisplayCode(el),
            getModifiedBaseForDisplay(el).toFixed(2).replace('.', ','),
            el.isCascade ? getCascadeDisplayGoe(el) : (el.goe || 0),
            el.second_half ? 'x' : '',
            calculateTotal(el).toFixed(2).replace('.', ',')
        ]);
    });
    rows.push([]);
    const techScore = parseFloat($('#techScore').text()) || 0;
    const compScore = parseFloat($('#componentsScore').text()) || 0;
    const deductions = parseFloat($('#deductionsAmount').text()) || 0;
    const totalScore = parseFloat($('#finalTotal').text()) || 0;
    rows.push(['Оценка за технику', '', '', '', '', techScore.toFixed(2).replace('.', ',')]);
    rows.push(['Оценка за компоненты', '', '', '', '', compScore.toFixed(2).replace('.', ',')]);
    rows.push(['Снижения', '', '', '', '', deductions.toFixed(2).replace('.', ',')]);
    rows.push(['Итоговая сумма', '', '', '', '', totalScore.toFixed(2).replace('.', ',')]);
    const sk = parseFloat($('#compSK').val()) || 0;
    const tr = parseFloat($('#compTR').val()) || 0;
    const pe = parseFloat($('#compPE').val()) || 0;
    const co = parseFloat($('#compCO').val()) || 0;
    const inVal = parseFloat($('#compIN').val()) || 0;
    rows.push([]);
    rows.push(['Компоненты:', 'SK', 'TR', 'PE', 'CO', 'IN']);
    rows.push(['Оценки', sk.toFixed(2).replace('.', ','), tr.toFixed(2).replace('.', ','), pe.toFixed(2).replace('.', ','), co.toFixed(2).replace('.', ','), inVal.toFixed(2).replace('.', ',')]);
    rows.push(['Фактор', '', '', '', '', $('#componentCoeff').val().toString().replace('.', ',')]);

    const csvContent = rows.map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'program.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

$(document).ready(function() {
    loadElementsByType();
    initComponents();

    const today = new Date().toISOString().split('T')[0];
    $('#save_program_date').val(today);

    function populateAthleteSelects() {
        const athleteSelect = $('#save_program_athlete');
        const partnerSelect = $('#save_program_partner');
        const preselectedId = window.preselectedAthleteId;

        athleteSelect.empty();
        athleteSelect.append('<option value="">Выберите спортсмена</option>');
        partnerSelect.empty();
        partnerSelect.append('<option value="">Выберите партнёра</option>');

        if (window.coachAthletes) {
            window.coachAthletes.forEach(a => {
                athleteSelect.append(`<option value="${a.id}">${a.name}</option>`);
                if (a.id != preselectedId) {
                    partnerSelect.append(`<option value="${a.id}">${a.name}</option>`);
                }
            });
        }

        if (preselectedId) {
            $('#athlete_select_container').hide();
        } else {
            $('#athlete_select_container').show();
        }
    }

    populateAthleteSelects();

    $('#save_program_discipline').change(function() {
        if ($(this).val() === 'pairs') {
            $('#partner_select_container').show();
        } else {
            $('#partner_select_container').hide();
        }
    });

    $('#saveProgramBtn').click(function() {
        $('#save_program_name').val($('#programName').val() || 'Программа');
        $('#save_program_discipline').val($('#disciplineSelect').val()).trigger('change');
        $('#save_program_type').val($('#programTypeSelect').val());
        populateAthleteSelects();
        new bootstrap.Modal(document.getElementById('saveProgramFullModal')).show();
    });

    $('#confirmSaveFullBtn').click(function() {
        const name = $('#save_program_name').val();
        const programDate = $('#save_program_date').val();
        const discipline = $('#save_program_discipline').val();
        const programType = $('#save_program_type').val();
        if (!name || !programDate) { alert('Заполните все поля'); return; }

        let athleteId = null;
        if (window.preselectedAthleteId) {
            athleteId = window.preselectedAthleteId;
        } else {
            athleteId = $('#save_program_athlete').val();
            if (!athleteId) {
                alert('Выберите спортсмена');
                return;
            }
        }

        let partnerId = null;
        if (discipline === 'pairs') {
            partnerId = $('#save_program_partner').val();
            if (!partnerId) {
                alert('Для парного катания необходимо выбрать партнёра');
                return;
            }
        }

        const elementsData = currentElements.map(el => ({
            code: getDisplayCode(el),
            base: getModifiedBaseForDisplay(el),
            multiplier: el.base_multiplier || 1.0,
            goe: el.isCascade ? getCascadeDisplayGoe(el) : (el.goe || 0),
            second_half: el.second_half,
            fall: el.fall,
            underrotation: el.underrotation,
            edge: el.edge,
            invalid: el.invalid,
            total: calculateTotal(el)
        }));

        const payload = {
            name: name,
            athlete_id: athleteId,
            partner_id: partnerId,
            program_type: programType,
            discipline: discipline,
            program_date: programDate,
            elements: elementsData,
            comp_sk: parseFloat($('#compSK').val()) || 0,
            comp_tr: parseFloat($('#compTR').val()) || 0,
            comp_pe: parseFloat($('#compPE').val()) || 0,
            comp_co: parseFloat($('#compCO').val()) || 0,
            comp_in: parseFloat($('#compIN').val()) || 0,
            component_coeff: parseFloat($('#componentCoeff').val()) || 1.0,
            components_score: parseFloat($('#componentsScore').text()) || 0,
            deductions: parseFloat($('#deductionsAmount').text()) || 0,
            total_score: parseFloat($('#finalTotal').text()) || 0
        };

        fetch('/calculator/save_program_full', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok') {
                alert('Программа сохранена!');
                $('#saveProgramFullModal').modal('hide');
                if (window.userRole === 'coach') window.location.href = '/profile';
                else { $('#programName').val(''); currentElements = []; renderTable(); }
            } else alert('Ошибка: ' + (data.error || ''));
        })
        .catch(err => alert('Ошибка соединения'));
    });

    $('#downloadCsvBtn').click(function() {
        downloadCsv();
    });

    $('#disciplineSelect').off('change').on('change', function() {
        loadElementsByType();
        $('#elementSearch').val('');
        currentTurns = null;
        currentLevel = null;
        currentLiftGroup = null;
        currentLiftLevel = null;
        currentTwistLevel = null;
        $('.turns-btn').removeClass('active btn-primary').addClass('btn-outline-secondary');
        if (currentType === 'jumps') {
            $('#jumps-panel').show();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').show();
        } else if (currentType === 'throws') {
            $('#jumps-panel').show();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').hide();
        } else if (currentType === 'twist_lifts') {
            $('#jumps-panel').hide();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').show();
            $('#addJumpToCascadeBtn').hide();
            updateTwistLevelButtons();
        } else if (currentType === 'lifts') {
            $('#jumps-panel').hide();
            $('#levels-panel').hide();
            $('#lift-panel').show();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').hide();
            updateLiftControls();
        } else {
            $('#jumps-panel').hide();
            $('#levels-panel').show();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').hide();
        }
    });

    $('#elementTabs .nav-link').click(function() {
        $('#elementTabs .nav-link').removeClass('active');
        $(this).addClass('active');
        currentType = $(this).data('type');
        if (currentType === 'jumps') {
            $('#jumps-panel').show();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').show();
            renderElementsList();
        } else if (currentType === 'throws') {
            $('#jumps-panel').show();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').hide();
            renderElementsList();
        } else if (currentType === 'twist_lifts') {
            $('#jumps-panel').hide();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').show();
            $('#addJumpToCascadeBtn').hide();
            updateTwistLevelButtons();
            renderElementsList();
        } else if (currentType === 'lifts') {
            $('#jumps-panel').hide();
            $('#levels-panel').hide();
            $('#lift-panel').show();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').hide();
            updateLiftControls();
            renderElementsList();
        } else {
            $('#jumps-panel').hide();
            $('#levels-panel').show();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
            $('#addJumpToCascadeBtn').hide();
            updateLevelButtons();
            renderElementsList();
        }
    });

    $(document).on('click', '.turns-btn', function() {
        $('.turns-btn').removeClass('active btn-primary').addClass('btn-outline-secondary');
        $(this).addClass('active btn-primary').removeClass('btn-outline-secondary');
        let turns = parseInt($(this).data('turns'));
        currentTurns = isNaN(turns) ? null : turns;
        renderElementsList();
    });

    $(document).on('click', '.level-btn', function() {
        $('.level-btn').removeClass('active btn-primary').addClass('btn-outline-secondary');
        $(this).addClass('active btn-primary').removeClass('btn-outline-secondary');
        currentLevel = $(this).data('level');
        renderElementsList();
    });

    $('#addJumpToCascadeBtn').click(function() {
        let currentVal = $('#elementSearch').val();
        if (currentVal !== '' && !currentVal.endsWith('+')) {
            $('#elementSearch').val(currentVal + '+');
        }
    });

    $('#elementSearch').on('input', function() {
        let q = $(this).val();
        if (q.length < 1) {
            $('#suggestions').empty();
            return;
        }
        $.get(`/calculator/api/elements?q=${q}`, function(data) {
            let sugg = $('#suggestions');
            sugg.empty();
            data.forEach(e => {
                sugg.append(`<a href="#" class="list-group-item list-group-item-action" data-code="${e.code}" data-base="${e.base_value}" data-desc="${e.description}">${e.code} - ${e.description} (${e.base_value})</a>`);
            });
        });
    });

    $('#suggestions').off('click').on('click', '.list-group-item', function(e) {
        e.preventDefault();
        let code = $(this).data('code');
        $('#elementSearch').val(code);
        $('#suggestions').empty();
    });

    $('#addElementBtn').click(function() {
        addElementFromSearch();
    });

    renderTable();
});