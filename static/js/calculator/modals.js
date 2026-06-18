let currentEditIdx = null;

function showGoeModal(idx) {
    currentEditIdx = idx;
    let element = currentElements[idx];
    let currentGoe = 0;
    if (element.isCascade && element.parts) {
        currentGoe = getCascadeDisplayGoe(element);
    } else {
        currentGoe = element.goe || 0;
    }
    $('#modalGoeNegative, #modalGoeZero, #modalGoePositive').empty();
    for (let g = -5; g <= 5; g++) {
        let cls = g < 0 ? 'neg' : (g === 0 ? 'zero' : 'pos');
        let active = (currentGoe === g) ? 'active' : '';
        let btn = `<button class="goe-btn ${cls} ${active} modal-goe-btn" data-goe="${g}">${g}</button>`;
        if (g < 0) $('#modalGoeNegative').append(btn);
        else if (g === 0) $('#modalGoeZero').append(btn);
        else $('#modalGoePositive').append(btn);
    }
    $('#goeModal').modal('show');
}

$(document).off('click', '.modal-goe-btn').on('click', '.modal-goe-btn', function() {
    let newGoe = parseInt($(this).data('goe'));
    if (currentEditIdx !== null) {
        let element = currentElements[currentEditIdx];
        if (element.isCascade && element.parts) {
            setCascadeGoe(element, newGoe);
        } else {
            element.goe = newGoe;
        }
        renderTable();
        if ($('#editModal').hasClass('show')) {
            updateEditModalContent(currentEditIdx);
        }
        $('#goeModal').modal('hide');
    }
});

function updateEditModalContent(idx) {
    let element = currentElements[idx];
    let isCascade = element.isCascade === true;
    let content = $('#editModalContent');
    content.empty();

    let table = $('<table class="table table-bordered"><thead><tr><th style="width:40%">Элемент</th><th>Модификаторы</th></tr></thead><tbody></tbody></table>');
    let tbody = table.find('tbody');

    if (isCascade && element.parts) {
        for (let i = 0; i < element.parts.length; i++) {
            let part = element.parts[i];
            let isJumpOrThrow = /^\d+(?:A|T|S|Lo|F|Lz|Eu)$/.test(part.code) ||
                                /^\d+[A-Za-z]+Th$/.test(part.code) ||
                                part.category === 'jump' || part.category === 'throw';
            let isTwist = part.category === 'twist_lifts';
            let row = $('<tr>').data('part-index', i);
            let nameCell = $('<td style="vertical-align: middle;"></td>').text(part.code);
            row.append(nameCell);
            let modCell = $('<td style="vertical-align: middle;"></td>');
            let modContainer = $('<div class="d-flex flex-wrap gap-2 justify-content-center"></div>');

            if (isJumpOrThrow) {
                let underrotLt = $(`<button class="btn btn-sm mod-edit-btn ${part.underrotation === '<' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="underrot" data-val="<">&lt;</button>`);
                let underrotLtLt = $(`<button class="btn btn-sm mod-edit-btn ${part.underrotation === '<<' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="underrot" data-val="<<">&lt;&lt;</button>`);
                let edgeE = $(`<button class="btn btn-sm mod-edit-btn ${part.edge === 'e' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="edge" data-val="e">e</button>`);
                let edgeExcl = $(`<button class="btn btn-sm mod-edit-btn ${part.edge === '!' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="edge" data-val="!">!</button>`);
                let qBtn = $(`<button class="btn btn-sm mod-edit-btn ${part.q ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="q">q</button>`);
                let fallBtn = $(`<button class="btn btn-sm mod-edit-btn ${part.fall ? 'btn-danger' : 'btn-outline-secondary'}" data-mod="fall">FALL</button>`);
                let invalidBtn = $(`<button class="btn btn-sm mod-edit-btn ${part.invalid ? 'btn-warning' : 'btn-outline-secondary'}" data-mod="invalid">*</button>`);
                modContainer.append(underrotLt, underrotLtLt, edgeE, edgeExcl, qBtn, fallBtn, invalidBtn);
            } else if (isTwist) {
                let vi1Btn = $(`<button class="btn btn-sm mod-edit-btn ${part.vi1 ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="vi1">vi1</button>`);
                let vi2Btn = $(`<button class="btn btn-sm mod-edit-btn ${part.vi2 ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="vi2">vi2</button>`);
                let fallBtn = $(`<button class="btn btn-sm mod-edit-btn ${part.fall ? 'btn-danger' : 'btn-outline-secondary'}" data-mod="fall">FALL</button>`);
                let invalidBtn = $(`<button class="btn btn-sm mod-edit-btn ${part.invalid ? 'btn-warning' : 'btn-outline-secondary'}" data-mod="invalid">*</button>`);
                modContainer.append(vi1Btn, vi2Btn, fallBtn, invalidBtn);
            } else {
                let fallBtn = $(`<button class="btn btn-sm mod-edit-btn ${part.fall ? 'btn-danger' : 'btn-outline-secondary'}" data-mod="fall">FALL</button>`);
                let invalidBtn = $(`<button class="btn btn-sm mod-edit-btn ${part.invalid ? 'btn-warning' : 'btn-outline-secondary'}" data-mod="invalid">*</button>`);
                modContainer.append(fallBtn, invalidBtn);
            }
            modCell.append(modContainer);
            row.append(modCell);
            tbody.append(row);
        }
    } else {
        let isJumpOrThrow = /^\d+(?:A|T|S|Lo|F|Lz|Eu)$/.test(element.code) ||
                            /^\d+[A-Za-z]+Th$/.test(element.code) ||
                            element.category === 'jump' || element.category === 'throw';
        let isTwist = element.category === 'twist_lifts';
        let row = $('<tr>').data('part-index', 0);
        let nameCell = $('<td style="vertical-align: middle;"></td>').text(element.code);
        row.append(nameCell);
        let modCell = $('<td style="vertical-align: middle;"></td>');
        let modContainer = $('<div class="d-flex flex-wrap gap-2 justify-content-center"></div>');

        if (isJumpOrThrow) {
            let underrotLt = $(`<button class="btn btn-sm mod-edit-btn ${element.underrotation === '<' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="underrot" data-val="<">&lt;</button>`);
            let underrotLtLt = $(`<button class="btn btn-sm mod-edit-btn ${element.underrotation === '<<' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="underrot" data-val="<<">&lt;&lt;</button>`);
            let edgeE = $(`<button class="btn btn-sm mod-edit-btn ${element.edge === 'e' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="edge" data-val="e">e</button>`);
            let edgeExcl = $(`<button class="btn btn-sm mod-edit-btn ${element.edge === '!' ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="edge" data-val="!">!</button>`);
            let qBtn = $(`<button class="btn btn-sm mod-edit-btn ${element.q ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="q">q</button>`);
            let fallBtn = $(`<button class="btn btn-sm mod-edit-btn ${element.fall ? 'btn-danger' : 'btn-outline-secondary'}" data-mod="fall">FALL</button>`);
            let invalidBtn = $(`<button class="btn btn-sm mod-edit-btn ${element.invalid ? 'btn-warning' : 'btn-outline-secondary'}" data-mod="invalid">*</button>`);
            modContainer.append(underrotLt, underrotLtLt, edgeE, edgeExcl, qBtn, fallBtn, invalidBtn);
        } else if (isTwist) {
            let vi1Btn = $(`<button class="btn btn-sm mod-edit-btn ${element.vi1 ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="vi1">vi1</button>`);
            let vi2Btn = $(`<button class="btn btn-sm mod-edit-btn ${element.vi2 ? 'btn-primary' : 'btn-outline-secondary'}" data-mod="vi2">vi2</button>`);
            let fallBtn = $(`<button class="btn btn-sm mod-edit-btn ${element.fall ? 'btn-danger' : 'btn-outline-secondary'}" data-mod="fall">FALL</button>`);
            let invalidBtn = $(`<button class="btn btn-sm mod-edit-btn ${element.invalid ? 'btn-warning' : 'btn-outline-secondary'}" data-mod="invalid">*</button>`);
            modContainer.append(vi1Btn, vi2Btn, fallBtn, invalidBtn);
        } else {
            let fallBtn = $(`<button class="btn btn-sm mod-edit-btn ${element.fall ? 'btn-danger' : 'btn-outline-secondary'}" data-mod="fall">FALL</button>`);
            let invalidBtn = $(`<button class="btn btn-sm mod-edit-btn ${element.invalid ? 'btn-warning' : 'btn-outline-secondary'}" data-mod="invalid">*</button>`);
            modContainer.append(fallBtn, invalidBtn);
        }
        modCell.append(modContainer);
        row.append(modCell);
        tbody.append(row);
    }
    content.append(table);
}

