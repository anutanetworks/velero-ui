import re
import subprocess


def is_valid_name(name):
    regex = r"[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*"
    return re.fullmatch(regex, name) is not None

# Helper function to run subprocess commands
def run_subprocess(cmd):
    try:
        output = subprocess.check_output(
            cmd, stderr=subprocess.PIPE).decode("utf-8")
        return output, None
    except subprocess.CalledProcessError as e:
        error_message = e.stderr.decode("utf-8").strip()
        return None, error_message
