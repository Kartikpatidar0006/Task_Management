import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, GripVertical, X, Check, Search, RefreshCw } from 'lucide-react';

const defaultColumns = {
  todo: {
    id: 'todo',
    title: 'To Do',
    tasks: [
      { id: '1', title: 'Setup React Project', description: 'Initialize project with create-react-app', priority: 'high', completed: false },
      { id: '2', title: 'Design Kanban UI', description: 'Create wireframes and mockups', priority: 'medium', completed: false }
    ]
  },
  inProgress: {
    id: 'inProgress',
    title: 'In Progress',
    tasks: [
      { id: '3', title: 'Implement Drag & Drop', description: 'working start', priority: 'high', completed: false }
    ]
  },
  done: {
    id: 'done',
    title: 'Done',
    tasks: [
      { id: '4', title: 'Project Planning', description: 'Define project scope and requirements', priority: 'low', completed: true }
    ]
  }
};

const STORAGE_KEY = 'kanban-columns-v1';

const KanbanBoard = () => {
  const [columns, setColumns] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultColumns;
    } catch (e) {
      console.error('Failed to load from localStorage', e);
      return defaultColumns;
    }
  });

  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [targetColumn, setTargetColumn] = useState('todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [columns]);

  const handleDragStart = (e, task, columnId) => {
    setDraggedTask(task);
    setDraggedFrom(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedTask || !draggedFrom) return;
    
    if (draggedFrom === targetColumnId) {
      setDraggedTask(null);
      setDraggedFrom(null);
      return;
    }

    const newColumns = { ...columns };
    
    newColumns[draggedFrom].tasks = newColumns[draggedFrom].tasks.filter(
      task => task.id !== draggedTask.id
    );
    
    newColumns[targetColumnId].tasks.push(draggedTask);
    
    setColumns(newColumns);
    setDraggedTask(null);
    setDraggedFrom(null);
  };

  const openModal = (columnId, task = null) => {
    setTargetColumn(columnId);
    if (task) {
      setEditingTask(task);
      setNewTask({ title: task.title, description: task.description, priority: task.priority });
    } else {
      setEditingTask(null);
      setNewTask({ title: '', description: '', priority: 'medium' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setNewTask({ title: '', description: '', priority: 'medium' });
  };

  const handleSaveTask = () => {
    if (!newTask.title.trim()) return;

    const newColumns = { ...columns };

    if (editingTask) {
      Object.keys(newColumns).forEach(colId => {
        const taskIndex = newColumns[colId].tasks.findIndex(t => t.id === editingTask.id);
        if (taskIndex !== -1) {
          newColumns[colId].tasks[taskIndex] = { ...editingTask, ...newTask };
        }
      });
    } else {
      const taskId = Date.now().toString();
      newColumns[targetColumn].tasks.push({
        id: taskId,
        ...newTask,
        completed: false
      });
    }

    setColumns(newColumns);
    closeModal();
  };

  const deleteTask = (columnId, taskId) => {
    const newColumns = { ...columns };
    newColumns[columnId].tasks = newColumns[columnId].tasks.filter(task => task.id !== taskId);
    setColumns(newColumns);
  };

  const toggleComplete = (columnId, taskId) => {
    const newColumns = { ...columns };
    let movedTask = null;
    newColumns[columnId].tasks = newColumns[columnId].tasks.filter(task => {
      if (task.id === taskId) {
        movedTask = { ...task, completed: !task.completed };
        return false;
      }
      return true;
    });
    if (movedTask) {
      if (movedTask.completed) {
        newColumns.done.tasks.push(movedTask);
      } else {
        newColumns.todo.tasks.push(movedTask);
      }
    }
    setColumns(newColumns);
  };

  const resetBoard = () => {
    if (!window.confirm('Reset the board to default demo data? This will overwrite current tasks.')) return;
    setColumns(defaultColumns);
    localStorage.removeItem(STORAGE_KEY);
  };

  const clearAllTasks = () => {
    if (!window.confirm('Clear all tasks from the board?')) return;
    const cleared = Object.keys(columns).reduce((acc, colId) => {
      acc[colId] = { ...columns[colId], tasks: [] };
      return acc;
    }, {});
    setColumns(cleared);
  }; 

  const getPriorityColor = (priority, completed = false) => {
    if (completed) return 'bg-gray-100 text-gray-400 border-gray-200';
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }; 

  const filteredColumns = Object.keys(columns).reduce((acc, colId) => {
    const col = columns[colId];
    const tasks = col.tasks.filter(task => {
      const matchesQuery = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === 'all' ? true : task.priority === filterPriority;
      return matchesQuery && matchesPriority;
    });
    acc[colId] = { ...col, tasks };
    return acc;
  }, {});

  const getPriorityCounts = (col) => {
    const counts = { high: 0, medium: 0, low: 0 };
    col.tasks.forEach(t => {
      if (t.priority in counts) counts[t.priority] += 1;
    });
    return counts;
  };

  const renderColumns = () => {
    return Object.keys(filteredColumns).map(colId => {
      const column = filteredColumns[colId];
      const counts = getPriorityCounts(columns[colId]);
      return (
        <div
          key={column.id}
          className="bg-white rounded-xl shadow-lg p-6 min-h-[500px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{column.title}</h2>
              <p className="text-sm text-gray-500">{column.tasks.length} tasks</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="px-2 py-1 rounded-full border bg-red-50 text-red-700">H: {counts.high}</span>
                <span className="px-2 py-1 rounded-full border bg-yellow-50 text-yellow-700">M: {counts.medium}</span>
                <span className="px-2 py-1 rounded-full border bg-green-50 text-green-700">L: {counts.low}</span>
              </div>
            </div>
            <button
              onClick={() => openModal(column.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {column.tasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task, column.id)}
                className={`bg-gray-50 border-2 border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow group ${task.completed ? 'opacity-60 line-through' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <GripVertical className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleComplete(column.id, task.id)}
                      className={`p-1 rounded ${task.completed ? 'text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => openModal(column.id, task)}
                      className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteTask(column.id, task.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs px-3 py-1 rounded-full border ${getPriorityColor(task.priority, task.completed)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>
              </div>
            ))}

            {column.tasks.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No tasks yet</p>
                <p className="text-xs mt-1">Click + to add a task</p>
              </div>
            )}
          </div>
        </div>
      );
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Task Management Board (Mini Trello)</h1>
            <p className="text-gray-600">Organize your workflow with drag & drop simplicity</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">
              <Search className="text-gray-400" size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="border-0 outline-none text-sm"
              />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="ml-2 text-sm bg-white outline-none"
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <button onClick={clearAllTasks} title="Clear all tasks" className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg">
              Clear
            </button>
            <button onClick={resetBoard} title="Reset demo data" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg flex items-center gap-2">
              <RefreshCw size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderColumns()}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                  rows="3"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                disabled={!newTask.title.trim()}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={20} />
                {editingTask ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;