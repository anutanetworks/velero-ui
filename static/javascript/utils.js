export function createButton(text, onClick) {
  const button = document.createElement("button");
  button.innerText = text;
  button.addEventListener("click", onClick);
  return button;
}

export function displayDataInModal(data, modalId, callback) {
  const modal = document.getElementById(modalId);
  const modalBody = modal.querySelector(".modal-body");
  const preElement = modalBody.querySelector("pre");
  const spinner = modalBody.querySelector(".spinner-border");

  if (data && data.logs && data.logs.length > 0) {
    preElement.textContent = data.logs;
  } else {
    preElement.textContent = "No description found.";
  }

  spinner.classList.remove("d-none");
  preElement.classList.add("d-none");

  if (callback) {
    callback();
  }
}

export function hideSpinnerAndShowData(modalId) {
  const modal = document.getElementById(modalId);
  const modalBody = modal.querySelector(".modal-body");
  const preElement = modalBody.querySelector("pre");
  const spinner = modalBody.querySelector(".spinner-border");

  spinner.classList.add("d-none");
  preElement.classList.remove("d-none");
}

export function saveAuthToken(token) {
  sessionStorage.setItem("authToken", token);
}
