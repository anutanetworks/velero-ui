# velero-ui

Velero-UI is a web-based graphical user interface for Velero, an open source tool to back up and restore Kubernetes resources.

## Getting started

To use Velero-UI, you will need the following:

* A Kubernetes cluster with Velero installed. To install Velero, follow the [official Velero installation instructions](https://velero.io/docs/main/basic-install/).

## To run the Velero-UI web server locally:
Pre-requisites:
1. Python 3.6 or higher
2. pip3
3. install velero client. Follow the instructions [here](https://velero.io/docs/v1.11/basic-install/#install-the-cli)
4. Install velero on a kubernetes cluster
5. Access to Kubernetes cluster. You will need to setup ~/.kube/config 

Run the server as following
```commandline
python3 src/main.py
```

Default credentials are:
```admin:admin```
These credentials are stored as kubernetes secret in the target cluster. You can change the credentials from the settings page.

## Building docker image

```
docker build -t velero-ui:v0.1 .
```

To start the Velero-UI web server, run the following command:

```
$ docker run -p 5000:5000 --network=host -v ~/.kube/config:/root/.kube/config velero-ui:v0.1
```

## Features
Velero-UI provides the following features:

* Backup and restore Kubernetes resources
* View backup logs and status
* View restore logs and status
* Schedule backups

## Contributing
Contributions to Velero-UI are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## License
Velero-UI is licensed under the MIT License. See [LICENSE](LICENSE) for the full license text.
