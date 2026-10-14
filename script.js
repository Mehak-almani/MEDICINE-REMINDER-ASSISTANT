// MediSaathi - script.js

const medicineInput = document.getElementById("medicine");
const doseInput = document.getElementById("dose");
const frequencyInput = document.getElementById("frequency");
const timeInput = document.getElementById("time");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");
const addAlarmButton = document.getElementById("addAlarm");
const message = document.getElementById("message");
const doseHistory = document.getElementById("doseHistory");

const REMINDERS_KEY = "medisaathi_reminders";
const HISTORY_KEY = "medisaathi_history";

let selectedPhoto = "";

// Read saved data safely
function readStorage(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

let reminders = readStorage(REMINDERS_KEY);
let historyRecords = readStorage(HISTORY_KEY);

// Local date in YYYY-MM-DD format
function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function saveData() {
    try {
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRecords));
        return true;
    } catch (error) {
        showMessage(
            "Storage is full. Try removing a large medicine photo.",
            true
        );
        return false;
    }
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#dc3545" : "#198754";
}

// Preview selected medicine photo
photoInput.addEventListener("change", function () {
    const file = photoInput.files[0];

    selectedPhoto = "";
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showMessage("Please select an image file.", true);
        photoInput.value = "";
        return;
    }

    // Keep images reasonably small for browser storage.
    if (file.size > 1024 * 1024) {
        showMessage("Please choose an image smaller than 1 MB.", true);
        photoInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        selectedPhoto = reader.result;
        photoPreview.src = selectedPhoto;
        photoPreview.hidden = false;
    };

    reader.onerror = function () {
        showMessage("Could not read the selected image.", true);
    };

    reader.readAsDataURL(file);
});

// Add a new medicine reminder
addAlarmButton.addEventListener("click", function () {
    const medicine = medicineInput.value.trim();
    const dose = doseInput.value.trim();
    const frequency = Number(frequencyInput.value);
    const time = timeInput.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (
        !medicine ||
        !dose ||
        !time ||
        !startDate ||
        !endDate
    ) {
        showMessage("Please fill in all required fields.", true);
        return;
    }

    if (startDate > endDate) {
        showMessage("End Date must be on or after Start Date.", true);
        return;
    }

    const reminder = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        medicine,
        dose,
        frequency,
        time,
        startDate,
        endDate,
        photo: selectedPhoto,
        createdAt: new Date().toISOString()
    };

    reminders.push(reminder);

    if (!saveData()) {
        reminders.pop();
        return;
    }

    medicineInput.value = "";
    doseInput.value = "";
    frequencyInput.value = "1";
    timeInput.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    photoInput.value = "";
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");
    selectedPhoto = "";

    showMessage("Medicine reminder added successfully!");
    renderReminders();
    renderHistory();
});

// Check if the course includes today's date
function isCourseActive(reminder, date) {
    return date >= reminder.startDate && date <= reminder.endDate;
}

// Find today's record for a reminder
function getTodayRecord(reminderId) {
    const today = getLocalDate();

    return historyRecords.find(function (record) {
        return (
            record.reminderId === reminderId &&
            record.date === today
        );
    });
}

// Record whether the dose was taken or missed
function recordDose(reminderId, status) {
    const reminder = reminders.find(function (item) {
        return item.id === reminderId;
    });

    if (!reminder) return;

    const today = getLocalDate();

    if (!isCourseActive(reminder, today)) {
        showMessage("This reminder is outside its course dates.", true);
        return;
    }

    if (getTodayRecord(reminderId)) {
        showMessage("Today's dose has already been recorded.", true);
        return;
    }

    const record = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        reminderId: reminder.id,
        medicine: reminder.medicine,
        dose: reminder.dose,
        date: today,
        time: reminder.time,
        status: status,
        recordedAt: new Date().toISOString()
    };

    historyRecords.unshift(record);

    if (!saveData()) {
        historyRecords.shift();
        return;
    }

    showMessage(
        status === "Taken"
            ? "Dose marked as taken."
            : "Dose marked as missed."
    );

    renderReminders();
    renderHistory();
}

