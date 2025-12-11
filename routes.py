from flask import Flask, Blueprint, url_for, redirect, render_template, flash, session, request, jsonify, current_app as app
from model import *
from flask_login import login_required, login_user, logout_user, current_user
from form import *
from mail import *
import secrets
from datetime import datetime, timezone

main = Blueprint("main", __name__)
app.logger.setLevel("DEBUG")



@main.route("/", methods=["GET", "POST"])
def index():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    app.logger.info("landing page accessed")
    return render_template("index.html")


@main.route("/register", methods=["GET", "POST"])
def sign_up():
    if current_user.is_authenticated:
        return "<h1>You are logged i already</h1>"
    form = RegistrationForm()
    if form.validate_on_submit():
        existing_user = Users.query.filter_by(username=form.username.data, email=form.email.data).first()

        if existing_user:
            return render_template(
                "messageBox.html", 
                title="Error", 
                message="Username and email already exist, Please kindly choose a new one",
                back_url = url_for("sign_up"),
                back_text = "Sign up page <-"
            )
        else:
            new_User = Users(username=form.username.data, email=form.email.data)

            new_User.set_password(form.password.data)
            verification_token = GVT()

            new_User.verification_token = verification_token
            send_verification_email(form.email.data, verification_token)

            db.session.add(new_User)
            db.session.commit()
            return render_template(
                "messageBox.html",
                title="Success", 
                message="Registration Successful! Please Check email for verification",
                back_url = url_for("main.login"),
                back_text = "Login Page ->"
            )
    return render_template("signup.html", form=form)


@main.route("/verify-link/<token>")
def verify(token):
    user = Users.query.filter_by(verification_token=token).first()
    if user:
        user.email_verified = "True"
        user.verification_token = None
        db.session.commit()
        return redirect(url_for("main.login"))
    return render_template(
                "messageBox.html",
                title="Error", 
                message="Invalid Verification Token, \n Sign Again to recieve new verification link",
                back_url = url_for("main.sign_up"),
                back_text = "Sign Up ->"
            )


@main.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    loginForm = LoginForm()
    if loginForm.validate_on_submit():
        user = Users.query.filter_by(email=loginForm.email.data).first()
        if user and user.is_locked():
            flash(f"Account Locked until {user.acctlock_timestamp.strftime('%H:%M:%S UTC')}. Please wait.", "danger")
            return redirect(url_for("main.login"))
        
        if user and user.check_password(loginForm.password.data):
            user.failed_login_attempts = 0
            user.acctlock_timestamp = None
            db.session.commit()

            login_user(user)
            flash("Login successful!", "success")
            return redirect(url_for("main.dashboard"))
        else:
            if user:
                user.failed_login_attempts += 1
                db.session.commit()

                MAX_ATTEMPTS = 5 
                if user.failed_login_attempts >= MAX_ATTEMPTS:
                    user.lock_account()
                    flash("Maximum login attempts reached. Account is locked for 30 mins")
                    return redirect(url_for("main.login"))
            flash("Login Unsuccessful, Invalid Credentials")
    return render_template("login.html", form=loginForm)

@main.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("main.login"))


@main.route("/reset-password", methods=["GET", "POST"])
def reset_request():
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    
    form = RequestResetForm()
    if form.validate_on_submit():
        change_user = Users.query.filter_by(email=form.email.data).first()

        if change_user:
            send_reset_mail(change_user)

            app.logger.info(f"INFO: password reset link has been sent to \n Email Address: {form.email.data}")
        else:
            flash("Email not found!!!")
            return redirect(url_for("main.reset_request"))
    return render_template("reset_password.html", form=form)



@main.route("/reset_password/api/<token>", methods=["GET", "POST"])
def reset_token(token):
    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))
    verify = Users.verify_reset_token(token)
    if verify is None:
       flash("That is an invalid or expired token.")
       return redirect(url_for("main.reset_request"))
    
    form = ResetPasswordForm()
    if form.validate_on_submit():
        verify.set_password(form.confirm_password.data)

        db.session.commit()
        flash("Your password has been successfuly update")
        return redirect(url_for("main.login"))
    return render_template("reset_token.html", title="Reset Password", form=form, token=token)


@main.route("/")
@main.route("/dashboard", methods=["GET"])
@login_required
def dashboard():
    form = CreateProject()
    user_projects = current_user.projects.all()
    return render_template("dashboard.html", title="Dashboard", projects=user_projects, form=form)


# @main.route("/project/new", methods=["POST"])
# @login_required
# def create_project():
#     # # Expecting JSON data from the Fetch request in Script.js
#     # data = request.get_json()
#     # project_title = data.get('title')

#     # if not project_title:
#     #     return jsonify({"msg": "Project title is required"}), 400

#     # try:
#     #     new_project = project(
#     #         title=project_title,
#     #         user_id=current_user.id,
#     #         created_at=datetime.now(timezone.utc)
#     #     )
#     #     db.session.add(new_project)
#     #     db.session.commit()

#     #     # Return the new project data, including the new ID, so JS can update the list
#     #     return jsonify({
#     #         "id": new_project.id,
#     #         "title": new_project.title
#     #     }), 201

#     # except Exception as e:
#     #     app.logger.error(f"ERROR: Failed to create project for user {current_user.id}: {e}")
#     #     return jsonify({"msg": "Server error while creating project"}), 500

#     current_project = CreateProject()

#     if current_project.validate_on_submit():
#         redirect(url_for("main.dashboard)"))
#     return render_template("dashboard.html", project=current_project)


@main.route('/project/new', methods=['POST'])
@login_required
def createproject():
    form = CreateProject()
    if form.validate_on_submit():
        # Create new project object
        new_project = project(title=form.title.data, user_id=current_user.id)
        db.session.add(new_project)
        db.session.commit()

        # Return project ID in JSON response
        return jsonify({'status': 'success', 'project_id': new_project.id, 'title': new_project.title})
    
    # On validation failure or error
    return jsonify({'status': 'error', 'message': 'Error creating project'}), 400