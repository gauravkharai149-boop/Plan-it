document.addEventListener("DOMContentLoaded", function () {
    console.log("Script loaded and running");

    if (window.location.protocol === 'file:') {
        alert("⚠️ STOP! You are opening this file directly.\n\nPlease open 'http://localhost:3000' in your browser to use the app.");
        return;
    }

    // Basic DOM references
    var habitForm = document.getElementById("habit-form");
    var taskForm = document.getElementById("task-form");
    var habitsList = document.getElementById("habits-grid");
    var tasksTableBody = document.getElementById("schedule-body");
    var themeBtn = document.getElementById("theme-toggle");

    // Modal & Button references
    var addHabitBtn = document.getElementById("add-habit-btn");
    var addTaskBtn = document.getElementById("add-task-btn");
    var startBtn = document.getElementById("start-btn");
    var habitModal = document.getElementById("habit-modal");
    var taskModal = document.getElementById("task-modal");
    var closeButtons = document.querySelectorAll(".close-modal");

    // User ID management
    var userId = localStorage.getItem("planit_user_id");
    if (!userId) {
        userId = "user_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("planit_user_id", userId);
    }

    // Today's date in yyyy-mm-dd
    function today() {
        return new Date().toISOString().split("T")[0];
    }

    // API Helpers
    async function fetchHabits() {
        try {
            const res = await fetch(`/api/habits/${userId}`);
            return await res.json();
        } catch (err) {
            console.error("Error fetching habits:", err);
            return [];
        }
    }

    async function fetchTasks() {
        try {
            const res = await fetch(`/api/tasks/${userId}`);
            return await res.json();
        } catch (err) {
            console.error("Error fetching tasks:", err);
            return [];
        }
    }

    // Show all habits
    async function showHabits() {
        var habits = await fetchHabits();
        habitsList.innerHTML = "";

        habits.forEach(function (h) {
            var box = document.createElement("div");
            box.className = "habit-card";

            box.innerHTML = `
        <div class="habit-info">
          <h3>${h.title}</h3>
          <span class="goal-text">${h.goal} days/week</span>
        </div>
        <div class="habit-actions">
          <button class="toggle-btn ${h.doneDates.includes(today()) ? 'done' : ''}">${h.doneDates.includes(today()) ? "Undo" : "Done"}</button>
          <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

            box.querySelector(".toggle-btn").addEventListener("click", function () {
                toggleHabit(h);
            });

            box.querySelector(".delete-btn").addEventListener("click", function () {
                deleteHabit(h.id);
            });

            habitsList.appendChild(box);
        });
    }

    // Show all tasks
    async function showTasks() {
        var tasks = await fetchTasks();
        tasks.sort(function (a, b) {
            return a.time.localeCompare(b.time);
        });

        tasksTableBody.innerHTML = "";

        tasks.forEach(function (t) {
            var row = document.createElement("tr");

            row.innerHTML = `
        <td>${t.time}</td>
        <td class="${t.done ? "task-done" : ""}">${t.title}</td>
        <td>${t.done ? '<span class="status-done">Completed</span>' : '<span class="status-pending">Pending</span>'}</td>
        <td>
          <button class="action-btn toggle-btn"><i class="fa-solid ${t.done ? 'fa-rotate-left' : 'fa-check'}"></i></button>
          <button class="action-btn delete-btn"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;

            row.querySelector(".toggle-btn").addEventListener("click", function () {
                toggleTask(t);
            });

            row.querySelector(".delete-btn").addEventListener("click", function () {
                deleteTask(t.id);
            });

            tasksTableBody.appendChild(row);
        });
    }

    // Add new habit
    async function addHabit(title, goal) {
        try {
            const res = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    title: title,
                    goal: parseInt(goal)
                })
            });
            if (!res.ok) throw new Error("Server error: " + res.status);
            showHabits();
            habitModal.style.display = "none";
        } catch (err) {
            console.error("Error adding habit:", err);
            alert("Failed to save habit. Is the server running? Error: " + err.message);
        }
    }

    // Mark habit done/undo
    async function toggleHabit(habit) {
        let newDates = habit.doneDates;
        if (newDates.includes(today())) {
            newDates = newDates.filter(d => d !== today());
        } else {
            newDates.push(today());
        }

        try {
            const res = await fetch(`/api/habits/${habit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doneDates: newDates })
            });
            if (!res.ok) throw new Error("Server error: " + res.status);
            showHabits();
        } catch (err) {
            console.error("Error toggling habit:", err);
            alert("Failed to update habit. Error: " + err.message);
        }
    }

    // Delete habit
    async function deleteHabit(id) {
        if (!confirm("Are you sure you want to delete this habit?")) return;
        try {
            const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Server error: " + res.status);
            showHabits();
        } catch (err) {
            console.error("Error deleting habit:", err);
            alert("Failed to delete habit. Error: " + err.message);
        }
    }

    // Add task
    async function addTask(title, time) {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    title: title,
                    time: time
                })
            });
            if (!res.ok) throw new Error("Server error: " + res.status);
            showTasks();
            taskModal.style.display = "none";
        } catch (err) {
            console.error("Error adding task:", err);
            alert("Failed to save task. Is the server running? Error: " + err.message);
        }
    }

    // Toggle task done
    async function toggleTask(task) {
        try {
            await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: !task.done })
            });
            showTasks();
        } catch (err) {
            console.error("Error toggling task:", err);
        }
    }

    // Delete task
    async function deleteTask(id) {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            showTasks();
        } catch (err) {
            console.error("Error deleting task:", err);
        }
    }

    // --- Event Listeners ---

    // Open Modals
    if (addHabitBtn) {
        addHabitBtn.addEventListener("click", function () {
            habitModal.style.display = "block";
        });
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", function () {
            taskModal.style.display = "block";
        });
    }

    // Close Modals
    closeButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            habitModal.style.display = "none";
            taskModal.style.display = "none";
        });
    });

    window.addEventListener("click", function (e) {
        if (e.target == habitModal) habitModal.style.display = "none";
        if (e.target == taskModal) taskModal.style.display = "none";
    });

    // Scroll to Habits
    if (startBtn) {
        startBtn.addEventListener("click", function () {
            document.querySelector(".habits-section").scrollIntoView({ behavior: "smooth" });
        });
    }

    // Form submit: habits
    if (habitForm) {
        habitForm.addEventListener("submit", function (e) {
            e.preventDefault();
            console.log("Form submitted");

            var title = document.getElementById("habit-title").value.trim();
            var goal = document.getElementById("habit-goal").value;

            // DEBUG ALERTS
            alert("Debug: Form submitted!\nTitle: " + title + "\nGoal: " + goal);

            if (title === "") {
                alert("Please enter a habit name.");
                return;
            }

            addHabit(title, goal);
            habitForm.reset();
        });
    }

    // Form submit: tasks
    if (taskForm) {
        taskForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var title = document.getElementById("task-title").value.trim();
            var time = document.getElementById("task-time").value;
            if (title === "" || time === "") return;
            addTask(title, time);
            taskForm.reset();
        });
    }

    // Theme toggle
    if (themeBtn) {
        themeBtn.addEventListener("click", function () {
            var current = document.documentElement.getAttribute("data-theme");
            if (current === "dark") {
                document.documentElement.setAttribute("data-theme", "light");
            } else {
                document.documentElement.setAttribute("data-theme", "dark");
            }
        });
    }

    // Initial display
    showHabits();
    showTasks();

    // DEBUG: Check if elements were found
    alert("Script initialized.\nHabit Form found: " + !!habitForm + "\nTask Form found: " + !!taskForm);
    console.log("Script initialized. Habit Form:", habitForm);
});
