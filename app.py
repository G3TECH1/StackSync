from flask  import Flask, flash
from config import Config
from flask_wtf.csrf import CSRFProtect
from flask_login import LoginManager
from model import db, Users
from routes import main

login_manager = LoginManager()
login_manager.login_view = "main.login"

csrf = CSRFProtect()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    csrf.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(Users, int(user_id))
    
    with app.app_context():
        db.create_all()

    app.register_blueprint(main)
    return app




if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=8000)