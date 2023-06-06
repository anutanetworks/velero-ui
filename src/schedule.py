import json
import subprocess
import shlex
from flask import request, jsonify
from flask_restful import Resource

from utils import run_subprocess


class ScheduleList(Resource):
    def get(self):
        output = subprocess.check_output(
            ["velero", "schedule", "get", "-o", "json"]).decode("utf-8")
        schedules = json.loads(output)
        return jsonify(schedules)

    def post(self):
        data = request.get_json()
        print(f"Received data: {data}")  # Debug statement

        schedule_name = data.get("name")
        schedule = data.get("schedule")
        # Get the optional parameters from the JSON payload
        optional_parameters = data.get("optionalParameters")

        if not schedule_name or not schedule:
            return {"message": "Schedule name and schedule are required as JSON properties in the request body"}

        cmd = ["velero", "schedule", "create",
               schedule_name, "--schedule", schedule]
        if optional_parameters:
            # Split optional parameters by spaces
            cmd.extend(shlex.split(optional_parameters or ''))
        try:
            subprocess.run(cmd, stderr=subprocess.PIPE, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error creating schedule: {e}")  # Debug statement
            error_message = e.stderr.decode("utf-8").strip()
            return {"message": f"Failed to create schedule {schedule_name} error = {error_message}"}, 500

        return {"message": f"Schedule {schedule_name} created successfully"}

    def delete(self):
        schedule_name = request.args.get("name")
        if not schedule_name:
            return {"message": "Schedule name is required as a query parameter"}

        subprocess.check_call(
            ["velero", "schedule", "delete", schedule_name, "--confirm"])
        return {"message": f"Schedule {schedule_name} deleted successfully"}


class DescribeSchedule(Resource):
    def get(self):
        schedule_name = request.args.get("name")
        if not schedule_name:
            return {"message": "Schedule name is required as a query parameter"}

        output, error = run_subprocess(
            ["velero", "schedule", "describe", schedule_name, "--colorized=false"])
        if error:
            return {"message": error}, 200

        return {"logs": output}
