from wtforms import StringField, SubmitField, EmailField, PasswordField, BooleanField
from flask_wtf import FlaskForm
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
#from model import user




class RegistrationForm(FlaskForm):
    username = StringField("Username", validators=[DataRequired(message="cannot be empty"), Length(min=2, max=50, message="Enter atleast 2-50 characters")], render_kw={"placeholder":"John Doe", "class":"form-control"})
    email = EmailField("Email", validators=[DataRequired(message="cannot be empty"), Email(message="not a valid email")], render_kw={"placeholder":"JohnDoe@example.com","class":"form-control"})
    password = PasswordField("Password", validators=[DataRequired(message="cannot be empty"), Length(min=8, message="atleast 8 characters")], render_kw={"class":"form-control"})
    confirm_password = PasswordField("Confirm Password", validators=[DataRequired(message="cannot be empty"), EqualTo("password", message="incorrect")], render_kw={"class":"form-control"})
    submit = SubmitField("Sign in", render_kw={"class":"form-control"})


class LoginForm(FlaskForm):
    email = EmailField("Email", validators=[DataRequired(), Email()], render_kw={"class":"form-control"})
    password = PasswordField("Password", validators=[DataRequired()], render_kw={"class":"form-control"})
    remember = BooleanField("Remember Me", render_kw={"class":"form-check-input"})
    submit = SubmitField("Log in", render_kw={"class":"form-control"})

class RequestResetForm(FlaskForm):
    email = EmailField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Request Password Reset')

    # def validate_email(self, email):
    #     User = user.query.filter_by(email=email.data).first()
    #     if User is None:
    #         raise ValidationError("There is no account with that email address")
        

class ResetPasswordForm(FlaskForm):
    password = PasswordField('New Password', validators=[DataRequired()])
    confirm_password = PasswordField("Confirm New Password ", validators=[
        DataRequired(), EqualTo('password')
    ])
    submit = SubmitField('Reset Password')

class CreateProject(FlaskForm):
    title = StringField("Project Title", validators=[DataRequired()], render_kw={"class":"form-control"})
    create = SubmitField("Create")