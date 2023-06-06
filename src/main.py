import os
import sys
import getopt

# Get the absolute path of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Add the directory containing the script to the system path
sys.path.insert(0, script_dir)

from flask import Flask, request, session, redirect, url_for, render_template, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_restful import Api
from flask_cors import CORS
from user import UserList, ChangePassword, check_password
from backup import BackupList, BackupLogs, DescribeBackup
from restore import RestoreList, RestoreLogs, DescribeRestore
from schedule import ScheduleList, DescribeSchedule

api_version = "v0.0.1"

app = Flask(__name__, static_folder="../static")
app.wsgi_app = ProxyFix(app.wsgi_app, x_prefix=1)

app.template_folder = "../templates"
app.secret_key = "secret_key"  # Set a secret key for session management
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

CORS(app)
api = Api(app)

use_auth = not (os.getenv("DISABLE_AUTH", "").lower() == "true")

# Parse command line options
try:
    opts, args = getopt.getopt(sys.argv[1:], "h", ["disable-auth", "help"])
except getopt.GetoptError as e:
    print(f'Invalid command line arguments {sys.argv[1:]}: {e}')
    print('Usage: main.py [--disable-auth] [--help]')
    sys.exit(2)
for opt, arg in opts:
    if opt == '--disable-auth':
        use_auth = False
    elif opt == '--help':
        print('Usage: main.py [--disable-auth] [--help]')
        sys.exit()

print(f"Authentication is {'enabled' if use_auth else 'disabled'}")

# authentication check before processing requests
@app.before_request
def check_authentication():
    # serve static files without authentication
    if request.path.startswith("/static/"):
        return

    if request.path == "/login":  # Allow login page without authentication
        return

    if use_auth and "username" not in session:  # Redirect to login page if user is not authenticated
        return redirect(url_for("login"))


@app.route("/")
def serve_index():
    return render_template("index.html", use_auth=use_auth)


@app.route("/navbar")
def serve_navbar():
    return render_template("navbar.html", use_auth=use_auth, app_version=api_version)


@app.route("/backup")
def serve_backup():
    return render_template("backup.html", use_auth=use_auth)


@app.route("/restore")
def serve_restore():
    return render_template("restore.html", use_auth=use_auth)


@app.route("/schedule")
def serve_schedule():
    return render_template("schedule.html", use_auth=use_auth)


@app.route("/settings")
def serve_settings():
    return render_template("settings.html", use_auth=use_auth)


@app.route("/change-password")
def serve_change_password():
    return render_template("change-password.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        if check_password(username, password):
            # Store the authenticated user's username in the session
            session["username"] = username
            return {"success": True}, 200
        else:
            return {"success": False, "message": "Invalid username or password"}, 401
    else:
        return render_template("login.html")


@app.route("/logout", methods=["GET", "POST"])
def logout():
    # Remove the authenticated user's username from the session
    session.pop("username", None)
    return redirect(url_for("login"))


@app.route("/static/<path:path>")
def serve_static(path):
    if path.endswith(".js"):
        mimetype = "application/javascript"
    elif path.endswith(".css"):
        mimetype = "text/css"
    else:
        mimetype = None
    return send_from_directory(app.static_folder, path, mimetype=mimetype)


@app.route("/templates/<path:template_name>")
def serve_templates(template_name):
    return render_template(template_name)


api.add_resource(UserList, "/users")
api.add_resource(ChangePassword, "/change-password")
api.add_resource(BackupLogs, "/backups/logs")
api.add_resource(DescribeBackup, "/backups/describe")
api.add_resource(BackupList, "/backups")
api.add_resource(RestoreLogs, "/restores/logs")
api.add_resource(DescribeRestore, "/restores/describe")
api.add_resource(RestoreList, "/restores")
api.add_resource(DescribeSchedule, "/schedules/describe")
api.add_resource(ScheduleList, "/schedules")

if __name__ == "__main__":
    app.run(debug=True)
