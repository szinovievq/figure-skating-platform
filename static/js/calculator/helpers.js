function getCleanName(elementCode, description) {
    if (elementCode.match(/[A-Za-z]+$/)) {
        let match = elementCode.match(/[A-Za-z]+$/)[0];
        if (match === 'A') return 'Аксель';
        if (match === 'T') return 'Тулуп';
        if (match === 'S') return 'Сальхов';
        if (match === 'Lo') return 'Риттбергер';
        if (match === 'F') return 'Флип';
        if (match === 'Lz') return 'Лутц';
        if (match === 'Eu') return 'Ойлер';
        return match;
    }
    return elementCode.replace(/[0-9]+$/, '');
}

function getJumpBaseName(code) {
    if (code.endsWith('A')) return 'A';
    if (code.endsWith('T')) return 'T';
    if (code.endsWith('S')) return 'S';
    if (code.endsWith('Lo')) return 'Lo';
    if (code.endsWith('F')) return 'F';
    if (code.endsWith('Lz')) return 'Lz';
    if (code.includes('Eu')) return 'Eu';
    return code;
}

function getJumpCodeWithTurns(baseName, turns) {
    if (turns === null || turns === undefined) return baseName;
    return turns + baseName;
}

function formatSingleElement(code, mods) {
    let result = code;
    if (mods.edge) result += mods.edge;
    if (mods.underrot) result += mods.underrot;
    if (mods.q) result += 'q';
    if (mods.invalid) result += '*';
    return result;
}

function getDisplayCode(element) {
    if (element.isCascade && element.parts) {
        return element.parts.map(part => {
            let mods = {
                underrot: part.underrotation || '',
                edge: part.edge || '',
                q: part.q || false,
                invalid: part.invalid || false
            };
            return formatSingleElement(part.code, mods);
        }).join('+');
    } else {
        let mods = {
            underrot: element.underrotation || '',
            edge: element.edge || '',
            q: element.q || false,
            invalid: element.invalid || false
        };
        return formatSingleElement(element.code, mods);
    }
}

function getCategoryFromCode(code) {
    if (!code) return null;
    if (code.endsWith('Th')) return 'throw';
    if (/^\d+[A|T|S|Lo|F|Lz|Eu]$/.test(code)) return 'jump';
    return null;
}

function getElementBaseByCode(code) {
    for (let type in allElementsByType) {
        let found = allElementsByType[type].find(el => el.code === code);
        if (found) return found.base_value;
    }
    return null;
}

function applyJumpThrowModifiers(base, item) {
    let hasUnderrot = item.underrotation;
    let hasWrongEdge = (item.edge === 'e');
    let category = item.category || getCategoryFromCode(item.code);
    let isThrow = (category === 'throw');
    let isJump = (category === 'jump');

    if (hasUnderrot === '<<') {
        let code = item.code;
        let turns = parseInt(code.charAt(0));
        if (!isNaN(turns)) {
            let newTurns = turns - 1;
            if (newTurns <= 0) {
                base = 0;
            } else {
                let basePart = code.slice(1);
                let newCode = newTurns + basePart;
                let foundBase = getElementBaseByCode(newCode);
                if (foundBase !== null) {
                    base = foundBase;
                }
            }
        }
        if (hasWrongEdge) {
            base *= 0.8;
        }
        return base;
    }
    if (hasUnderrot === '<') {
        if (isThrow) {
            base *= 0.75;
        } else {
            base *= 0.8;
        }

        if (hasWrongEdge && isJump) {
            base *= 0.75;
        }

        return base;
    }

    if (hasWrongEdge) {
        if (isJump) {
            base *= 0.8;
        }
    }
    return base;
}

function calculateModifiedBase(item) {
    let base = item.base;
    let category = item.category || getCategoryFromCode(item.code);
    if (category === 'jump' || category === 'throw') {
        base = applyJumpThrowModifiers(base, item);
    } else {
        let mult = 1.0;
        if (item.underrotation === '<') mult = 0.7;
        if (item.underrotation === '<<') mult = 0.3;
        if (item.edge === 'e') mult *= 0.8;
        base *= mult;
    }
    if (item.invalid) return 0;
    return base;
}

function calculateSingleTotal(item, secondHalf) {
    let base = item.base;
    if (secondHalf) base *= 1.1;
    let category = item.category || getCategoryFromCode(item.code);
    if (category === 'jump' || category === 'throw') {
        base = applyJumpThrowModifiers(base, item);
    } else {
        let mult = 1.0;
        if (item.underrotation === '<') mult = 0.7;
        if (item.underrotation === '<<') mult = 0.3;
        if (item.edge === 'e') mult *= 0.8;
        base *= mult;
    }
    if (item.invalid) return 0;
    let goeBonus = base * (item.goe || 0) * 0.1;
    return base + goeBonus;
}

function getMostExpensivePartIndex(parts) {
    let maxIdx = 0;
    let maxBase = parts[0].base;
    for (let i = 1; i < parts.length; i++) {
        if (parts[i].base > maxBase) {
            maxBase = parts[i].base;
            maxIdx = i;
        }
    }
    return maxIdx;
}

function getCascadeDisplayGoe(element) {
    if (!element.isCascade || !element.parts) return 0;
    let maxIdx = getMostExpensivePartIndex(element.parts);
    return element.parts[maxIdx].goe || 0;
}

function setCascadeGoe(element, newGoe) {
    if (!element.isCascade || !element.parts) return;
    let maxIdx = getMostExpensivePartIndex(element.parts);
    element.parts[maxIdx].goe = newGoe;
}

function calculateCascadeTotal(element) {
    if (!element.isCascade || !element.parts) return 0;
    let parts = element.parts;
    let sumModified = 0;
    let maxOriginalBase = -1;
    let maxIndex = 0;
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i];
        sumModified += calculateModifiedBase(part);
        if (part.base > maxOriginalBase) {
            maxOriginalBase = part.base;
            maxIndex = i;
        }
    }
    let maxPart = parts[maxIndex];
    let goeAdjust = 0;
    if (maxPart.goe && maxPart.goe !== 0) {
        goeAdjust = maxPart.base * maxPart.goe * 0.1;
    }
    let total = sumModified + goeAdjust;
    if (element.second_half) total *= 1.1;
    return total;
}

function calculateTotal(element) {
    if (element.isCascade && element.parts) {
        return calculateCascadeTotal(element);
    } else {
        return calculateSingleTotal(element, element.second_half);
    }
}

function countFalls() {
    let falls = 0;
    for (let el of currentElements) {
        if (el.isCascade && el.parts) {
            falls += el.parts.filter(p => p.fall).length;
        } else {
            if (el.fall) falls++;
        }
    }
    return falls;
}

function getModifiedBaseForDisplay(element) {
    if (element.isCascade && element.parts) {
        let total = 0;
        for (let part of element.parts) {
            total += calculateModifiedBase(part);
        }
        return total;
    } else {
        return calculateModifiedBase(element);
    }
}