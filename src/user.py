import bcrypt
import base64
from kubernetes import client, config
from flask_restful import Resource
from flask import request, jsonify


# Create the Kubernetes API client
try:
    config.load_incluster_config()
except config.config_exception.ConfigException:
    try:
        print("Could not load incluster config, loading kube config instead")
        config.load_kube_config()
    except config.config_exception.ConfigException as e:
        print(f"Could not load kube config: {str(e)}")
        raise
kube_client = client.CoreV1Api()


def get_user_secret(username):
    try:
        return kube_client.read_namespaced_secret(username, "velero")
    except client.exceptions.ApiException as e:
        if e.status == 404:
            return None
        raise e


def create_user_secret(username, password):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    secret_data = {"password": base64.b64encode(
        hashed_password).decode('utf-8')}

    secret = client.V1Secret(
        api_version="v1",
        kind="Secret",
        metadata=client.V1ObjectMeta(name=username, namespace="velero"),
        type="Opaque",
        data=secret_data
    )

    kube_client.create_namespaced_secret("velero", secret)


def update_user_password(username, password):
    secret = get_user_secret(username)
    if not secret:
        return False

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    secret.data = {"password": base64.b64encode(
        hashed_password).decode('utf-8')}

    kube_client.replace_namespaced_secret(username, "velero", secret)
    return True


def delete_user_secret(username):
    try:
        kube_client.delete_namespaced_secret(username, "velero")
    except client.exceptions.ApiException as e:
        if e.status == 404:
            return False
        raise e
    return True


def list_users():
    secrets = kube_client.list_namespaced_secret("velero")
    users = [
        secret.metadata.name for secret in secrets.items if secret.type == "Opaque"]
    return users


def check_password(username, password):
    secret = get_user_secret(username)
    if not secret:
        return False

    hashed_password = base64.b64decode(secret.data["password"])
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)


def is_admin_user(username):
    return username == 'admin'


def create_admin_user_if_not_exists():
    if get_user_secret("admin") is None:
        create_user_secret("admin", "admin")


# Call this function at startup to ensure the admin user exists
create_admin_user_if_not_exists()


class UserList(Resource):
    def get(self):
        users = list_users()
        return jsonify(users)

    def post(self):
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return {"message": "Username and password are required as JSON properties in the request body"}, 400

        if get_user_secret(username) is not None:
            return {"message": f"User '{username}' already exists"}, 400

        create_user_secret(username, password)
        return {"message": f"User '{username}' created successfully"}

    def delete(self):
        username = request.args.get("username")

        if not username:
            return {"message": "Username is required as a query parameter"}, 400

        if not delete_user_secret(username):
            return {"message": f"User '{username}' not found"}, 404

        return {"message": f"User '{username}' deleted successfully"}


class ChangePassword(Resource):
    def post(self):
        data = request.get_json()
        username = data.get("username")
        old_password = data.get("oldPassword")
        new_password = data.get("newPassword")

        if not username or not old_password or not new_password:
            return {"message": "Username, oldPassword, and newPassword are required as JSON properties in the request body"}, 400

        if not check_password(username, old_password):
            return {"message": "Incorrect username or old password"}, 403

        if not update_user_password(username, new_password):
            return {"message": f"User '{username}' not found"}, 404

        return {"message": f"Password for user '{username}' updated successfully"}
