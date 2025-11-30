const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const HABITS_FILE = path.join(DATA_DIR, 'habits.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Helper to read data
const readData = (file) => {
    if (!fs.existsSync(file)) return [];
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading file:", err);
        return [];
    }
};

// Helper to write data
const writeData = (file, data) => {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing file:", err);
    }
};

// --- API Endpoints ---

// Get Habits for User
app.get('/api/habits/:userId', (req, res) => {
    const habits = readData(HABITS_FILE);
    const userHabits = habits.filter(h => h.userId === req.params.userId);
    res.json(userHabits);
});

// Add Habit
app.post('/api/habits', (req, res) => {
    const habits = readData(HABITS_FILE);
    const newHabit = { ...req.body, id: Date.now().toString(), completedDates: [] };
    habits.push(newHabit);
    writeData(HABITS_FILE, habits);
    res.json(newHabit);
});

// Update Habit (e.g., toggle completion)
app.put('/api/habits/:id', (req, res) => {
    let habits = readData(HABITS_FILE);
    const index = habits.findIndex(h => h.id === req.params.id);
    if (index !== -1) {
        habits[index] = { ...habits[index], ...req.body };
        writeData(HABITS_FILE, habits);
        res.json(habits[index]);
    } else {
        res.status(404).json({ error: "Habit not found" });
    }
});

// Delete Habit
app.delete('/api/habits/:id', (req, res) => {
    let habits = readData(HABITS_FILE);
    habits = habits.filter(h => h.id !== req.params.id);
    writeData(HABITS_FILE, habits);
    res.json({ success: true });
});

// Get Tasks for User
app.get('/api/tasks/:userId', (req, res) => {
    const tasks = readData(TASKS_FILE);
    const userTasks = tasks.filter(t => t.userId === req.params.userId);
    res.json(userTasks);
});

// Add Task
app.post('/api/tasks', (req, res) => {
    const tasks = readData(TASKS_FILE);
    const newTask = { ...req.body, id: Date.now().toString(), completed: false };
    tasks.push(newTask);
    writeData(TASKS_FILE, tasks);
    res.json(newTask);
});

// Update Task
app.put('/api/tasks/:id', (req, res) => {
    let tasks = readData(TASKS_FILE);
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...req.body };
        writeData(TASKS_FILE, tasks);
        res.json(tasks[index]);
    } else {
        res.status(404).json({ error: "Task not found" });
    }
});

// Delete Task
app.delete('/api/tasks/:id', (req, res) => {
    let tasks = readData(TASKS_FILE);
    tasks = tasks.filter(t => t.id !== req.params.id);
    writeData(TASKS_FILE, tasks);
    res.json({ success: true });
});

// Auto-select available port
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${PORT} is busy, trying ${PORT + 1}...`);
        app.listen(PORT + 1, () => {
            console.log(`✅ Server running at http://localhost:${PORT + 1}`);
        });
    } else {
        console.error('Server error:', err);
    }
});
