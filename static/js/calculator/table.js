function renderTable() {
    let tbody = $('#tableBody');
    tbody.empty();
    currentElements.forEach((el, idx) => {
        let totalPoints = calculateTotal(el);
        let goeValue = 0;
        if (el.isCascade && el.parts) {
            goeValue = getCascadeDisplayGoe(el);
        } else {
            goeValue = el.goe || 0;
        }
        let goeClass = 'btn btn-sm ' + (goeValue < 0 ? 'btn-danger' : (goeValue === 0 ? 'btn-secondary' : 'btn-success'));
        let goeButton = `<button class="${goeClass} goe-trigger" data-idx="${idx}" style="width:50px;">${goeValue}</button>`;
        let secondHalfActive = el.second_half ? 'active' : '';
        let xButton = `<button class="mod-btn ${secondHalfActive}" data-mod="second_half" data-idx="${idx}">x</button>`;
        let displayCode = getDisplayCode(el);
        let row = `<tr>
            <td>${idx+1}</td>
            <td><strong>${displayCode}</strong><br><small class="text-muted">${el.desc}</small></td>
            <td>${el.base.toFixed(2)}</td>
            <td>${goeButton}</td>
            <td>${xButton}</td>
            <td class="fw-bold">${totalPoints.toFixed(2)}</td>
            <td>
                <button class="action-icon edit" data-idx="${idx}"><i class="fas fa-edit"></i></button>
                <button class="action-icon del" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
        tbody.append(row);
    });
    attachTableEvents();
    updateTotals();
}

function attachTableEvents() {
    $(document).off('click', '.goe-trigger').on('click', '.goe-trigger', function() {
        let idx = $(this).data('idx');
        showGoeModal(idx);
    });
    $(document).off('click', '[data-mod="second_half"]').on('click', '[data-mod="second_half"]', function() {
        let idx = $(this).data('idx');
        currentElements[idx].second_half = !currentElements[idx].second_half;
        renderTable();
    });
    $(document).off('click', '.action-icon.del').on('click', '.action-icon.del', function() {
        let idx = $(this).data('idx');
        currentElements.splice(idx, 1);
        renderTable();
    });
    $(document).off('click', '.action-icon.edit').on('click', '.action-icon.edit', function() {
        let idx = $(this).data('idx');
        openEditModal(idx);
    });
}

function getComponentSum() {
    let compValues = {
        SK: parseFloat($('#compSK').val()) || 0,
        TR: parseFloat($('#compTR').val()) || 0,
        PE: parseFloat($('#compPE').val()) || 0,
        CO: parseFloat($('#compCO').val()) || 0,
        IN: parseFloat($('#compIN').val()) || 0
    };
    return compValues.SK + compValues.TR + compValues.PE + compValues.CO + compValues.IN;
}

function updateTotals() {
    let techScore = 0;
    for (let el of currentElements) {
        techScore += calculateTotal(el);
    }
    let componentSum = getComponentSum();
    let componentCoeff = parseFloat($('#componentCoeff').val()) || 1.0;
    let componentTotal = componentSum * componentCoeff;
    let falls = countFalls();
    let deductions = falls * 1.0;
    let totalScore = techScore + componentTotal - deductions;

    console.log('techScore:', techScore);
    console.log('componentTotal:', componentTotal);
    console.log('deductions:', deductions);
    console.log('totalScore:', totalScore);

    if ($('#techScore').length === 0) {
        console.warn('Элемент #techScore не найден в DOM!');
    } else {
        $('#techScore').text(techScore.toFixed(2));
    }
    $('#componentsScore').text(componentTotal.toFixed(2));
    $('#deductionsAmount').text(deductions.toFixed(2));
    $('#finalTotal').text(totalScore.toFixed(2));

    if (falls > 0) {
        $('#deductionRow').show();
    } else {
        $('#deductionRow').hide();
    }
}

function initComponents() {
    $('#compSK, #compTR, #compPE, #compCO, #compIN').on('input', function() {
        updateTotals();
        $('#compSKVal').text(parseFloat($('#compSK').val()).toFixed(2));
        $('#compTRVal').text(parseFloat($('#compTR').val()).toFixed(2));
        $('#compPEVal').text(parseFloat($('#compPE').val()).toFixed(2));
        $('#compCOVal').text(parseFloat($('#compCO').val()).toFixed(2));
        $('#compINVal').text(parseFloat($('#compIN').val()).toFixed(2));
    });
    $('#componentCoeff').on('input', function() {
        updateTotals();
    });
    $('#programTypeSelect').on('change', function() {
        let progType = $(this).val();
        let discipline = $('#disciplineSelect').val();
        let coeff = 1.0;
        if (discipline === 'singles' || discipline === 'pairs') {
            coeff = (progType === 'short') ? 0.8 : 1.6;
        }
        $('#componentCoeff').val(coeff);
        updateTotals();
    });
    $('#disciplineSelect').on('change', function() {
        let progType = $('#programTypeSelect').val();
        let discipline = $(this).val();
        let coeff = 1.0;
        if (discipline === 'singles' || discipline === 'pairs') {
            coeff = (progType === 'short') ? 0.8 : 1.6;
        }
        $('#componentCoeff').val(coeff);
        updateTotals();
    });
}