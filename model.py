from flask import  current_app
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from config import *
import itsdangerous


# app = Flask(__name__)

# app.config["SQLALCHEMY_DATABASE_URI"] = Config.DB_URI
# app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = Config.SQL_TRACK_MODIFICATIONS

db = SQLAlchemy()



class Users(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key = True, unique = True)
    username = db.Column(db.String(150), unique=True, nullable = False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(400), nullable=False)
    verification_token = db.Column(db.String(120), nullable=True)
    email_verified = db.Column(db.String(5), default="False")
    failed_login_attempts = db.Column(db.Integer, default=0)
    acctlock_timestamp = db.Column(db.DateTime, nullable=True)
    
    projects = db.relationship("project", backref="users", lazy="dynamic")

    def set_password(self, user_password):
        self.password_hash = generate_password_hash(user_password)
    def check_password(self, user_password):
        return check_password_hash(self.password_hash, user_password)
    
    def get_reset_token(self, expires_sec=1800):
        s = itsdangerous.URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        return s.dumps({'user_id': self.id})

    @staticmethod
    def verify_reset_token(token, expires_sec=1800):
        s = itsdangerous.URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        try:
            user_id = s.loads(token, max_age=expires_sec)['user_id']
        except Exception:
            return None
        return Users.query.get(user_id)
    

    """ -------  NEW LOCKOUT HELPER METHODS -------""" 
    def is_locked(self):
        return self.acctlock_timestamp and self.acctlock_timestamp > datetime.utcnow()

    def lock_account(self):
        lockout_duration = timedelta(minutes=30)
        self.acctlock_timestamp = datetime.utcnow() + lockout_duration
        self.failed_login_attempts = 0
        db.session.commit()

        
    def __repr__(self):
        return f"User {self.username}"
    

class project(db.Model):
    user_id = db.Column(db.ForeignKey("users.id"), nullable=False )
    id = db.Column(db.Integer, primary_key = True)
    title = db.Column(db.String(140), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=func.now())

    def __repr__(self):
        return f"<Project {self.title}>"
    

