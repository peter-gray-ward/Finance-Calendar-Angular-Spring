from flask import Flask
import uuid

def create_app():
	app = Flask(__name__, instance_relative_config=True)

	with app.app_context():
		app.config['SECRET_KEY'] = str(uuid.uuid4())

	from . import auth
	app.register_blueprint(auth.api)

	from . import calendar
	app.register_blueprint(calendar.api)

	app.add_url_rule('/', endpoint='index')

	return app

