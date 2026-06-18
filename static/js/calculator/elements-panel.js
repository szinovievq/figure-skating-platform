function loadElementsByType() {
    $.get('/calculator/api/elements_by_type', function(data) {
        allElementsByType = data;
        renderElementsList();
        if (currentType === 'jumps') {
            $('#jumps-panel').show();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
        } else if (currentType === 'throws') {
            $('#jumps-panel').show();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
        } else if (currentType === 'twist_lifts') {
            $('#jumps-panel').hide();
            $('#levels-panel').hide();
            $('#lift-panel').hide();
            $('#twist-panel').show();
            updateTwistLevelButtons();
        } else if (currentType === 'lifts') {
            $('#jumps-panel').hide();
            $('#levels-panel').hide();
            $('#lift-panel').show();
            $('#twist-panel').hide();
            updateLiftControls();
        } else {
            $('#jumps-panel').hide();
            $('#levels-panel').show();
            $('#lift-panel').hide();
            $('#twist-panel').hide();
            updateLevelButtons();
        }
    });
}

function updateLevelButtons() {
    let levelContainer = $('#level-buttons');
    levelContainer.empty();

    let levelsSet = new Set();
    if (allElementsByType[currentType]) {
        allElementsByType[currentType].forEach(el => {
            if (el.level && el.level !== '') {
                levelsSet.add(el.level);
            }
        });
    }
    if (currentType === 'spins' || currentType === 'steps') {
        if (!levelsSet.has('B')) levelsSet.add('B');
    }
    let levels = Array.from(levelsSet).sort((a, b) => {
        if (a === 'B') return -1;
        if (b === 'B') return 1;
        return parseInt(a) - parseInt(b);
    });

    if (levels.length === 0) {
        levelContainer.hide();
        return;
    }
    levels.forEach(lvl => {
        let btn = $(`<button class="btn btn-outline-secondary level-btn" data-level="${lvl}">${lvl}</button>`);
        levelContainer.append(btn);
    });
    if (!currentLevel || !levels.includes(currentLevel)) {
        currentLevel = levels[0];
        $(`.level-btn[data-level="${currentLevel}"]`).addClass('active btn-primary').removeClass('btn-outline-secondary');
    }
    levelContainer.show();
}

function updateTwistLevelButtons() {
    let twistPanel = $('#twist-panel');
    twistPanel.empty();
    twistPanel.html(`
        <label>Уровень:</label>
        <div id="twist-level-buttons" class="d-flex flex-wrap gap-2 mt-1">
            <button class="btn btn-outline-secondary twist-level-btn" data-level="B">B</button>
            <button class="btn btn-outline-secondary twist-level-btn" data-level="1">1</button>
            <button class="btn btn-outline-secondary twist-level-btn" data-level="2">2</button>
            <button class="btn btn-outline-secondary twist-level-btn" data-level="3">3</button>
            <button class="btn btn-outline-secondary twist-level-btn" data-level="4">4</button>
        </div>
    `);
    $('#twist-level-buttons .twist-level-btn').off('click').on('click', function() {
        $('#twist-level-buttons .twist-level-btn').removeClass('active btn-primary').addClass('btn-outline-secondary');
        $(this).addClass('active btn-primary').removeClass('btn-outline-secondary');
        currentTwistLevel = $(this).data('level');
    });
    if (!currentTwistLevel) {
        currentTwistLevel = 'B';
        $('#twist-level-buttons .twist-level-btn[data-level="B"]').addClass('active btn-primary').removeClass('btn-outline-secondary');
    } else {
        $(`#twist-level-buttons .twist-level-btn[data-level="${currentTwistLevel}"]`).addClass('active btn-primary').removeClass('btn-outline-secondary');
    }
    twistPanel.show();
}

function updateLiftControls() {
    let liftPanel = $('#lift-panel');
    liftPanel.empty();
    liftPanel.html(`
        <div class="mb-2">
            <label>Группа поддержки:</label>
            <div id="lift-group-buttons" class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-secondary lift-group-btn" data-group="1">1</button>
                <button class="btn btn-outline-secondary lift-group-btn" data-group="2">2</button>
                <button class="btn btn-outline-secondary lift-group-btn" data-group="3">3</button>
                <button class="btn btn-outline-secondary lift-group-btn" data-group="4">4</button>
                <button class="btn btn-outline-secondary lift-group-btn" data-group="5">5</button>
            </div>
        </div>
        <div class="mb-2">
            <label>Уровень поддержки:</label>
            <div id="lift-level-buttons" class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-secondary lift-level-btn" data-level="B">B</button>
                <button class="btn btn-outline-secondary lift-level-btn" data-level="1">1</button>
                <button class="btn btn-outline-secondary lift-level-btn" data-level="2">2</button>
                <button class="btn btn-outline-secondary lift-level-btn" data-level="3">3</button>
                <button class="btn btn-outline-secondary lift-level-btn" data-level="4">4</button>
            </div>
        </div>
    `);
    $('#lift-group-buttons .lift-group-btn').off('click').on('click', function() {
        $('#lift-group-buttons .lift-group-btn').removeClass('active btn-primary').addClass('btn-outline-secondary');
        $(this).addClass('active btn-primary').removeClass('btn-outline-secondary');
        currentLiftGroup = $(this).data('group');
        updateLiftCode();
    });
    $('#lift-level-buttons .lift-level-btn').off('click').on('click', function() {
        $('#lift-level-buttons .lift-level-btn').removeClass('active btn-primary').addClass('btn-outline-secondary');
        $(this).addClass('active btn-primary').removeClass('btn-outline-secondary');
        currentLiftLevel = $(this).data('level');
        updateLiftCode();
    });
    if (!currentLiftGroup) {
        currentLiftGroup = '1';
        $('#lift-group-buttons .lift-group-btn[data-group="1"]').addClass('active btn-primary').removeClass('btn-outline-secondary');
    }
    if (!currentLiftLevel) {
        currentLiftLevel = 'B';
        $('#lift-level-buttons .lift-level-btn[data-level="B"]').addClass('active btn-primary').removeClass('btn-outline-secondary');
    }
    liftPanel.show();
}

