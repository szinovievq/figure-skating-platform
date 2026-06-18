from flask import Flask
from flask_login import LoginManager
from config import Config
from models import db, User
from seed import seed_elements

login_manager = LoginManager()
login_manager.login_view = 'auth.login'

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from main import main_bp
    app.register_blueprint(main_bp)

    from calculator import calculator_bp
    app.register_blueprint(calculator_bp, url_prefix='/calculator')

    from statistics import statistics_bp
    app.register_blueprint(statistics_bp, url_prefix='/stats')

    with app.app_context():
        db.create_all()
        seed_elements()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5050)