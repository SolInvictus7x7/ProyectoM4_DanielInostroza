import type { UserProfile } from '../../../types';

interface TaskEditFormProps {
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDesc: string;
  setEditDesc: (val: string) => void;
  editMembers: string[];
  setEditMembers: (val: string[]) => void;
  groupMembers: UserProfile[];
  onSave: () => void;
  onCancel: () => void;
  onDeleteTask?: () => void;
}

function TaskEditForm({
  editTitle,
  setEditTitle,
  editDesc,
  setEditDesc,
  editMembers,
  setEditMembers,
  groupMembers,
  onSave,
  onCancel,
  onDeleteTask
}: TaskEditFormProps) {
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
                if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                  onDeleteTask();
                }
              }}
            >
              Eliminar
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" disabled={!editTitle.trim()} onClick={onSave}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskEditForm;
