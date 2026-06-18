import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change'

    DB_USER = 'postgres'
    DB_PASSWORD = '12345'
    DB_HOST = 'localhost'
    DB_PORT = '5432'
    DB_NAME = 'fs-platform'

    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False