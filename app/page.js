// app/page.js
'use client'; // Required for hooks and event handlers

import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase'; // Adjust path if needed
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot, // For real-time updates
  serverTimestamp // To record creation time
} from 'firebase/firestore';

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state

  // Firestore collection reference
  const tasksCollectionRef = collection(db, 'tasks');

  // Fetch tasks initially and listen for real-time updates
  useEffect(() => {
    setLoading(true);
    // Query to order tasks by creation time
    const q = query(tasksCollectionRef, orderBy('createdAt', 'desc'));

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ ...doc.data(), id: doc.id });
      });
      setTasks(tasksData);
      setLoading(false); // Set loading to false after data is fetched
    }, (error) => {
      console.error("Error fetching tasks: ", error);
      setLoading(false); // Also stop loading on error
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Add a new task
  const addTask = async (e) => {
    e.preventDefault(); // Prevent form submission reload
    if (newTask.trim() === '') {
      alert('Please enter a task');
      return;
    }
    try {
      await addDoc(tasksCollectionRef, {
        text: newTask,
        completed: false,
        createdAt: serverTimestamp() // Use server timestamp
      });
      setNewTask(''); // Clear the input field
    } catch (error) {
      console.error("Error adding task: ", error);
      alert('Failed to add task.');
    }
  };

  // Toggle task completion status
  const toggleComplete = async (task) => {
    const taskDocRef = doc(db, 'tasks', task.id);
    try {
      await updateDoc(taskDocRef, {
        completed: !task.completed
      });
      // No need to manually update state, onSnapshot handles it
    } catch (error) {
      console.error("Error updating task: ", error);
      alert('Failed to update task.');
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    const taskDocRef = doc(db, 'tasks', id);
    if (window.confirm("Are you sure you want to delete this task?")) {
       try {
        await deleteDoc(taskDocRef);
        // No need to manually update state, onSnapshot handles it
      } catch (error) {
        console.error("Error deleting task: ", error);
        alert('Failed to delete task.');
      }
    }
  };

  // Basic Styling (can be moved to a CSS module)
  const styles = {
    container: { fontFamily: 'sans-serif', maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px' },
    heading: { textAlign: 'center', color: '#333' },
    form: { display: 'flex', marginBottom: '20px' },
    input: { flexGrow: 1, padding: '10px', border: '1px solid #ccc', marginRight: '10px' },
    button: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' },
    taskList: { listStyle: 'none', padding: 0 },
    taskItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' },
    taskTextCompleted: { textDecoration: 'line-through', color: '#aaa' },
    taskActions: { display: 'flex', alignItems: 'center' },
    checkbox: { marginRight: '10px', cursor: 'pointer', transform: 'scale(1.2)'},
    deleteButton: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', marginLeft: '10px', borderRadius: '4px' },
    loadingText: { textAlign: 'center', color: '#888'}
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Simple Task Manager</h1>

      <form onSubmit={addTask} style={styles.form}>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task"
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Add Task</button>
      </form>

      {loading ? (
          <p style={styles.loadingText}>Loading tasks...</p>
      ) : (
        <ul style={styles.taskList}>
          {tasks.length === 0 ? (
            <p style={styles.loadingText}>No tasks yet!</p>
          ) : (
             tasks.map((task) => (
              <li key={task.id} style={styles.taskItem}>
                <div style={styles.taskActions}>
                   <input
                     type="checkbox"
                     checked={task.completed}
                     onChange={() => toggleComplete(task)}
                     style={styles.checkbox}
                    />
                  <span style={task.completed ? styles.taskTextCompleted : {}}>
                    {task.text}
                  </span>
                </div>
                <button onClick={() => deleteTask(task.id)} style={styles.deleteButton}>
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
       )}
    </div>
  );
}