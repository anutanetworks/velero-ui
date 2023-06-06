import { createButton, displayDataInModal, hideSpinnerAndShowData } from "./utils.js";

let submitCreateScheduleInitialized = false;

function initSchedulePage() {
  listSchedules();

  document.getElementById("listSchedulesBtn").addEventListener("click", listSchedules);

  if (!submitCreateScheduleInitialized) {
    document.getElementById("submitCreateSchedule").addEventListener("click", () => {
      createSchedule();
      $("#createScheduleModal").modal("hide");
    });
    submitCreateScheduleInitialized = true;
  }

  const deleteScheduleForm = document.getElementById("deleteScheduleForm");
  const submitDeleteSchedule = document.getElementById("submitDeleteSchedule");

  submitDeleteSchedule.addEventListener("click", () => {
    deleteSchedule(deleteScheduleForm.deleteScheduleName.value);
    deleteScheduleForm.reset();
    $("#deleteScheduleModal").modal("hide");
  });

  // Add event listener for Restore button
  document.getElementById("restoreButton").addEventListener("click", () => {
    const scheduleName = document.getElementById('restoreScheduleName').value;
    const optionalParameters = document.getElementById('restoreOptionalParameters').value;
    const restoreModal = bootstrap.Modal.getInstance(document.getElementById('restoreFormModal'));
    restoreModal.hide();
    restoreSchedule(scheduleName, optionalParameters);
  });
}

async function restoreSchedule(scheduleName, optionalParameters) {
  const response = await fetch('restores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scheduleName: scheduleName,
      optionalParameters: optionalParameters,
    }),
  });

  const data = await response.json();
  alert(data.message);
}

$(document).ready(initSchedulePage);

function displayScheduleData(scheduleData) {
  const tableBody = document.querySelector("#schedulesTableBody");
  tableBody.innerHTML = "";

  scheduleData.forEach((schedule) => {
    const newRow = tableBody.insertRow();

    newRow.insertCell().innerText = schedule.name;
    newRow.insertCell().innerText = schedule.status;
    newRow.insertCell().innerText = new Date(schedule.created).toLocaleString();
    newRow.insertCell().innerText = schedule.schedule;
    newRow.insertCell().innerText = schedule.backupTtl;
    newRow.insertCell().innerText = schedule.lastBackup;
    newRow.insertCell().innerText = schedule.selector;
    newRow.insertCell().innerText = schedule.paused;

    const actionsCell = newRow.insertCell();
    const deleteButton = createButton("Delete", () => {
      const confirmation = confirm(`Are you sure you want to delete schedule "${schedule.name}"?`);
      if (confirmation) {
        deleteSchedule(schedule.name);
      }
    });
    actionsCell.appendChild(deleteButton);
    const describeButton = createButton("Describe", () => {
      displayDataInModal(null, "scheduleDescribeModal", async () => {
        try {
        const response = await fetch(`schedules/describe?name=${schedule.name}`);
          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          if (data.message) {
            alert(data.message);
          } else {
            displayDataInModal(data, "scheduleDescribeModal");
          }
        } catch (error) {
          console.error("Error fetching schedule describe:", error);
          alert(`Error fetching schedule describe: ${error.message}`);
        } finally {
          hideSpinnerAndShowData("scheduleDescribeModal");
        }
      });
      $("#scheduleDescribeModal").modal("show");
    });
    actionsCell.appendChild(describeButton);

    // Add the restore button
    const restoreButton = createButton("Restore", () => {
      $("#restoreFormModal").modal("show");
      document.getElementById("restoreScheduleName").value = schedule.name;
    });
    actionsCell.appendChild(restoreButton);
  });

  // Add the event listener for the dismiss buttons once, outside the loop
  const dismissButtons = document.querySelectorAll(".modal-header button");
  for (const dismissButton of dismissButtons) {
    dismissButton.addEventListener("click", () => {
      console.log("Dismiss button clicked");
      $(dismissButton.closest(".modal")).modal("hide");
    });
  }
}

function parseScheduleData(data) {
  const scheduleList = [];

  if (data.kind === "ScheduleList" && data.items) {
    data.items.forEach((item) => {
      const scheduleData = extractScheduleData(item);
      if (scheduleData) {
        scheduleList.push(scheduleData);
      }
    });
  } else if (data.kind === "Schedule") {
    const scheduleData = extractScheduleData(data);
    if (scheduleData) {
      scheduleList.push(scheduleData);
    }
  }

  return scheduleList;
}

function extractScheduleData(item) {
  if (item.metadata && item.spec && item.status) {
    const {
      metadata: { name, creationTimestamp },
      spec: { schedule, template: { ttl } },
      status: { phase, lastBackup },
    } = item;

    return {
      name,
      status: phase,
      created: creationTimestamp,
      schedule,
      backupTtl: ttl,
      lastBackup: lastBackup ? new Date(lastBackup).toLocaleString() : "n/a",
      selector: "<none>",
      paused: false,
    };
  }
  return null;
}

async function listSchedules() {
  const response = await fetch(`schedules`);
  const data = await response.json();
  const scheduleList = parseScheduleData(data);
  displayScheduleData(scheduleList);
}

async function createSchedule() {
  const scheduleName = document.getElementById("scheduleName").value;
  const scheduleSpec = document.getElementById("scheduleSpec").value;
  const optionalParameters = document.getElementById("optionalParameters").value;

  if (!scheduleName || !scheduleSpec) {
    alert("Please enter a schedule name and schedule specification.");
    return;
  }

  try {
    const response = await fetch("schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: scheduleName, schedule: scheduleSpec, optionalParameters: optionalParameters }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message);
      document.getElementById("scheduleName").value = "";
      document.getElementById("scheduleSpec").value = "";
      document.getElementById("optionalParameters").value = "";
      $('#createScheduleModal').modal('hide');
      listSchedules();
    } else {
      const error = await response.json();
      alert(error.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while creating the schedule.");
  }
}

async function deleteSchedule(scheduleName) {
  if (!scheduleName) return;

  const response = await fetch(`schedules?name=${scheduleName}`, {
    method: "DELETE",
  });
  const data = await response.json();
  alert(data.message);
  listSchedules();
}

window.parseScheduleData = window.parseScheduleData || parseScheduleData;
