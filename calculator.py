from flask import Blueprint, render_template, request, jsonify, send_file, flash, redirect, url_for
from flask_login import login_required, current_user
from models import db, Element, Program, ProgramElement, User
from io import StringIO
import re
from datetime import datetime
from logger import logger

calculator_bp = Blueprint('calculator', __name__)


@calculator_bp.route('/')
def calculator():
    athletes = []
    selected_athlete_id = request.args.get('athlete_id')
    if current_user.is_authenticated and current_user.role == 'coach':
        athletes = User.query.filter_by(coach_id=current_user.id).all()
        if selected_athlete_id:
            selected_athlete = User.query.get(selected_athlete_id)
            if selected_athlete and selected_athlete.coach_id == current_user.id:
                pass
            else:
                selected_athlete_id = None
    return render_template('calculator.html', coach_athletes=[{'id': a.id, 'name': a.full_name} for a in athletes],
                           selected_athlete_id=selected_athlete_id)


@calculator_bp.route('/api/elements')
def api_elements():
    q = request.args.get('q', '')
    query = Element.query
    if q:
        query = query.filter(Element.element_code.ilike(f'{q}%'))
    elements = query.limit(20).all()
    result = []
    for e in elements:
        code = e.element_code
        category = None
        if any(code.endswith(x) for x in ['A', 'T', 'S', 'Lo', 'F', 'Lz', 'Eu']) and not any(
                x in code for x in ['Th', 'SqTw', 'Li', 'BoDs', 'FiDs', 'FoDs', 'BiDs', 'Tw']):
            category = 'jump'
        elif 'Th' in code:
            category = 'throw'
        result.append({
            'code': e.element_code,
            'description': e.description,
            'base_value': e.base_value,
            'category': category
        })
    return jsonify(result)


@calculator_bp.route('/api/elements_by_type')
def api_elements_by_type():
    elements = Element.query.all()

    types = {
        'jumps': [],
        'spins': [],
        'steps': [],
        'throws': [],
        'twist_lifts': [],
        'twists': [],
        'lifts': [],
        'death_spirals': []
    }

    for elem in elements:
        code = elem.element_code
        if any(code.endswith(x) for x in ['A', 'T', 'S', 'Lo', 'F', 'Lz', 'Eu']) and not any(
                x in code for x in ['Th', 'SqTw', 'Li', 'BoDs', 'FiDs', 'FoDs', 'BiDs', 'Tw']):
            match = re.search(r'^(\d+)', code)
            turns = int(match.group(1)) if match else 0
            types['jumps'].append({
                'code': code,
                'description': elem.description,
                'base_value': elem.base_value,
                'turns': turns,
                'category': 'jump'
            })
        elif 'Sp' in code:
            level = code[-1]
            types['spins'].append({
                'code': code,
                'description': elem.description,
                'base_value': elem.base_value,
                'level': level,
                'category': 'spin'
            })
        elif 'StSq' in code:
            level = code[-1]
            types['steps'].append({
                'code': code,
                'description': elem.description,
                'base_value': elem.base_value,
                'level': level,
                'category': 'step'
            })
        elif 'ChSq' in code:
            types['steps'].append({
                'code': code,
                'description': elem.description,
                'base_value': elem.base_value,
                'level': '',
                'category': 'step'
            })
        elif 'Th' in code:
            match = re.search(r'^(\d+)', code)
            turns = int(match.group(1)) if match else 0
            types['throws'].append({
                'code': code,
                'description': elem.description,
                'base_value': elem.base_value,
                'turns': turns,
                'category': 'throw'
            })
        elif 'Tw' in code and 'Sq' not in code:
            match = re.search(r'^(\d+)Tw([B1-4])$', code)
            if match:
                turns = int(match.group(1))
                level = match.group(2)
                types['twist_lifts'].append({
                    'code': code,
                    'description': elem.description,
                    'base_value': elem.base_value,
                    'turns': turns,
                    'level': level,
                    'category': 'twist_lift'
                })
        elif 'SqTw' in code:
            level = code[-1]
            types['twists'].append({
                'code': code,
                'display_code': code,
                'description': elem.description,
                'base_value': elem.base_value,
                'level': level,
                'category': 'twist'
            })
        elif 'Li' in code:
            match = re.search(r'^(\d+)Li([B1-4])$', code)
            if match:
                group = match.group(1)
                level = match.group(2)
                types['lifts'].append({
                    'code': code,
                    'description': elem.description,
                    'base_value': elem.base_value,
                    'group': group,
                    'level': level,
                    'category': 'lift'
                })
        elif code.startswith('BoDs') or code.startswith('FiDs') or code.startswith('FoDs') or code.startswith('BiDs'):
            level = code[-1]
            types['death_spirals'].append({
                'code': code,
                'description': elem.description,
                'base_value': elem.base_value,
                'level': level,
                'category': 'death_spiral'
            })

    return jsonify(types)


