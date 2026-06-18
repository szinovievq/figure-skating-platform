from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify
from flask_login import login_required, current_user
from models import db, User, Program, Invitation
from sqlalchemy import or_
from logger import logger

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def home():
    return render_template('home.html')


@main_bp.route('/profile')
@login_required
def profile():
    if current_user.role == 'coach':
        athletes = User.query.filter_by(coach_id=current_user.id, role='athlete').all()
        pending_invitations = Invitation.query.filter_by(coach_id=current_user.id, status='pending').all()
        pending_athletes = [inv.athlete for inv in pending_invitations]
        return render_template('coach_profile.html', athletes=athletes, pending_athletes=pending_athletes)
    else:
        coach = User.query.get(current_user.coach_id) if current_user.coach_id else None
        invitations = Invitation.query.filter_by(athlete_id=current_user.id, status='pending').all()
        accepted_invites = Invitation.query.filter_by(athlete_id=current_user.id, status='accepted').all()
        coaches = [inv.coach for inv in accepted_invites]
        programs = Program.query.filter_by(athlete_id=current_user.id).all()
        return render_template('athlete_profile.html', coach=coach, invitations=invitations, coaches=coaches, programs=programs)


@main_bp.route('/api/search_athletes')
@login_required
def search_athletes():
    if current_user.role != 'coach':
        return jsonify([])
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify([])
    query = User.query.filter(
        User.role == 'athlete',
        User.coach_id.is_(None),
        User.full_name.ilike(f'%{q}%')
    )
    pending_athlete_ids = [inv.athlete_id for inv in Invitation.query.filter_by(coach_id=current_user.id, status='pending').all()]
    accepted_athlete_ids = [inv.athlete_id for inv in Invitation.query.filter_by(coach_id=current_user.id, status='accepted').all()]
    existing_athlete_ids = [a.id for a in User.query.filter_by(coach_id=current_user.id).all()]
    exclude_ids = set(pending_athlete_ids + accepted_athlete_ids + existing_athlete_ids)
    athletes = query.filter(User.id.notin_(exclude_ids)).limit(10).all()
    result = [{'id': a.id, 'full_name': a.full_name, 'birth_date': a.birth_date.strftime('%d.%m.%Y') if a.birth_date else ''} for a in athletes]
    return jsonify(result)


@main_bp.route('/api/send_invitation', methods=['POST'])
@login_required
def send_invitation():
    if current_user.role != 'coach':
        logger.warning(f'Попытка отправки приглашения пользователем {current_user.username} (не тренер)')
        return jsonify({'error': 'Only coaches can send invitations'}), 403
    data = request.get_json()
    athlete_id = data.get('athlete_id')
    if not athlete_id:
        logger.warning(f'Тренер {current_user.username} попытался отправить приглашение без указания athlete_id')
        return jsonify({'error': 'Athlete ID required'}), 400
    athlete = User.query.get(athlete_id)
    if not athlete or athlete.role != 'athlete':
        logger.warning(f'Тренер {current_user.username} попытался отправить приглашение несуществующему спортсмену ID {athlete_id}')
        return jsonify({'error': 'Invalid athlete'}), 400
    if athlete.coach_id is not None:
        logger.info(f'Тренер {current_user.username} попытался отправить приглашение спортсмену {athlete.username}, у которого уже есть тренер')
        return jsonify({'error': 'Athlete already has a coach'}), 400

    existing = Invitation.query.filter_by(coach_id=current_user.id, athlete_id=athlete_id).first()
    if existing:
        if existing.status == 'pending':
            logger.info(f'Тренер {current_user.username} повторно отправил приглашение спортсмену {athlete.username} (уже есть pending)')
            return jsonify({'error': 'Invitation already sent'}), 400
        elif existing.status == 'accepted':
            logger.info(f'Тренер {current_user.username} попытался отправить приглашение спортсмену {athlete.username}, который уже принял приглашение')
            return jsonify({'error': 'Athlete already accepted invitation'}), 400
        elif existing.status == 'declined':
            db.session.delete(existing)
            db.session.commit()
            logger.info(f'Тренер {current_user.username} повторно отправляет приглашение спортсмену {athlete.username} (предыдущее было отклонено)')

    inv = Invitation(coach_id=current_user.id, athlete_id=athlete_id, status='pending')
    db.session.add(inv)
    db.session.commit()
    logger.info(f'Тренер {current_user.username} отправил приглашение спортсмену {athlete.username} (ID {athlete_id})')
    return jsonify({'message': 'Invitation sent'})


@main_bp.route('/api/get_invitations')
@login_required
def get_invitations():
    if current_user.role != 'athlete':
        return jsonify([])
    invitations = Invitation.query.filter_by(athlete_id=current_user.id, status='pending').all()
    result = [{'id': inv.id, 'coach_name': inv.coach.full_name, 'coach_id': inv.coach_id} for inv in invitations]
    return jsonify(result)


