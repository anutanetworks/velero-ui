import json
import subprocess
import shlex
from flask import request, jsonify
from flask_restful import Resource
from utils import is_valid_name, run_subprocess


class BackupList(Resource):
    def get(self):
        output = subprocess.check_output(
            ["velero", "backup", "get", "-o", "json"]).decode("utf-8")
        backups = json.loads(output)
        return jsonify(backups)

    def post(self):
        data = request.get_json()
        print(f"Received data: {data}")
        backup_name = data.get("name")
        if not backup_name or not is_valid_name(backup_name):
            return jsonify({"error": "Invalid backup name.",
                            "message": "A valid backup name must consist of lowercase alphanumeric characters, "
                                       "'-' or '.', and must start and end with an alphanumeric character."})

        # Get the optional parameters from the JSON payload
        optional_parameters = data.get("optionalParameters")
        cmd = ["velero", "backup", "create", backup_name]
        if optional_parameters:
            # sanitize the input
            cmd.extend(shlex.split(optional_parameters or ''))

        print(f"Creating a backup with cmd = {cmd}")
        try:
            subprocess.run(cmd, stderr=subprocess.PIPE, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error creating backup: {e}")  # Debug statement
            error_message = e.stderr.decode("utf-8").strip()
            return {"message": f"Failed to create backup {backup_name} error = {error_message}"}, 500
        return {"message": f"Backup {backup_name} created successfully"}

    def delete(self):
        backup_name = request.args.get("name")
        if not backup_name:
            return {"message": "Backup name is required as a query parameter"}

        subprocess.check_call(
            ["velero", "backup", "delete", backup_name, "--confirm"])
        return {"message": f"Backup {backup_name} deleted successfully"}


class BackupLogs(Resource):
    def get(self):
        backup_name = request.args.get("name")
        if not backup_name:
            return {"message": "Backup name is required as a query parameter"}

        output, error = run_subprocess(
            ["velero", "backup", "logs", backup_name])
        if error:
            return {"message": error}, 200

        return {"logs": output}


class DescribeBackup(Resource):
    def get(self):
        backup_name = request.args.get("name")
        if not backup_name:
            return {"message": "Backup name is required as a query parameter"}

        output, error = run_subprocess(
            ["velero", "backup", "describe", backup_name, "--colorized=false"])
        if error:
            return {"message": error}, 200

        return {"logs": output}
