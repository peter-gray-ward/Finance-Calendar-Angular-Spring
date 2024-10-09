from flask import Flask

def create_app():
	app = Flask(__name__, instance_relative_config=True)

	with app.app_context():
		app.config['SECRET_KEY'] = 'cc066aad-f8b2-4e93-9e36-4ed4364d6332'

	from . import auth
	app.register_blueprint(auth.bp)

	from . import calendar
	app.register_blueprint(calendar.bp)

	app.add_url_rule('/', endpoint='index')

	return app

if __name__ == '__main__':
    app.run(debug=True)
