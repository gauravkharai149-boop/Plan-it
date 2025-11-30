document.addEventListener('DOMContentLoaded', () => {
    // --- State & Config ---
    const API_URL = 'http://localhost:3000/api';
    let userId = localStorage.getItem('planit_user_id');

    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('planit_user_id', userId);
    }

    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const habitsGrid = document.getElementById('habits-grid');
    const scheduleBody = document.getElementById('schedule-body');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const addTaskBtn = document.getElementById('add-task-btn');
    const habitModal = document.getElementById('habit-modal');
    const taskModal = document.getElementById('task-modal');
    const closeModals = document.querySelectorAll('.close-modal');
    const habitForm = document.getElementById('habit-form');
    const taskForm = document.getElementById('task-form');

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // --- Data Fetching ---
    async function fetchHabits() {
        const res = await fetch(`${API_URL}/habits/${userId}`);
        const habits = await res.json();
        renderHabits(habits);
    }

    async function fetchTasks() {
        const res = await fetch(`${API_URL}/tasks/${userId}`);
        const tasks = await res.json();
        renderTasks(tasks);
    }

    // --- Rendering ---
    function renderHabits(habits) {
        habitsGrid.innerHTML = '';
        habits.forEach(habit => {
            const today = new Date().toISOString().split('T')[0];
            const isCompletedToday = habit.completedDates.includes(today);
            const progress = (habit.completedDates.length / habit.goal) * 100; // Simplified progress logic

            // Calculate circle stroke offset
            const radius = 25;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (isCompletedToday ? 100 : 0) / 100 * circumference; // Just toggle for today for visual simplicity in this demo

            const card = document.createElement('div');
            card.className = `habit-card ${isCompletedToday ? 'completed' : ''}`;
            card.innerHTML = `
                <div class="habit-info">
                    <h3>${habit.title}</h3>
                    <p>Goal: ${habit.goal} days/week</p>
                </div>
                <div class="progress-ring" onclick="toggleHabit('${habit.id}', ${isCompletedToday})">
                    <svg>
                        <circle class="progress-ring-bg" cx="30" cy="30" r="${radius}"></circle>
                        <circle class="progress-ring-fill" cx="30" cy="30" r="${radius}" 
                                style="stroke-dashoffset: ${isCompletedToday ? 0 : circumference}"></circle>
                    </svg>
                    <i class="fa-solid fa-check check-icon"></i>
                </div>
                <div class="habit-actions">
                    <button class="action-btn delete" onclick="deleteHabit('${habit.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            habitsGrid.appendChild(card);
        });
    }

    function renderTasks(tasks) {
        scheduleBody.innerHTML = '';
        // Sort by time
        tasks.sort((a, b) => a.time.localeCompare(b.time));

        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.time}</td>
                <td class="${task.completed ? 'task-completed' : ''}">${task.title}</td>
                <td><span class="status-badge ${task.completed ? 'status-done' : 'status-pending'}">${task.completed ? 'Done' : 'Pending'}</span></td>
                <td>
                    <button class="action-btn" onclick="toggleTask('${task.id}', ${task.completed})">
                        <i class="fa-solid ${task.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTask('${task.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            scheduleBody.appendChild(row);
        });
    }

    // --- Actions ---
    window.toggleHabit = async (id, isCompleted) => {
        const habits = await (await fetch(`${API_URL}/habits/${userId}`)).json();
        const habit = habits.find(h => h.id === id);
        const today = new Date().toISOString().split('T')[0];

        if (isCompleted) {
            habit.completedDates = habit.completedDates.filter(d => d !== today);
        } else {
            habit.completedDates.push(today);
        }

        await fetch(`${API_URL}/habits/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completedDates: habit.completedDates })
        });
        fetchHabits();
    };

    window.deleteHabit = async (id) => {
        // if(confirm('Delete this habit?')) {
        await fetch(`${API_URL}/habits/${id}`, { method: 'DELETE' });
        fetchHabits();
        // }
    };

    window.toggleTask = async (id, isCompleted) => {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !isCompleted })
        });
        fetchTasks();
    };

    window.deleteTask = async (id) => {
        // if(confirm('Delete this task?')) {
        await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
        fetchTasks();
        // }
    };

    // --- Modals ---
    addHabitBtn.onclick = () => { habitModal.style.display = 'flex'; };
    addTaskBtn.onclick = () => { taskModal.style.display = 'flex'; };

    closeModals.forEach(btn => {
        btn.onclick = () => {
            habitModal.style.display = 'none';
            taskModal.style.display = 'none';
        };
    });

    window.onclick = (event) => {
        if (event.target == habitModal) habitModal.style.display = 'none';
        if (event.target == taskModal) taskModal.style.display = 'none';
    };

    // --- Forms ---
    habitForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('habit-title').value;
        const goal = document.getElementById('habit-goal').value;

        await fetch(`${API_URL}/habits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, title, goal })
        });

        habitForm.reset();
        habitModal.style.display = 'none';
        fetchHabits();
    };

    taskForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const time = document.getElementById('task-time').value;

        await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, title, time })
        });

        taskForm.reset();
        taskModal.style.display = 'none';
        fetchTasks();
    };

    // --- Initial Load ---
    fetchHabits();
    fetchTasks();
});