function updateLiftCode() {
    if (currentLiftGroup && currentLiftLevel) {
        let liftCode = currentLiftGroup + 'Li' + currentLiftLevel;
        $('#elementSearch').val(liftCode);
    }
}

function renderElementsList() {
    let elementsList = $('#elements-list');
    elementsList.empty();
    if (!allElementsByType[currentType]) return;
    let items = [...allElementsByType[currentType]];

    if (currentType === 'jumps') {
        let grouped = {};
        items.forEach(el => {
            let name = getCleanName(el.code, el.description);
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(el);
        });
        for (let [name, variants] of Object.entries(grouped)) {
            let card = $(`<div class="col"><div class="card element-card" data-name="${name}" style="cursor:pointer;"><div class="card-body p-2"><strong>${name}</strong></div></div></div>`);
            card.click(function() {
                let baseName = getJumpBaseName(variants[0].code);
                let newCode;
                if (baseName === 'Eu') {
                    newCode = '1Eu';
                } else {
                    newCode = getJumpCodeWithTurns(baseName, currentTurns);
                }
                appendOrReplaceInSearch(newCode);
            });
            elementsList.append(card);
        }
    } else if (currentType === 'throws') {
        let grouped = {};
        items.forEach(el => {
            let match = el.code.match(/^(\d+)([A-Za-z]+)Th$/);
            let name = match ? match[2] : el.code;
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(el);
        });
        for (let [name, variants] of Object.entries(grouped)) {
            let card = $(`<div class="col"><div class="card element-card" data-name="${name}" style="cursor:pointer;"><div class="card-body p-2"><strong>${name}Th</strong></div></div></div>`);
            card.click(function() {
                let originalCode = variants[0].code;
                let turns = currentTurns;
                let newCode;
                if (turns && originalCode.match(/^\d/)) {
                    newCode = turns + originalCode.slice(1);
                } else {
                    newCode = originalCode;
                }
                appendOrReplaceInSearch(newCode);
            });
            elementsList.append(card);
        }
    } else if (currentType === 'lifts') {
        let card = $(`<div class="col"><div class="card element-card" data-name="Li" style="cursor:pointer;"><div class="card-body p-2"><strong>Li</strong></div></div></div>`);
        card.click(function() {
            if (currentLiftGroup && currentLiftLevel) {
                let liftCode = currentLiftGroup + 'Li' + currentLiftLevel;
                appendOrReplaceInSearch(liftCode);
            } else {
                alert('Выберите группу и уровень поддержки');
            }
        });
        elementsList.append(card);
    } else if (currentType === 'twist_lifts') {
        for (let turns = 1; turns <= 4; turns++) {
            let card = $(`<div class="col"><div class="card element-card" data-turns="${turns}" style="cursor:pointer;"><div class="card-body p-2"><strong>${turns}Tw</strong></div></div></div>`);
            card.click(function() {
                if (currentTwistLevel) {
                    let twistCode = turns + 'Tw' + currentTwistLevel;
                    appendOrReplaceInSearch(twistCode);
                } else {
                    alert('Сначала выберите уровень подкрутки в левой панели');
                }
            });
            elementsList.append(card);
        }
    } else {
        let grouped = {};
        items.forEach(el => {
            let baseName = el.code.replace(/[B1-4]$/, '');
            if (currentType === 'twists') {
                baseName = el.code.replace(/[B1-4]$/, '');
            }
            if (!grouped[baseName]) grouped[baseName] = [];
            grouped[baseName].push(el);
        });
        for (let [baseName, variants] of Object.entries(grouped)) {
            let displayName = baseName;
            if (baseName === 'ChSq') displayName = 'ChSq';
            if (currentType === 'twists') displayName = 'SqTw';
            let card = $(`<div class="col"><div class="card element-card" data-name="${baseName}" style="cursor:pointer;"><div class="card-body p-2"><strong>${displayName}</strong></div></div></div>`);
            card.click(function() {
                let selected = variants.find(v => String(v.level) === String(currentLevel));
                if (!selected && variants.length) {
                    selected = variants[0];
                }
                if (selected) {
                    let finalCode = selected.code;
                    if (currentType === 'twists') {
                        finalCode = selected.code;
                    }
                    appendOrReplaceInSearch(finalCode);
                } else {
                    alert(`Нет элемента ${baseName} с уровнем ${currentLevel}`);
                }
            });
            elementsList.append(card);
        }
    }
}

function appendOrReplaceInSearch(newCode) {
    let currentVal = $('#elementSearch').val();
    let parts = currentVal.split('+').filter(p => p.trim() !== '');
    if (parts.length === 0) {
        $('#elementSearch').val(newCode);
        return;
    }
    if (currentVal.endsWith('+')) {
        $('#elementSearch').val(currentVal + newCode);
    } else {
        parts[parts.length - 1] = newCode;
        $('#elementSearch').val(parts.join('+'));
    }
}