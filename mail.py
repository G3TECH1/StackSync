from flask import Flask, url_for, current_app
from flask_mail import Mail, Message
import secrets
import itsdangerous
import uuid
from model import Users, db

app = Flask(__name__)

key = secrets.token_urlsafe(18)
app.secret_key = key
app.config["MAIL_SERVER"] = "localhost"
app.config["MAIL_PORT"] = 200
app.config["MAIL_USE_TLS"] = False
app.config["MAIL_USE_SSL"] = False
app.config["MAIL_SUPPRESS_SEND"] = True
app.testing = True

mail = Mail(app)

def GVT():
    return secrets.token_urlsafe(30)

def create_verification_link(token):
    return f"http://localhost:8000/verify-link/{token}"

def send_verification_email(user_email, token):
    msg = Message("Verify Your Email Address", sender="email@mail.myfolio.it.com", recipients=[user_email])
    msg.body = f"Please click on the following link to verify your email address: {create_verification_link(token)}"
    
    print("Email Contents:")
    print("Subject: "+ msg.subject + " " + msg.sender)
    print("Body: ", msg.body)
    print("Recipients: ", msg.recipients)

    
    mail.send(msg)

def send_reset_mail(user):
    token = user.get_reset_token()

    reset_url = url_for('main.reset_token', token=token, _external=True)

    print(f"\n ---- PASSWORD RESET EMAIL SIMULATION ----")
    print(f"TO: {user.email}")
    print(f"SUBJECT: Password reset request for stacksync")
    print(f"Body: Click the link to reset your password (valid for30 minutes)")
    print(f"{reset_url}")
    print(f"---------------------------\n")


    