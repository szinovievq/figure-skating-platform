from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User
from datetime import datetime
import re
from logger import logger

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')

    data = request.get_json()
    if not data:
        logger.warning('Попытка регистрации с некорректными данными (не JSON)')
        return jsonify({'error': 'Invalid request'}), 400

    username = data.get('username', '').strip()
    full_name = data.get('full_name', '').strip()
    birth_date_str = data.get('birth_date', '')
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    role = data.get('role', 'athlete')

    errors = {}

    if not username:
        errors['username'] = 'Логин обязателен'
    elif len(username) < 3:
        errors['username'] = 'Логин должен содержать минимум 3 символа'
    elif User.query.filter_by(username=username).first():
        errors['username'] = 'Пользователь с таким логином уже существует'

    if not full_name:
        errors['full_name'] = 'ФИО обязательно'
    elif len(full_name.split()) < 2:
        errors['full_name'] = 'Введите полное имя (минимум два слова)'

    if not birth_date_str:
        errors['birth_date'] = 'Дата рождения обязательна'
    else:
        try:
            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
            if birth_date > datetime.now().date():
                errors['birth_date'] = 'Дата рождения не может быть в будущем'
        except ValueError:
            errors['birth_date'] = 'Неверный формат даты'

    if not password:
        errors['password'] = 'Пароль обязателен'
    elif len(password) < 6:
        errors['password'] = 'Пароль должен содержать минимум 6 символов'
    elif password != confirm_password:
        errors['confirm_password'] = 'Пароли не совпадают'

    if errors:
        logger.info(f'Неудачная регистрация для пользователя {username or "не указан"}: {errors}')
        return jsonify({'errors': errors}), 400

    user = User(
        username=username,
        full_name=full_name,
        birth_date=datetime.strptime(birth_date_str, '%Y-%m-%d').date(),
        role=role,
        email=f"{username}@temp.com"
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    login_user(user)
    logger.info(f'Успешная регистрация и автоматический вход пользователя {username} (роль: {role})')
    return jsonify({'message': 'Registered and logged in successfully', 'redirect': url_for('main.profile')}), 201


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    data = request.get_json()
    if not data:
        logger.warning('Попытка входа с некорректными данными')
        return jsonify({'error': 'Invalid request'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        logger.warning(f'Попытка входа с пустыми полями (username: {username or "не указан"})')
        return jsonify({'error': 'Логин и пароль обязательны'}), 400

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user)
        logger.info(f'Успешный вход пользователя {username} (роль: {user.role})')
        return jsonify({'message': 'Logged in successfully', 'redirect': url_for('main.home')}), 200
    else:
        logger.warning(f'Неудачная попытка входа для пользователя {username} (неверный логин или пароль)')
        return jsonify({'error': 'Неверный логин или пароль'}), 401


@auth_bp.route('/logout')
@login_required
def logout():
    username = current_user.username
    logout_user()
    logger.info(f'Пользователь {username} вышел из системы')
    return redirect(url_for('main.home'))