from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for, jsonify
)
from werkzeug.exceptions import abort

from flaskr.auth import login_required
from flaskr.db import get_db

bp = Blueprint('calendar', __name__)

@bp.route('/')
@login_required
def index():
    return render_template('calendar/index.html')