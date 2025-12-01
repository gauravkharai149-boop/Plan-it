document.addEventListener("DOMContentLoaded", function () {

    // Basic DOM references
    var habitForm = document.getElementById("habitForm");
    var taskForm = document.getElementById("taskForm");
    var habitsList = document.getElementById("habitsList");
    var tasksTableBody = document.querySelector("#tasksTable tbody");
    var themeBtn = document.getElementById("themeBtn");

    // Storage keys
    var HABITS_KEY = "simple_habits";
    var TASKS_KEY = "simple_tasks";

    // Load data from storage
    function loadData(key) {
        var data = localStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    }

    // Save data to storage
    function saveData(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Make simple id
    function makeId() {
        return "id" + Math.random().toString(36).substr(2, 6);
    }

    // Today's date in yyyy-mm-dd
    function today() {
        return new Date().toISOString().split("T")[0];
    }

    // Show all habits
    function showHabits() {
        var habits = loadData(HABITS_KEY);
        habitsList.innerHTML = "";

        habits.forEach(function (h) {
            var box = document.createElement("div");
            box.className = "habit";

            box.innerHTML = `
        <div class="left">
          <strong>${h.title}</strong><br>
          <span class="goal">${h.goal} days/week</span>
        </div>

        <div>
          <button class="toggleBtn">${h.doneDates.includes(today()) ? "Undo" : "Done"}</button>
          <button class="delBtn">Delete</button>
        </div>
      `;

            box.querySelector(".toggleBtn").addEventListener("click", function () {
                toggleHabit(h.id);
            });

            box.querySelector(".delBtn").addEventListener("click", function () {
                deleteHabit(h.id);
            });

            habitsList.appendChild(box);
        });
    }

    // Show all tasks
    function showTasks() {
        var tasks = loadData(TASKS_KEY);
        tasks.sort(function (a, b) {
            return a.time.localeCompare(b.time);
        });

        tasksTableBody.innerHTML = "";

        tasks.forEach(function (t) {
            var row = document.createElement("tr");

            row.innerHTML = `
        <td>${t.time}</td>
        <td class="${t.done ? "task-done" : ""}">${t.title}</td>
        <td>
          <button class="toggleBtn">${t.done ? "Undo" : "Done"}</button>
          <button class="delBtn">Delete</button>
        </td>
      `;

            row.querySelector(".toggleBtn").addEventListener("click", function () {
                toggleTask(t.id);
            });

            row.querySelector(".delBtn").addEventListener("click", function () {
                deleteTask(t.id);
            });

            tasksTableBody.appendChild(row);
        });
    }

    // Add new habit
    function addHabit(title, goal) {
        var habits = loadData(HABITS_KEY);
        habits.push({
            id: makeId(),
            title: title,
            goal: parseInt(goal),
            doneDates: []
        });
        saveData(HABITS_KEY, habits);
        showHabits();
    }

    // Mark habit done/undo
    function toggleHabit(id) {
        var habits = loadData(HABITS_KEY);
        habits.forEach(function (h) {
            if (h.id === id) {
                if (h.doneDates.includes(today())) {
                    h.doneDates = h.doneDates.filter(function (d) { return d !== today(); });
                } else {
                    h.doneDates.push(today());
                }
            }
        });
        saveData(HABITS_KEY, habits);
        showHabits();
    }

    // Delete habit
    function deleteHabit(id) {
        var habits = loadData(HABITS_KEY).filter(function (h) {
            return h.id !== id;
        });
        saveData(HABITS_KEY, habits);
        showHabits();
    }

    // Add task
    function addTask(title, time) {
        var tasks = loadData(TASKS_KEY);
        tasks.push({
            id: makeId(),
            title: title,
            time: time,
            done: false
        });
        saveData(TASKS_KEY, tasks);
        showTasks();
    }

    // Toggle task done
    function toggleTask(id) {
        var tasks = loadData(TASKS_KEY);
        tasks.forEach(function (t) {
            if (t.id === id) {
                t.done = !t.done;
            }
        });
        saveData(TASKS_KEY, tasks);
        showTasks();
    }

    // Delete task
    function deleteTask(id) {
        var tasks = loadData(TASKS_KEY).filter(function (t) {
            return t.id !== id;
        });
        saveData(TASKS_KEY, tasks);
        showTasks();
    }

    // Form submit: habits
    habitForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var title = document.getElementById("habitTitle").value.trim();
        var goal = document.getElementById("habitGoal").value;

        if (title === "") return;

        addHabit(title, goal);
        habitForm.reset();
    });

    // Form submit: tasks
    taskForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var title = document.getElementById("taskTitle").value.trim();
        var time = document.getElementById("taskTime").value;

        if (title === "" || time === "") return;

        addTask(title, time);
        taskForm.reset();
    });

    // Theme toggle
    themeBtn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme");
        if (current === "dark") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
        }
    });

    // Initial display
    showHabits();
    showTasks();
});