@calculator_bp.route('/save', methods=['POST'])
@login_required
def save_program():
    data = request.json
    program_name = data.get('name', 'Untitled')
    elements_data = data.get('elements', [])
    target_athlete_id = data.get('athlete_id')
    export_only = data.get('export_only', False)

    if export_only:
        output = StringIO()
        output.write(f"Program: {program_name}\n\n")
        for elem in elements_data:
            output.write(
                f"{elem['code']} : base {elem['base']} | GOE {elem['goe']} | second half {elem['second_half']} | total {elem.get('total', '?')}\n")
        output.seek(0)
        return send_file(StringIO(output.getvalue()), as_attachment=True, download_name=f"{program_name}.txt",
                         mimetype='text/plain')
    else:
        athlete_id = target_athlete_id if current_user.role == 'coach' else current_user.id
        if not athlete_id:
            return jsonify({'error': 'No athlete specified'}), 400
        program = Program(name=program_name, athlete_id=athlete_id, created_by=current_user.id,
                          program_type='free', discipline='singles', program_date=datetime.today().date())
        db.session.add(program)
        db.session.flush()
        for elem in elements_data:
            total = elem.get('total')
            if total is None:
                base = elem.get('base', 0)
                goe = elem.get('goe', 0)
                second_half = elem.get('second_half', False)
                if second_half:
                    base *= 1.1
                total = base + base * goe * 0.1
            pe = ProgramElement(
                program_id=program.id,
                element_code=elem['code'],
                base_value_snapshot=elem['base'],
                base_multiplier=elem.get('multiplier', 1.0),
                goe=elem.get('goe', 0),
                second_half=elem.get('second_half', False),
                fall=elem.get('fall', False),
                underrotation=elem.get('underrotation', ''),
                edge=elem.get('edge', ''),
                invalid=elem.get('invalid', False),
                total_points=total
            )
            db.session.add(pe)
        db.session.commit()
        return jsonify({'status': 'ok', 'program_id': program.id})


