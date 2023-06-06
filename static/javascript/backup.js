import { createButton, displayDataInModal, hideSpinnerAndShowData } from "./utils.js";

let currentPage = 1;
const itemsPerPage = 10;

function initBackupPage() {
  listBackups();
  document.getElementById("listBackupsBtn").addEventListener("click", () => listBackups(1));
  document.getElementById("listBackupsBtn").addEventListener("click", listBackups);
  document.getElementById("deleteSelectedBtn").addEventListener("click", deleteSelectedBackups);
}

async function deleteSelectedBackups() {
  const selectedBackups = document.querySelectorAll('#backupTableBody input[type="checkbox"]:checked');

  // Add a confirmation prompt before deleting the selected backups
  if (selectedBackups.length > 0) {
    const confirmation = confirm('Are you sure you want to delete the selected backups?');
    if (!confirmation) {
      return; // Exit the function without deleting the backups if the user clicks "Cancel"
    }
  }
  let deletedBackups = [];
  let failedBackups = [];

  for (const checkbox of selectedBackups) {
    const backupName = checkbox.getAttribute('data-backup-name');
    const response = await fetch(`backups?name=${backupName}`, { method: 'DELETE' });

    if (response.ok) {
      checkbox.closest('tr').remove();
      deletedBackups.push(backupName);
    } else {
      failedBackups.push(backupName);
    }
  }

  if (deletedBackups.length > 0) {
    alert(`Deleted backups: ${deletedBackups.join(', ')}`);
  }
  if (failedBackups.length > 0) {
    alert(`Failed to delete backups: ${failedBackups.join(', ')}`);
  }
  if (deletedBackups.length === 0 && failedBackups.length === 0) {
    alert('No backups were deleted.');
  }

  // Refresh the backup list to reflect the deleted backups
  listBackups();
}


function fetchData() {
  fetch('backups')
    .then((response) => response.json())
    .then((data) => {
      const backupList = parseBackupData(data);
      displayBackupData(backupList);
    });
}

function displayBackupData(backupData) {
  const tableBody = document.getElementById("backupTableBody");
  tableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = backupData.slice(startIndex, endIndex);

  currentPageData.forEach((backup) => {
    const newRow = tableBody.insertRow();

    const selectCell = newRow.insertCell();
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.classList.add("backup-select-checkbox");
    selectCheckbox.setAttribute('data-backup-name', backup.name);
    selectCell.appendChild(selectCheckbox);

    newRow.insertCell().innerText = backup.name;
    newRow.insertCell().innerText = backup.status;
    newRow.insertCell().innerText = backup.errors;
    newRow.insertCell().innerText = backup.warnings;
    newRow.insertCell().innerText = backup.created === '<nil>' ? '<nil>' : new Date(backup.created).toLocaleString();
    newRow.insertCell().innerText = backup.expiration === 'n/a' ? 'n/a' : new Date(backup.expiration).toLocaleString();
    newRow.insertCell().innerText = backup.storageLocation;
    newRow.insertCell().innerText = backup.selector;

    const actionsCell = newRow.insertCell();

    const logsButton = createButton("Logs", () => {
      displayDataInModal(null, "backupLogsModal", async () => {
        try {
          const response = await fetch(`backups/logs?name=${backup.name}`);
          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          if (data.message) {
            alert(data.message);
          } else {
            displayDataInModal(data, "backupLogsModal");
          }
        } catch (error) {
          console.error("Error fetching backup logs:", error);
          alert(`Error fetching backup logs: ${error.message}`);
        } finally {
          hideSpinnerAndShowData("backupLogsModal");
        }
      });
      $("#backupLogsModal").modal("show");
    });
    actionsCell.appendChild(logsButton);

    const describeButton = createButton("Describe", () => {
      displayDataInModal(null, "backupDescribeModal", async () => {
        try {
          const response = await fetch(`backups/describe?name=${backup.name}`);
          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          if (data.message) {
            alert(data.message);
          } else {
            displayDataInModal(data, "backupDescribeModal");
          }
        } catch (error) {
          console.error("Error fetching backup describe:", error);
          alert(`Error fetching backup describe: ${error.message}`);
        } finally {
          hideSpinnerAndShowData("backupDescribeModal");
        }
      });
      $("#backupDescribeModal").modal("show");
    });
    actionsCell.appendChild(describeButton);

    const deleteButton = createButton("Delete", () => {
      const confirmation = confirm(`Are you sure you want to delete backup "${backup.name}"?`);
      if (confirmation) {
        deleteBackup(backup.name);
      }
    });
    actionsCell.appendChild(deleteButton);

    const restoreButton = createButton('Restore', () => {
      showRestoreModal(backup.name);
    });
    actionsCell.appendChild(restoreButton);
  });

  updatePagination(backupData.length);

  const dismissButtons = document.querySelectorAll(".modal-header button");
  for (const dismissButton of dismissButtons) {
    dismissButton.addEventListener("click", () => {
      console.log("Dismiss button clicked");
      $(dismissButton.closest(".modal")).modal("hide");
    });
  }
}

