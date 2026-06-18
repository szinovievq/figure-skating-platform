from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    coach_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    full_name = db.Column(db.String(200), nullable=False, default='')
    birth_date = db.Column(db.Date, nullable=True)

    coach = db.relationship('User', remote_side=[id], backref='athletes', foreign_keys=[coach_id])
    sent_invitations = db.relationship('Invitation', foreign_keys='Invitation.coach_id', backref='coach', lazy='dynamic')
    received_invitations = db.relationship('Invitation', foreign_keys='Invitation.athlete_id', backref='athlete', lazy='dynamic')
    programs = db.relationship('Program', foreign_keys='Program.athlete_id', back_populates='athlete', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Invitation(db.Model):
    __tablename__ = 'invitations'
    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    athlete_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('coach_id', 'athlete_id', name='unique_invitation'),)


class Element(db.Model):
    __tablename__ = 'elements'
    id = db.Column(db.Integer, primary_key=True)
    element_code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=False)
    base_value = db.Column(db.Float, nullable=False)
    discipline = db.Column(db.String(20), nullable=False)


class Program(db.Model):
    __tablename__ = 'programs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    athlete_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    program_type = db.Column(db.String(20), nullable=False, default='free')
    discipline = db.Column(db.String(20), nullable=False, default='singles')
    program_date = db.Column(db.Date, nullable=False, default=date.today)
    total_score = db.Column(db.Float, default=0.0)
    components_score = db.Column(db.Float, default=0.0)
    deductions = db.Column(db.Float, default=0.0)
    comp_sk = db.Column(db.Float, default=0.0)
    comp_tr = db.Column(db.Float, default=0.0)
    comp_pe = db.Column(db.Float, default=0.0)
    comp_co = db.Column(db.Float, default=0.0)
    comp_in = db.Column(db.Float, default=0.0)
    component_coeff = db.Column(db.Float, default=1.0)

    athlete = db.relationship('User', foreign_keys=[athlete_id], back_populates='programs')
    creator = db.relationship('User', foreign_keys=[created_by])
    elements = db.relationship('ProgramElement', backref='program', cascade='all, delete-orphan')


class ProgramElement(db.Model):
    __tablename__ = 'program_elements'
    id = db.Column(db.Integer, primary_key=True)
    program_id = db.Column(db.Integer, db.ForeignKey('programs.id'), nullable=False)
    element_code = db.Column(db.String(20), nullable=False)
    base_value_snapshot = db.Column(db.Float, nullable=False)
    base_multiplier = db.Column(db.Float, default=1.0)
    goe = db.Column(db.Integer, default=0)
    second_half = db.Column(db.Boolean, default=False)
    fall = db.Column(db.Boolean, default=False)
    underrotation = db.Column(db.String(2), default='')
    edge = db.Column(db.String(1), default='')
    q = db.Column(db.Boolean, default=False)
    invalid = db.Column(db.Boolean, default=False)
    total_points = db.Column(db.Float, nullable=False)