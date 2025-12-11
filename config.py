from flask import Flask
import os
import secrets


key = secrets.token_urlsafe(17)
class Config:
    SECRET_KEY = key
    SQLALCHEMY_DATABASE_URI= os.environ.get("stacksyncUri")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    EXPRESS_API_URL = 'http://127.0.0.1:8001/api'