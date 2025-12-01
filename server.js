const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Data files
// Data files
const dataDir = '/data'; // Render persistent disk for writable storage
const habitsFile = path.join(dataDir, 'habits.json');
const tasksFile = path.join(dataDir, 'tasks.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Read helper
function readFile(file) {
    if (!fs.existsSync(file)) {
        return [];
    }
    try {
        const data = fs.readFileSync(file, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error(`Error reading/parsing ${file}:`, err);
        return [];
    }
}

// Write helper
function writeFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- HABITS ---

app.get('/api/habits/:userId', (req, res) => {
    const habits = readFile(habitsFile);
    const userHabits = habits.filter(h => h.userId === req.params.userId);
    res.json(userHabits);
});

app.post('/api/habits', (req, res) => {
    const habits = readFile(habitsFile);
    const newHabit = {
        id: Date.now().toString(),
        userId: req.body.userId,
        title: req.body.title,
        goal: req.body.goal,
        doneDates: []
    };
    habits.push(newHabit);
    writeFile(habitsFile, habits);
    res.json(newHabit);
});

app.put('/api/habits/:id', (req, res) => {
    let habits = readFile(habitsFile);
    const habit = habits.find(h => h.id === req.params.id);
    if (habit) {
        Object.assign(habit, req.body);
        writeFile(habitsFile, habits);
        res.json(habit);
    } else {
        res.status(404).json({ error: 'Habit not found' });
    }
});

app.delete('/api/habits/:id', (req, res) => {
    let habits = readFile(habitsFile);
    habits = habits.filter(h => h.id !== req.params.id);
    writeFile(habitsFile, habits);
    res.json({ success: true });
});

// --- TASKS ---

app.get('/api/tasks/:userId', (req, res) => {
    const tasks = readFile(tasksFile);
    const userTasks = tasks.filter(t => t.userId === req.params.userId);
    res.json(userTasks);
});

app.post('/api/tasks', (req, res) => {
    const tasks = readFile(tasksFile);
    const newTask = {
        id: Date.now().toString(),
        userId: req.body.userId,
        title: req.body.title,
        time: req.body.time,
        done: false
    };
    tasks.push(newTask);
    writeFile(tasksFile, tasks);
    res.json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
    let tasks = readFile(tasksFile);
    const task = tasks.find(t => t.id === req.params.id);
    if (task) {
        Object.assign(task, req.body);
        writeFile(tasksFile, tasks);
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    let tasks = readFile(tasksFile);
    tasks = tasks.filter(t => t.id !== req.params.id);
    writeFile(tasksFile, tasks);
    res.json({ success: true });
});

// Start server with auto port selection
function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`✅ Server running at http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(PORT);