// Helper to create safe text elements
function addText(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) {
        element.className = className;
    }

    parent.appendChild(element);
    return element;
}

// Display all reminders
function renderReminders() {
    let reminderList = document.getElementById("reminderList");

    // Create the list automatically if it isn't in the HTML yet.
    if (!reminderList) {
        reminderList = document.createElement("section");
        reminderList.className = "card";
        reminderList.id = "reminderList";

        const historyCard = doseHistory.closest(".card");

        if (historyCard) {
            historyCard.parentNode.insertBefore(
                reminderList,
                historyCard
            );
        } else {
            document.body.appendChild(reminderList);
        }
    }

    reminderList.replaceChildren();
    addText(reminderList, "h2", "📋 Your Medicine Reminders");

    if (reminders.length === 0) {
        addText(
            reminderList,
            "p",
            "No reminders added yet.",
            "empty-message"
        );
        return;
    }

    reminders.forEach(function (reminder) {
        const item = document.createElement("div");
        item.className = "reminder-item";

        addText(item, "h3", reminder.medicine);
        addText(item, "p", "Dose: " + reminder.dose);
        addText(item, "p", "Daily frequency: " + reminder.frequency);
        addText(item, "p", "Reminder time: " + reminder.time);
        addText(item, "p", "Course: " + reminder.startDate + " to " + reminder.endDate);

        if (reminder.photo) {
            const img = document.createElement("img");
            img.src = reminder.photo;
            img.alt = "Photo of " + reminder.medicine;
            item.appendChild(img);
        }

        const today = getLocalDate();
        const active = isCourseActive(reminder, today);
        const existingRecord = getTodayRecord(reminder.id);

        if (!active) {
            addText(item, "p", "Course is not active today.");
        } else if (existingRecord) {
            addText(
                item,
                "p",
                "Today's dose: " + existingRecord.status,
                existingRecord.status === "Taken"
                    ? "status-taken"
                    : "status-missed"
            );
        } else {
            addText(item, "p", "Today's dose has not been recorded.");

            const takenButton = document.createElement("button");
            takenButton.type = "button";
            takenButton.className = "taken-button";
            takenButton.textContent = "✓ Taken";
            takenButton.addEventListener("click", function () {
                recordDose(reminder.id, "Taken");
            });

            const missedButton = document.createElement("button");
            missedButton.type = "button";
            missedButton.className = "missed-button";
            missedButton.textContent = "✗ Missed";
            missedButton.addEventListener("click", function () {
                recordDose(reminder.id, "Missed");
            });

            item.appendChild(takenButton);
            item.appendChild(missedButton);
        }

        reminderList.appendChild(item);
    });
}

// Display dose history
function renderHistory() {
    doseHistory.replaceChildren();

    if (historyRecords.length === 0) {
        addText(
            doseHistory,
            "p",
            "No dose records yet.",
            "empty-message"
        );
        return;
    }

    historyRecords.forEach(function (record) {
        const item = document.createElement("div");
        item.className = "history-item";

        addText(item, "strong", record.medicine);
        addText(item, "p", "Dose: " + record.dose);
        addText(item, "p", "Date: " + record.date);
        addText(item, "p", "Scheduled time: " + record.time);

        addText(
            item,
            "p",
            "Status: " + record.status,
            record.status === "Taken"
                ? "status-taken"
                : "status-missed"
        );

        doseHistory.appendChild(item);
    });
}

