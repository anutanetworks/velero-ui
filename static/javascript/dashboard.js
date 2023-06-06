
function parseBackupData(data) {
  const backupList = [];

  if (data) {
    if (data.items) {
      data.items.forEach((backup) => {
        if (backup.metadata) {
          const {
            metadata: { name, creationTimestamp },
            status: { phase, expiration, errors = 0, warnings = 0 },
            spec: { storageLocation },
          } = backup;

          backupList.push({
            name,
            status: phase || 'New',
            errors,
            warnings,
            created: creationTimestamp || '<nil>',
            expiration: expiration || 'n/a',
            storageLocation: storageLocation || '<none>',
            selector: '<none>',
          });
        }
      });
    } else if (data.metadata) {
      const {
        metadata: { name, creationTimestamp },
        status: { phase, expiration, errors = 0, warnings = 0 },
        spec: { storageLocation },
      } = data;

      backupList.push({
        name,
        status: phase,
        errors,
        warnings,
        created: creationTimestamp,
        expiration: expiration,
        storageLocation: storageLocation,
        selector: '<none>',
      });
    }
  }
  return backupList;
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
      status: { phase },
    } = item;

    return {
      name,
      status: phase,
      created: creationTimestamp,
      schedule,
      backupTtl: ttl,
      lastBackup: "n/a", // You need to update this value based on your API response
      selector: "<none>",
      paused: false, // You need to update this value based on your API response
    };
  }
  return null;
}

async function loadDashboardSummary() {
  const backupResponse = await fetch(`backups`);
  const backupData = await backupResponse.json();
  const backupList = parseBackupData(backupData);

  const scheduleResponse = await fetch(`schedules`);
  const scheduleData = await scheduleResponse.json();
  const scheduleList = parseScheduleData(scheduleData);

  displayDashboardSummary(backupList, scheduleList);
}

function displayDashboardSummary(backupList, scheduleList) {
  const totalBackups = backupList.length;
  const totalSchedules = scheduleList.length;

  const backupsByStatus = backupList.reduce((statusCounts, backup) => {
    if (statusCounts[backup.status]) {
      statusCounts[backup.status]++;
    } else {
      statusCounts[backup.status] = 1;
    }
    return statusCounts;
  }, {});

  document.getElementById("totalBackups").innerText = `Total Backups: ${totalBackups}`;
  document.getElementById("totalSchedules").innerText = `Total Schedules: ${totalSchedules}`;

  let backupsByStatusText = "Backups by Status:";
  for (const [status, count] of Object.entries(backupsByStatus)) {
    backupsByStatusText += `\n${status}: ${count}`;
  }
  document.getElementById("backupsByStatus").innerText = backupsByStatusText;
}

document.addEventListener("DOMContentLoaded", loadDashboardSummary);