@calculator_bp.route('/save_program_full', methods=['POST'])
@login_required
def save_program_full():
    data = request.json
    program_name = data.get('name')
    athlete_id = data.get('athlete_id')
    partner_id = data.get('partner_id')
    program_type = data.get('program_type')
    discipline = data.get('discipline')
    program_date = data.get('program_date')
    elements_data = data.get('elements')
    comp_sk = data.get('comp_sk', 0)
    comp_tr = data.get('comp_tr', 0)
    comp_pe = data.get('comp_pe', 0)
    comp_co = data.get('comp_co', 0)
    comp_in = data.get('comp_in', 0)
    component_coeff = data.get('component_coeff', 1.0)
    total_score = data.get('total_score', 0)
    components_score = data.get('components_score', 0)
    deductions = data.get('deductions', 0)

    coach_name = current_user.full_name
    coach_username = current_user.username

    try:
        if not program_name or not athlete_id:
            logger.warning(
                f'Попытка сохранения программы тренером {coach_username} ({coach_name}) с пропущенными полями: name={program_name}, athlete_id={athlete_id}')
            return jsonify({'error': 'Missing required fields'}), 400

        def create_program_for_athlete(aid):
            program = Program(
                name=program_name,
                athlete_id=aid,
                created_by=current_user.id,
                program_type=program_type,
                discipline=discipline,
                program_date=datetime.strptime(program_date, '%Y-%m-%d').date(),
                total_score=total_score,
                components_score=components_score,
                deductions=deductions,
                comp_sk=comp_sk,
                comp_tr=comp_tr,
                comp_pe=comp_pe,
                comp_co=comp_co,
                comp_in=comp_in,
                component_coeff=component_coeff
            )
            db.session.add(program)
            db.session.flush()
            for elem in elements_data:
                pe = ProgramElement(
                    program_id=program.id,
                    element_code=elem['code'],
                    base_value_snapshot=elem['base'],
                    base_multiplier=elem.get('multiplier', 1.0),
                    goe=elem.get('goe', 0),
                    second_half=elem.get('second_half', False),
                    fall=elem.get('fall', False),
                    underrotation=elem.get('underrotation', ''),
                    edge=elem.get('edge', ''),
                    invalid=elem.get('invalid', False),
                    total_points=elem.get('total', 0)
                )
                db.session.add(pe)
            return program.id

        program_id1 = create_program_for_athlete(int(athlete_id))
        logger.info(
            f'Тренер {coach_username} ({coach_name}) сохранил программу "{program_name}" для спортсмена ID {athlete_id} (тип: {program_type}, дисциплина: {discipline})')

        if discipline == 'pairs' and partner_id:
            program_id2 = create_program_for_athlete(int(partner_id))
            db.session.commit()
            logger.info(
                f'Тренер {coach_username} ({coach_name}) также сохранил программу "{program_name}" для партнёра ID {partner_id} (парное катание)')
            return jsonify({'status': 'ok', 'program_id': program_id1, 'partner_program_id': program_id2})
        else:
            db.session.commit()
            return jsonify({'status': 'ok', 'program_id': program_id1})

    except Exception as e:
        db.session.rollback()
        logger.error(
            f'Ошибка при сохранении программы тренером {coach_username} ({coach_name}): {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


@calculator_bp.route('/program/<int:program_id>')
def view_program(program_id):
    program = Program.query.get_or_404(program_id)
    if current_user.is_authenticated:
        if current_user.id != program.athlete_id and not (current_user.role == 'coach' and current_user.id == program.created_by):
            return "Access denied", 403
    else:
        return redirect(url_for('auth.login'))
    elements = program.elements
    return render_template('program_view.html', program=program, elements=elements)


@calculator_bp.route('/coach/athletes')
@login_required
def coach_athletes():
    if current_user.role != 'coach':
        return jsonify([])
    athletes = User.query.filter_by(coach_id=current_user.id).all()
    return jsonify([{'id': a.id, 'name': a.username} for a in athletes])


@calculator_bp.route('/api/all_jumps')
def api_all_jumps():
    elements = Element.query.all()
    jumps = []
    for elem in elements:
        code = elem.element_code
        if any(code.endswith(x) for x in ['A', 'T', 'S', 'Lo', 'F', 'Lz', 'Eu']) and not any(
                x in code for x in ['Th', 'SqTw', 'Li', 'BoDs', 'FiDs', 'FoDs', 'BiDs', 'Tw']):
            match = re.search(r'^(\d+)', code)
            turns = int(match.group(1)) if match else 0
            name = get_jump_name(code)
            jumps.append({
                'code': code,
                'name': name,
                'turns': turns,
                'base_value': elem.base_value
            })
    grouped = {}
    for j in jumps:
        if j['name'] not in grouped:
            grouped[j['name']] = []
        grouped[j['name']].append({'turns': j['turns'], 'code': j['code'], 'base_value': j['base_value']})
    return jsonify(grouped)


def get_jump_name(code):
    if code.endswith('A'): return 'Axel'
    if code.endswith('T'): return 'Toeloop'
    if code.endswith('S'): return 'Salchow'
    if code.endswith('Lo'): return 'Loop'
    if code.endswith('F'): return 'Flip'
    if code.endswith('Lz'): return 'Lutz'
    if code.endswith('Eu'): return 'Euler'
    return code


@calculator_bp.route('/delete_program/<int:program_id>', methods=['POST'])
@login_required
def delete_program(program_id):
    program = Program.query.get_or_404(program_id)

    if current_user.role == 'coach':
        if program.created_by != current_user.id:
            logger.warning(f'Тренер {current_user.username} попытался удалить программу ID {program_id}, не являясь её создателем')
            flash('У вас нет прав на удаление этой программы', 'danger')
            return redirect(url_for('main.profile'))
    else:
        flash('Только тренер может удалять программы', 'danger')
        return redirect(url_for('main.profile'))

    program_name = program.name
    athlete_username = program.athlete.username

    db.session.delete(program)
    db.session.commit()
    logger.info(f'Тренер {current_user.username} удалил программу "{program_name}" (ID {program_id}) для спортсмена {athlete_username}')

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'status': 'ok'})
    else:
        flash('Программа удалена', 'success')
        return redirect(url_for('main.profile'))