function openEditModal(idx) {
    currentEditIdx = idx;
    updateEditModalContent(idx);
    $('#editModal').modal('show');
}

$(document).off('click', '.mod-edit-btn').on('click', '.mod-edit-btn', function() {
    let btn = $(this);
    let row = btn.closest('tr');
    let idx = currentEditIdx;
    if (idx === undefined) return;
    let element = currentElements[idx];
    let mod = btn.data('mod');
    let val = btn.data('val');

    let partIndex = row.data('part-index');
    let target = null;
    if (element.isCascade && element.parts && partIndex !== undefined) {
        target = element.parts[partIndex];
    } else {
        target = element;
    }

    if (mod === 'underrot') {
        if (target.underrotation === val) {
            target.underrotation = '';
        } else {
            target.underrotation = val;
        }
        if (target.underrotation === '<' || target.underrotation === '<<') {
            target.q = false;
        }
    } else if (mod === 'q') {
        if (target.q) {
            target.q = false;
        } else {
            target.q = true;
            target.underrotation = '';
        }
    } else if (mod === 'edge') {
        if (target.edge === val) {
            target.edge = '';
        } else {
            target.edge = val;
        }
    } else if (mod === 'fall') {
        target.fall = !target.fall;
        if (target.fall) {
            target.goe = -5;
        } else {
            target.goe = 0;
        }
    } else if (mod === 'invalid') {
        target.invalid = !target.invalid;
    } else if (mod === 'vi1') {
        target.vi1 = !target.vi1;
        if (target.vi1 && target.vi2) target.vi2 = false;
    } else if (mod === 'vi2') {
        target.vi2 = !target.vi2;
        if (target.vi2 && target.vi1) target.vi1 = false;
    }

    if (element.isCascade && element.parts) {
        element.base = element.parts.reduce((sum, p) => sum + p.base, 0);
    }

    updateEditModalContent(idx);
    renderTable();
});