import React, { useState } from 'react';
import { Timestamp, doc, collection, setDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { Task, UserProfile, Group } from '../../../types';
import TaskCard from './TaskCard';

interface GroupTasksProps {
  gid: string;
  group: Group;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  memberProfiles: UserProfile[];
  isAdmin: boolean;
  userUid: string;
}

function GroupTasks({ gid, group, tasks, setTasks, memberProfiles, isAdmin, userUid }: GroupTasksProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskMembers, setNewTaskMembers] = useState<string[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gid || !userUid || !newTaskTitle.trim() || !group) return;

    setCreatingTask(true);
    try {
      const taskRef = doc(collection(db, 'tasks'));
      const newTask: Task = {
        tid: taskRef.id,
        'assigned-to': gid,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        complete: false,
        'created-at': Timestamp.now(),
        members: newTaskMembers
      };

      await setDoc(taskRef, newTask);
      await updateDoc(doc(db, 'groups', gid), {
        tasks: arrayUnion(taskRef.id)
      });

      setTasks(prev => [...prev, newTask]);
      
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskMembers([]);
      setShowCreateTask(false);
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Error al crear la tarea. ¿Eres administrador de este grupo?");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTaskComplete = async (tid: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', tid), { complete: !current });
      setTasks(prev => prev.map(t => t.tid === tid ? { ...t, complete: !current } : t));
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const handleUpdateTask = async (tid: string, updates: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'tasks', tid), updates);
      setTasks(prev => prev.map(t => t.tid === tid ? { ...t, ...updates } : t));
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Error al actualizar la tarea. ¿Eres administrador?");
    }
  };

  const handleDeleteTask = async (tid: string) => {
    if (!gid) return;
    try {
      await deleteDoc(doc(db, 'tasks', tid));
      setTasks(prev => prev.filter(t => t.tid !== tid));
      
      await updateDoc(doc(db, 'groups', gid), {
        tasks: arrayRemove(tid)
      });
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Error al eliminar la tarea. ¿Eres administrador?");
    }
  };

  return (
    <section className="group-tasks-col">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Tareas del Grupo</h3>
        {isAdmin && !showCreateTask && (
          <button className="btn-primary" onClick={() => setShowCreateTask(true)}>
            + Nueva Tarea
          </button>
        )}
      </div>
      
      {isAdmin && showCreateTask && (
        <div className="create-task-wrapper card">
          <h4 style={{ margin: '0 0 1rem 0' }}>Crear Tarea</h4>
          <form className="create-task-form" onSubmit={handleCreateTask}>
            <input 
              type="text" 
              placeholder="Título de la tarea" 
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              disabled={creatingTask}
              required
            />
            
            <textarea 
              placeholder="Descripción (opcional, máx 300 caracteres)" 
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
              disabled={creatingTask}
              maxLength={300}
            />

            <select 
              value=""
              onChange={(e) => {
                const selectedUid = e.target.value;
                if (selectedUid && !newTaskMembers.includes(selectedUid)) {
                  setNewTaskMembers([...newTaskMembers, selectedUid]);
                }
              }}
              disabled={creatingTask}
            >
              <option value="" disabled>+ Asignar Miembro (Opcional)</option>
              {memberProfiles
                .filter(m => !newTaskMembers.includes(m.uid))
                .map(m => (
                  <option key={m.uid} value={m.uid}>{m.username}</option>
              ))}
            </select>

            {newTaskMembers.length > 0 && (
              <div className="task-members" style={{ margin: '0', padding: '0.5rem 0' }}>
                {newTaskMembers.map(uid => {
                  const u = memberProfiles.find(m => m.uid === uid);
                  return (
                    <span key={uid} className="task-member-tag">
                      {u?.username}
                      <button type="button" onClick={() => setNewTaskMembers(newTaskMembers.filter(id => id !== uid))}>×</button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowCreateTask(false)} disabled={creatingTask}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={creatingTask || !newTaskTitle.trim()}>
                {creatingTask ? 'Creando...' : 'Guardar Tarea'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tasks-list">
        {tasks.length === 0 && !showCreateTask ? (
          <p className="empty-text">No hay tareas en este grupo.</p>
        ) : (
          tasks.map(t => (
            <TaskCard 
              key={t.tid} 
              task={t} 
              groupMembers={memberProfiles}
              isAdmin={isAdmin}
              onToggleComplete={handleToggleTaskComplete}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default GroupTasks;
