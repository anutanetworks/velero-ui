import json
import subprocess
import shlex
from flask import request, jsonify
from flask_restful import Resource

from utils import is_valid_name, run_subprocess


class RestoreList(Resource):
    def get(self):
        output = subprocess.check_output(
            ["velero", "restore", "get", "-o", "json"]).decode("utf-8")
        restores = json.loads(output)
        return jsonify(restores)

    def post(self):
        data = request.get_json()
        print(f"Received data: {data}")

        backup_name = data.get("backupName")
        schedule_name = data.get("scheduleName")

        if backup_name and schedule_name:
            return jsonify({"error": "Invalid request. You can only provide either backupName or scheduleName."})

        if backup_name:
            resource_type = "backup"
            resource_name = backup_name
        elif schedule_name:
            resource_type = "schedule"
            resource_name = schedule_name
        else:
            return jsonify({"error": "Invalid request. Please provide either backupName or scheduleName."})

        if not is_valid_name(resource_name):
            return jsonify({"error": "Invalid resource name.",
                            "message": "A valid resource name must consist of lowercase alphanumeric characters, "
                                       "'-' or '.', and must start and end with an alphanumeric character."})

        # Get the optional parameters from the JSON payload
        optional_parameters = data.get("optionalParameters")
        cmd = ["velero", "restore", "create"]
        if resource_type == "backup":
            cmd.extend(["--from-backup", resource_name])
        elif resource_type == "schedule":
            cmd.extend(["--from-schedule", resource_name])

        if optional_parameters:
            # Split optional parameters by spaces
            cmd.extern(shlex.split(optional_parameters or ''))

        print(f"Creating a restore with cmd = {cmd}")
        try:
            subprocess.run(cmd, stderr=subprocess.PIPE, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error creating restore: {e}")  # Debug statement
            error_message = e.stderr.decode("utf-8").strip()
            return {
                "message": f"Failed to create restore from {resource_type} {resource_name} error = {error_message}"}, 500
        return {"message": f"Restore from {resource_type} {resource_name} created successfully"}

    def delete(self):
        restore_name = request.args.get("name")
        if not restore_name:
            return {"message": "Restore name is required as a query parameter"}

        subprocess.check_call(
            ["velero", "restore", "delete", restore_name, "--confirm"])
        return {"message": f"Restore {restore_name} deleted successfully"}


class RestoreLogs(Resource):
    def get(self):
        restore_name = request.args.get("name")
        if not restore_name:
            return {"message": "restore name is required as a query parameter"}

        output, error = run_subprocess(
            ["velero", "restore", "logs", restore_name])
        if error:
            return {"message": error}, 200

        return {"logs": output}


class DescribeRestore(Resource):
    def get(self):
        restore_name = request.args.get("name")
        if not restore_name:
            return {"message": "Restore name is required as a query parameter"}

        output, error = run_subprocess(
            ["velero", "restore", "describe", restore_name, "--colorized=false"])
        if error:
            return {"message": error}, 200

        return {"logs": output}