function showRestoreModal(backupName) {
  const backupNameElement = document.getElementById('restoreBackupName');
  backupNameElement.value = backupName;
  const restoreModal = new bootstrap.Modal(document.getElementById('restoreFormModal'));
  restoreModal.show();
}

document.getElementById('confirmRestore').addEventListener('click', () => {
  const backupName = document.getElementById('restoreBackupName').value;
  const optionalParameters = document.getElementById('restoreOptionalParameters').value;
  const restoreModal = bootstrap.Modal.getInstance(document.getElementById('restoreFormModal'));
  restoreModal.hide();
  restoreBackup(backupName, optionalParameters);
});

async function restoreBackup(backupName, optionalParameters) {
  const response = await fetch('restores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      backupName: backupName,
      optionalParameters: optionalParameters,
    }),
  });

  const data = await response.json();
  alert(data.message);
}

function updatePagination(totalItems) {
  const pagination = document.getElementById("backupPagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const listItem = document.createElement("li");
    listItem.classList.add("page-item");

    if (i === currentPage) {
      listItem.classList.add("active");
    }

    const pageLink = document.createElement("a");
    pageLink.classList.add("page-link");
    pageLink.textContent = i;
    pageLink.href = "#";

    pageLink.addEventListener("click", (event) => {
      event.preventDefault();
      currentPage = i;
      listBackups();
    });

    listItem.appendChild(pageLink);
    pagination.appendChild(listItem);
  }
}


function parseBackupData(data) {
  const backupList = [];

  function parseBackup(backup) {
    const {
      metadata: { name, creationTimestamp },
      status: { phase, expiration, errors = 0, warnings = 0 },
      spec: { storageLocation },
    } = backup;

    return {
      name,
      status: phase || 'New',
      errors,
      warnings,
      created: creationTimestamp || '<nil>',
      expiration: expiration || 'n/a',
      storageLocation: storageLocation || '<none>',
      selector: '<none>',
    };
  }

  if (data) {
    if (data.items) {
      backupList.push(...data.items.filter(item => item.metadata).map(parseBackup));
    } else if (data.metadata) {
      backupList.push(parseBackup(data));
    }
  }

  return backupList;
}

async function listBackups() {
  try {
    const response = await fetch(`backups`);
    const data = await response.json();
    const backupList = parseBackupData(data);

    // Sort the backupList by the 'created' field in descending order
    backupList.sort((a, b) => {
      const dateA = new Date(a.created);
      const dateB = new Date(b.created);

      if (isNaN(dateA)) {
        return 1;
      }
      if (isNaN(dateB)) {
        return -1;
      }

      return dateB - dateA;
    });

    displayBackupData(backupList);
  } catch (error) {
    console.error("Error fetching backups:", error);
  }
}


async function createBackup(backupName, optionalParameters) {
  if (!backupName) return;

  const requestOptions = {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: backupName, optionalParameters: optionalParameters }),
  };

  const response = await fetch(`backups`, requestOptions);
  const data = await response.json();
  alert(data.message);
  listBackups();
}

// Create Backup Modal
const createBackupForm = document.getElementById("createBackupForm");
const backupNameInput = createBackupForm.backupName;
const optionalParametersInput = createBackupForm.optionalParameters;
const submitCreateBackup = document.getElementById("submitCreateBackup");

backupNameInput.addEventListener("input", () => {
  submitCreateBackup.disabled = !backupNameInput.value;
});

submitCreateBackup.addEventListener("click", () => {
  createBackup(createBackupForm.backupName.value, optionalParametersInput.value);
  createBackupForm.reset();
  $("#createBackupModal").modal("hide");
  submitCreateBackup.disabled = true;
});

async function deleteBackup(backupName) {
  console.log(`Deleting backup ${backupName}`); // Add this line

  if (!backupName) return;

  const response = await fetch(`backups?name=${backupName}`, {
    method: "DELETE",
  });
  const data = await response.json();
  alert(data.message);
  listBackups();
}

window.listBackups = fetchData;
window.parseBackupData = window.parseBackupData || parseBackupData;
fetchData(1);
initBackupPage();
