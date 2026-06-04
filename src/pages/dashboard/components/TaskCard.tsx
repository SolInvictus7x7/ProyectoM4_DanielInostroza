import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  username: string;
}

interface Task {
  tid: string;
  title: string;
  description: string;
  complete: boolean;
  'created-at': Timestamp;
  'assigned-to': string;
  members: string[]; 
}

interface TaskCardProps {
  task: Task;
  groupMembers: UserProfile[];
  isAdmin: boolean;
  onToggleComplete: (tid: string, current: boolean) => void;
  onUpdateTask: (tid: string, updates: Partial<Task>) => void;
  onDeleteTask?: (tid: string) => void;
}

function TaskCard({ task, groupMembers, isAdmin, onToggleComplete, onUpdateTask, onDeleteTask }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editMembers, setEditMembers] = useState<string[]>(task.members);

  const dateStr = task['created-at'] ? task['created-at'].toDate().toLocaleDateString() : '';
  
  const description = task.description?.length > 300 
    ? task.description.substring(0, 300) + '...' 
    : task.description;

  const assignedProfiles = task.members.map(uid => groupMembers.find(m => m.uid === uid)).filter(Boolean) as UserProfile[];

  const handleSave = () => {
    onUpdateTask(task.tid, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      members: editMembers
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditMembers(task.members);
    setIsEditing(false);
  };

  if (isEditing && isAdmin) {
    return (
      <div className="card task-card">
        <div className="create-task-form" style={{ marginTop: 0, padding: 0, boxShadow: 'none', border: 'none' }}>
          <input 
            type="text" 
            placeholder="Título de la tarea" 
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            required
          />
          
          <textarea 
            placeholder="Descripción (opcional, máx 300 caracteres)" 
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            maxLength={300}
          />

          <select 
            value=""
            onChange={(e) => {
              const selectedUid = e.target.value;
              if (selectedUid && !editMembers.includes(selectedUid)) {
                setEditMembers([...editMembers, selectedUid]);
              }
            }}
          >
            <option value="" disabled>+ Asignar Miembro (Opcional)</option>
            {groupMembers
              .filter(m => !editMembers.includes(m.uid))
              .map(m => (
                <option key={m.uid} value={m.uid}>{m.username}</option>
            ))}
          </select>

          {editMembers.length > 0 && (
            <div className="task-members" style={{ margin: '0', padding: '0.5rem 0' }}>
              {editMembers.map(uid => {
                const user = groupMembers.find(m => m.uid === uid);
                return (
                  <span key={uid} className="task-member-tag">
                    {user?.username}
                    <button type="button" onClick={() => setEditMembers(editMembers.filter(id => id !== uid))}>×</button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="form-actions" style={{ justifyContent: 'space-between' }}>
            {onDeleteTask ? (
              <button 
                type="button" 
                className="btn-danger" 
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                    onDeleteTask(task.tid);
                  }
                }}
              >
                Eliminar
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" disabled={!editTitle.trim()} onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card task-card">
      <div className="task-card-header">
        <input 
          type="checkbox" 
          checked={task.complete} 
          onChange={() => onToggleComplete(task.tid, task.complete)} 
        />
        <div className="task-card-title-area">
          <h4 className={task.complete ? 'completed' : ''}>{task.title}</h4>
          <span className="task-date">Creado: {dateStr}</span>
        </div>
        
        {isAdmin && (
          <button 
            className="btn-edit-task" 
            onClick={() => setIsEditing(true)}
            aria-label="Editar Tarea"
            title="Editar Tarea"
          >
            ✎
          </button>
        )}
      </div>
      
      {description && (
        <p className="task-description">{description}</p>
      )}

      <div className="task-members">
        {assignedProfiles.length === 0 ? (
          <span className="task-member-tag">Todos (Everyone)</span>
        ) : (
          assignedProfiles.map(m => (
            <span key={m.uid} className="task-member-tag">
              {m.username || 'Unknown'}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskCard;