@main_bp.route('/api/respond_invitation', methods=['POST'])
@login_required
def respond_invitation():
    if current_user.role != 'athlete':
        logger.warning(f'Попытка ответа на приглашение пользователем {current_user.username} (не спортсмен)')
        return jsonify({'error': 'Only athletes can respond'}), 403
    data = request.get_json()
    invitation_id = data.get('invitation_id')
    action = data.get('action')
    inv = Invitation.query.get(invitation_id)
    if not inv or inv.athlete_id != current_user.id:
        logger.warning(f'Спортсмен {current_user.username} попытался ответить на несуществующее приглашение ID {invitation_id}')
        return jsonify({'error': 'Invalid invitation'}), 400

    if action == 'accept':
        inv.status = 'accepted'
        current_user.coach_id = inv.coach_id
        db.session.add(current_user)
        Invitation.query.filter_by(coach_id=inv.coach_id, athlete_id=current_user.id, status='pending').delete()
        db.session.commit()
        logger.info(f'Спортсмен {current_user.username} принял приглашение от тренера {inv.coach.username} (ID {inv.coach_id})')
        return jsonify({'message': 'Response recorded'})
    elif action == 'decline':
        coach_username = inv.coach.username
        coach_id = inv.coach_id
        db.session.delete(inv)
        db.session.commit()
        logger.info(f'Спортсмен {current_user.username} отклонил приглашение от тренера {coach_username} (ID {coach_id}), запись удалена')
        return jsonify({'message': 'Invitation declined and removed'})
    else:
        logger.warning(f'Спортсмен {current_user.username} отправил неизвестное действие "{action}" при ответе на приглашение')
        return jsonify({'error': 'Invalid action'}), 400


@main_bp.route('/api/remove_coach', methods=['POST'])
@login_required
def remove_coach():
    if current_user.role != 'athlete':
        logger.warning(f'Попытка удаления тренера пользователем {current_user.username} (не спортсмен)')
        return jsonify({'error': 'Only athletes can remove coach'}), 403
    if current_user.coach_id:
        coach_name = User.query.get(current_user.coach_id).full_name if current_user.coach_id else 'неизвестный'
        Invitation.query.filter_by(
            coach_id=current_user.coach_id,
            athlete_id=current_user.id
        ).delete()
        current_user.coach_id = None
        db.session.commit()
        logger.info(f'Спортсмен {current_user.username} отвязался от тренера {coach_name} (ID {current_user.coach_id})')
        return jsonify({'message': 'Coach removed successfully'})
    else:
        logger.info(f'Спортсмен {current_user.username} попытался отвязаться от тренера, но у него нет тренера')
        return jsonify({'error': 'No coach to remove'}), 400


@main_bp.route('/api/my_coaches')
@login_required
def my_coaches():
    if current_user.role != 'athlete':
        return jsonify([])
    accepted = Invitation.query.filter_by(athlete_id=current_user.id, status='accepted').all()
    result = [{'id': inv.coach_id, 'name': inv.coach.full_name} for inv in accepted]
    if current_user.coach_id:
        coach = User.query.get(current_user.coach_id)
        if coach and not any(c['id'] == coach.id for c in result):
            result.append({'id': coach.id, 'name': coach.full_name})
    return jsonify(result)


@main_bp.route('/api/my_athletes')
@login_required
def my_athletes():
    if current_user.role != 'coach':
        return jsonify([])
    athletes = User.query.filter_by(coach_id=current_user.id, role='athlete').all()
    result = [{'id': a.id, 'full_name': a.full_name, 'birth_date': a.birth_date.strftime('%d.%m.%Y') if a.birth_date else ''} for a in athletes]
    return jsonify(result)


@main_bp.route('/api/pending_invitations')
@login_required
def pending_invitations():
    if current_user.role != 'coach':
        return jsonify([])
    pending = Invitation.query.filter_by(coach_id=current_user.id, status='pending').all()
    result = [{'id': inv.id, 'athlete_name': inv.athlete.full_name} for inv in pending]
    return jsonify(result)


@main_bp.route('/add_athlete', methods=['POST'])
@login_required
def add_athlete():
    if current_user.role != 'coach':
        logger.warning(f'Попытка добавления спортсмена пользователем {current_user.username} (не тренер)')
        return redirect(url_for('main.home'))
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    if User.query.filter_by(username=username).first():
        logger.info(f'Тренер {current_user.username} попытался добавить уже существующего спортсмена {username}')
        flash('Пользователь существует')
        return redirect(url_for('main.profile'))
    athlete = User(username=username, email=email, role='athlete', coach_id=current_user.id)
    athlete.set_password(password)
    db.session.add(athlete)
    db.session.commit()
    logger.info(f'Тренер {current_user.username} добавил спортсмена {username} (email: {email})')
    flash('Спортсмен добавлен')
    return redirect(url_for('main.profile'))