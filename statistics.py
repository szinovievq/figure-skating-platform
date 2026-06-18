from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from models import db, User, Program, ProgramElement
from datetime import datetime

statistics_bp = Blueprint('statistics', __name__)


@statistics_bp.route('/<int:athlete_id>')
@login_required
def athlete_stats(athlete_id):
    athlete = User.query.get_or_404(athlete_id)
    if current_user.role != 'coach' and current_user.id != athlete_id:
        return "Access denied", 403
    return render_template('statistics.html', athlete=athlete)


@statistics_bp.route('/data/<int:athlete_id>')
@login_required
def stats_data(athlete_id):
    athlete = User.query.get_or_404(athlete_id)
    if current_user.role != 'coach' and current_user.id != athlete_id:
        return jsonify({'error': 'no access'}), 403

    start_date = request.args.get('start')
    end_date = request.args.get('end')
    program_type = request.args.get('program_type')
    element_code = request.args.get('element_code')

    base_query = Program.query.filter_by(athlete_id=athlete_id)
    if start_date:
        base_query = base_query.filter(Program.program_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        base_query = base_query.filter(Program.program_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    programs_short = base_query.filter(Program.program_type == 'short').all()
    programs_free = base_query.filter(Program.program_type == 'free').all()
    avg_short = sum(p.total_score for p in programs_short) / len(programs_short) if programs_short else None
    avg_free = sum(p.total_score for p in programs_free) / len(programs_free) if programs_free else None

    query = base_query
    if program_type and program_type != 'all':
        query = query.filter(Program.program_type == program_type)

    programs = query.all()

    points_by_date = [{'date': p.program_date.strftime('%Y-%m-%d'), 'total_score': p.total_score, 'program_type': p.program_type} for p in programs]

    all_elems = ProgramElement.query.join(Program).filter(Program.athlete_id == athlete_id)
    if start_date:
        all_elems = all_elems.filter(Program.program_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        all_elems = all_elems.filter(Program.program_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    if program_type and program_type != 'all':
        all_elems = all_elems.filter(Program.program_type == program_type)

    all_element_codes = sorted(set(pe.element_code for pe in all_elems))

    full_stats = {}
    for pe in all_elems:
        code = pe.element_code
        if code not in full_stats:
            full_stats[code] = {'total': 0, 'success': 0}
        full_stats[code]['total'] += 1
        success = not (pe.invalid or pe.fall or pe.underrotation == '<<' or pe.edge == 'e')
        if success:
            full_stats[code]['success'] += 1

    unstable = None
    for code, st in full_stats.items():
        rate = st['success'] / st['total'] if st['total'] > 0 else 1
        if unstable is None or rate < unstable['rate']:
            unstable = {'code': code, 'rate': rate, 'total': st['total'], 'success': st['success']}

    if element_code and element_code in full_stats:
        element_labels = [element_code]
        success_counts = [full_stats[element_code]['success']]
        total_counts = [full_stats[element_code]['total']]
    else:
        sorted_elements = sorted(full_stats.items(), key=lambda x: x[1]['total'], reverse=True)[:10]
        element_labels = [code for code, _ in sorted_elements]
        success_counts = [full_stats[code]['success'] for code in element_labels]
        total_counts = [full_stats[code]['total'] for code in element_labels]

    return jsonify({
        'points_over_time': points_by_date,
        'elements': element_labels,
        'success_counts': success_counts,
        'total_counts': total_counts,
        'most_unstable': unstable,
        'all_element_codes': all_element_codes,
        'avg_short': avg_short,
        'avg_free': avg_free
    })