// Initial display
renderReminders();
renderHistory();
// MediSaathi Voice Command
(() => {
  const voiceBtn = document.getElementById("voiceBtn");
  const voiceStatus = document.getElementById("voiceStatus");

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!voiceBtn || !voiceStatus) return;

  if (!SpeechRecognition) {
    voiceStatus.textContent =
      "Voice commands are not supported in this browser. Try Chrome.";
    voiceBtn.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  let listening = false;

  voiceBtn.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      voiceStatus.textContent =
        "Please wait a moment and try again.";
    }
  });

  recognition.onstart = () => {
    listening = true;
    voiceBtn.textContent = "🛑 Stop Listening";
    voiceStatus.textContent = "Listening... Speak now.";
  };

  recognition.onend = () => {
    listening = false;
    voiceBtn.textContent = "🎤 Start Voice Command";
  };

  recognition.onerror = (event) => {
    voiceStatus.textContent =
      event.error === "not-allowed"
        ? "Microphone permission denied. Allow microphone access."
        : "Voice error: " + event.error +
          ". Please try again.";
  };

  recognition.onresult = (event) => {
    const command = event.results[
      event.results.length - 1
    ][0].transcript.trim();

    voiceStatus.textContent = "You said: " + command;
    handleVoiceCommand(command);
  };

  function handleVoiceCommand(command) {
    const text = command.toLowerCase();

    const medicine = document.getElementById("medicine");
    const dose = document.getElementById("dose");
    const frequency = document.getElementById("frequency");
    const time = document.getElementById("time");
    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");

    // Fill medicine name
    const medicineMatch = command.match(
      /(?:medicine|medication)\s+(?:name\s+)?(.+)/i
    );

    if (medicineMatch && medicine) {
      medicine.value = medicineMatch[1].trim();
      voiceStatus.textContent =
        "Medicine name set to " + medicine.value;
      return;
    }

    // Fill dose
    const doseMatch = command.match(
      /(?:dose|dosage)\s+(?:is\s+)?(.+)/i
    );

    if (doseMatch && dose) {
      dose.value = doseMatch[1].trim();
      voiceStatus.textContent = "Dose updated.";
      return;
    }

    // Set frequency
    if (/once daily|once a day|one time daily/.test(text)) {
      frequency.value = "1";
    } else if (/twice daily|two times daily|two times a day/.test(text)) {
      frequency.value = "2";
    } else if (/three times daily|three times a day/.test(text)) {
      frequency.value = "3";
    } else if (/four times daily|four times a day/.test(text)) {
      frequency.value = "4";
    } else if (/frequency/.test(text)) {
      voiceStatus.textContent =
        "Say once daily, twice daily, three times daily, or four times daily.";
      return;
    } else {
      // Set reminder time: say, for example, "time 8 AM"
      const timeMatch = text.match(
        /(?:reminder time|set time|time)\s+(?:is\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
      );

      if (timeMatch && time) {
        let hours = Number(timeMatch[1]);
        const minutes = Number(timeMatch[2] || 0);
        const meridiem = (timeMatch[3] || "").toLowerCase();

        if (
          hours < 1 || hours > 12 ||
          minutes > 59 ||
          (meridiem && hours === 0)
        ) {
          voiceStatus.textContent = "Invalid time. Please try again.";
          return;
        }

        if (meridiem === "pm" && hours < 12) hours += 12;
        if (meridiem === "am" && hours === 12) hours = 0;

        time.value =
          String(hours).padStart(2, "0") + ":" +
          String(minutes).padStart(2, "0");

        voiceStatus.textContent =
          "Reminder time set to " + time.value;
        return;
      }

      if (/show dose history|dose history|show history/.test(text)) {
        document.getElementById("doseHistory")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        voiceStatus.textContent = "Showing dose history.";
        return;
      }

      if (/add reminder|save reminder/.test(text)) {
        document.getElementById("addAlarm")?.click();
        voiceStatus.textContent =
          "Add Reminder button activated. Check the form for any missing fields.";
        return;
      }

      voiceStatus.textContent =
        "Command not recognized. Try: medicine name Panadol, dose one tablet, time 8 AM, or show dose history.";
      return;
    }

    voiceStatus.textContent = "Frequency updated.";
  }
})();