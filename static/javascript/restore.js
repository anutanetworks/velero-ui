import { createButton, displayDataInModal, hideSpinnerAndShowData } from "./utils.js";

let currentPage = 1;
const itemsPerPage = 10;

function initRestorePage() {
  listRestores();
  document.getElementById("listRestoresBtn").addEventListener("click", () => listRestores(1));
  document.getElementById("listRestoresBtn").addEventListener("click", listRestores);
  document.getElementById("deleteSelectedRestoreBtn").addEventListener("click", deleteSelectedRestores);
}

async function deleteSelectedRestores() {
  const selectedRestores = document.querySelectorAll('#restoreTableBody input[type="checkbox"]:checked');

  // Add a confirmation prompt before deleting the selected restores
  if (selectedRestores.length > 0) {
    const confirmation = confirm('Are you sure you want to delete the selected restores?');
    if (!confirmation) {
      return; // Exit the function without deleting the restores if the user clicks "Cancel"
    }
  }
  let deletedRestores = [];
  let failedRestores = [];

  for (const checkbox of selectedRestores) {
    const restoreName = checkbox.getAttribute('data-restore-name');
    const response = await fetch(`restores?name=${restoreName}`, { method: 'DELETE' });

    if (response.ok) {
      checkbox.closest('tr').remove();
      deletedRestores.push(restoreName);
    } else {
      failedRestores.push(restoreName);
    }
  }

  if (deletedRestores.length > 0) {
    alert(`Deleted restores: ${deletedRestores.join(', ')}`);
  }
  if (failedRestores.length > 0) {
    alert(`Failed to delete restores: ${failedRestores.join(', ')}`);
  }
  if (deletedRestores.length === 0 && failedRestores.length === 0) {
    alert('No restores were deleted.');
  }

  // Refresh the restore list to reflect the deleted restores
  listRestores();
}

function fetchData() {
  fetch('restores')
    .then((response) => response.json())
    .then((data) => {
      const restoreList = parseRestoreData(data);
      displayRestoreData(restoreList);
    });
}

function displayRestoreData(restoreData) {
  const tableBody = document.getElementById("restoreTableBody");
  tableBody.innerHTML = "";

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = restoreData.slice(startIndex, endIndex);

  currentPageData.forEach((restore) => {
    const newRow = tableBody.insertRow();

    const selectCell = newRow.insertCell();
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.classList.add("restore-select-checkbox");
    selectCheckbox.setAttribute('data-restore-name', restore.name);
    selectCell.appendChild(selectCheckbox);

    newRow.insertCell().innerText = restore.name;
    newRow.insertCell().innerText = restore.backup;
    newRow.insertCell().innerText = restore.status;
    newRow.insertCell().innerText = restore.started;
    newRow.insertCell().innerText = restore.completed;
    newRow.insertCell().innerText = restore.errors;
    newRow.insertCell().innerText = restore.warnings;
    newRow.insertCell().innerText = restore.created === '<nil>' ? '<nil>' : new Date(restore.created).toLocaleString();
    newRow.insertCell().innerText = restore.selector;

    const actionsCell = newRow.insertCell();
    const logsButton = createButton("Logs", () => {
      displayDataInModal(null, "restoreLogsModal", async () => {
        try {
          const response = await fetch(`restores/logs?name=${restore.name}`);
          if (!response.ok) {
            throw new Error('${response.status} ${response.statusText}');
          }
          const data = await response.json();
          if (data.message) {
            alert(data.message);
          } else {
            displayDataInModal(data, "restoreLogsModal");
          }
        } catch (error) {
          console.error("Error fetching restore logs:", error);
          alert('Error fetching restore logs: ${error.message}');
        } finally {
          hideSpinnerAndShowData("restoreLogsModal");
        }
      });
      $("#restoreLogsModal").modal("show");
    });
    actionsCell.appendChild(logsButton);

    const describeButton = createButton("Describe", () => {
      displayDataInModal(null, "restoreDescribeModal", async () => {
        try {
          const response = await fetch(`restores/describe?name=${restore.name}`);
          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          if (data.message) {
            alert(data.message);
          } else {
            displayDataInModal(data, "restoreDescribeModal");
          }
        } catch (error) {
          console.error("Error fetching restore describe:", error);
          alert(`Error fetching restore describe: ${error.message}`);
        } finally {
          hideSpinnerAndShowData("restoreDescribeModal");
        }
      });
      $("#restoreDescribeModal").modal("show");
    });
    actionsCell.appendChild(describeButton);

    const deleteButton = createButton("Delete", () => {
      const confirmation = confirm(`Are you sure you want to delete restore "${restore.name}"?`);
      if (confirmation) {
        deleteRestore(restore.name);
      }
    });
    actionsCell.appendChild(deleteButton);
  });

  updatePagination(restoreData.length);

  const dismissButtons = document.querySelectorAll(".modal-header button");
  for (const dismissButton of dismissButtons) {
    dismissButton.addEventListener("click", () => {
      console.log("Dismiss button clicked");
      $(dismissButton.closest(".modal")).modal("hide");
    });
  }
}

function updatePagination(totalItems) {
  const pagination = document.getElementById("restorePagination");
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
      listRestores();
    });

    listItem.appendChild(pageLink);
    pagination.appendChild(listItem);
  }
}

function parseRestoreData(data) {
  const restoreList = [];

  function parseRestore(restore) {
    const {
      metadata: { name, creationTimestamp },
      spec: { backupName, scheduleName, includedNamespaces },
      status: { phase, warnings, startTimestamp, completionTimestamp },
    } = restore;

    return {
      name,
      backup: backupName || scheduleName || '-',
      status: phase || 'New',
      started: startTimestamp ? new Date(startTimestamp).toLocaleString() : '-',
      completed: completionTimestamp ? new Date(completionTimestamp).toLocaleString() : '-',
      errors: 0, // No "errors" field found in the JSON output, so set it to 0 by default
      warnings: warnings || 0,
      created: creationTimestamp ? new Date(creationTimestamp).toLocaleString() : '<nil>',
      selector: includedNamespaces ? includedNamespaces.join(', ') : '<none>',
    };
  }


  if (data) {
    if (data.items) {
      restoreList.push(...data.items.filter(item => item.metadata).map(parseRestore));
    } else if (data.metadata) {
      restoreList.push(parseRestore(data));
    }
  }

  return restoreList;
}

async function listRestores() {
  try {
    const response = await fetch(`restores`);
    const data = await response.json();
    const restoreList = parseRestoreData(data);
    // Sort the restoreList by the 'created' field in descending order
    restoreList.sort((a, b) => {
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
    displayRestoreData(restoreList);
  } catch (error) {
    console.error("Error fetching restores:", error);
  }
}


async function deleteRestore(restoreName) {
  console.log('Deleting restore ${restoreName}');

  if (!restoreName) return;

  const response = await fetch(`restores?name=${restoreName}`, {
    method: "DELETE",
  });
  const data = await response.json();
  alert(data.message);
  listRestores();
}

window.listRestores = fetchData;
window.parseRestoreData = window.parseRestoreData || parseRestoreData;
fetchData(1);
initRestorePage();





