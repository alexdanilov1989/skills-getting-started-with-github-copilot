document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let activitiesData = {};

  // Function to show message to the user
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Function to render activities on the page
  function renderActivities() {
    activitiesList.innerHTML = "";
    for (const [name, activity] of Object.entries(activitiesData)) {
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;

      const desc = document.createElement("p");
      desc.textContent = activity.description;

      const sched = document.createElement("p");
      sched.textContent = `Schedule: ${activity.schedule}`;

      const capacity = document.createElement("p");
      capacity.textContent = `${activity.participants.length} / ${activity.max_participants} signed up`;

      // Participants section
      const participantsSection = document.createElement("div");
      participantsSection.className = "participants-section";

      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = `Participants (${activity.participants.length})`;
      participantsSection.appendChild(participantsHeading);

      if (activity.participants.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "participants-list";
        activity.participants.forEach((email) => {
          const li = document.createElement("li");
          li.className = "participant-item";

          const span = document.createElement("span");
          span.textContent = email;

          const btn = document.createElement("button");
          btn.className = "delete-btn";
          btn.title = "Remove participant";
          btn.setAttribute("aria-label", `Remove ${email} from ${name}`);
          btn.textContent = "✖";

          btn.addEventListener("click", () => {
            fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`, {
              method: "DELETE",
            })
              .then(async (res) => {
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.detail || "Failed to remove participant");
                }
                return res.json();
              })
              .then((result) => {
                // Refresh activities from server and re-render
                fetchActivities();
                showMessage(result.message, "success");
              })
              .catch((err) => {
                showMessage(err.message || "Could not remove participant", "error");
              });
          });

          li.appendChild(span);
          li.appendChild(btn);
          ul.appendChild(li);
        });
        participantsSection.appendChild(ul);
      } else {
        const p = document.createElement("p");
        p.className = "participants-empty";
        p.textContent = "No participants yet. Be the first to sign up!";
        participantsSection.appendChild(p);
      }

      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(sched);
      card.appendChild(capacity);
      card.appendChild(participantsSection);

      activitiesList.appendChild(card);
    }
  }

  // Function to populate the activity select dropdown
  function populateSelect() {
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    Object.keys(activitiesData).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Fetch activities from API
  function fetchActivities() {
    fetch("/activities")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load activities");
        return res.json();
      })
      .then((data) => {
        activitiesData = data;
        renderActivities();
        populateSelect();
      })
      .catch(() => {
        activitiesList.innerHTML = '<p class="error">Could not load activities. Try reloading the page.</p>';
      });
  }

  // Initial load
  fetchActivities();

  // Handle form submission for signing up
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activityName = activitySelect.value;

    if (!email || !activityName) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }

    fetch(`/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`, {
      method: "POST",
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Signup failed");
        }
        return res.json();
      })
      .then((result) => {
        // Refresh activities from server and re-render
        fetchActivities();
        showMessage(result.message, "success");
        signupForm.reset();
      })
      .catch((err) => {
        showMessage(err.message || "Signup failed", "error");
      });
  });
});
