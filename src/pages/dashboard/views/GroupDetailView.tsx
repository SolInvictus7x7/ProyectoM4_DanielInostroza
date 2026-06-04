import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove, Timestamp, deleteDoc
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../services/auth';
import TaskCard from '../components/TaskCard';

interface Group {
  gid: string;
  title: string;
  'admin-uid': string[];
  members: string[];
  tasks: string[];
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

interface UserProfile {
  uid: string;
  username: string;
  email?: string;
}

function GroupDetailView() {
  const { gid } = useParams<{ gid: string }>();
  const { user } = useAuth();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Task creation form state
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskMembers, setNewTaskMembers] = useState<string[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);

  // Invite member state
  const [newMemberName, setNewMemberName] = useState('');
  const [inviting, setInviting] = useState(false);

  // Email state
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    if (user && !selectedEmail) {
      setSelectedEmail(user.email || '');
    }
    
    if (user) {
      const lastSent = localStorage.getItem(`email_cooldown_${user.uid}`);
      if (lastSent) {
        const elapsed = Date.now() - parseInt(lastSent, 10);
        const remaining = 5 * 60 * 1000 - elapsed;
        if (remaining > 0) {
          setCooldownRemaining(Math.ceil(remaining / 1000));
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  useEffect(() => {
    if (!gid || !user) return;

    const fetchData = async () => {
      try {
        const groupRef = doc(db, 'groups', gid);
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) return;
        const groupData = groupSnap.data() as Group;
        setGroup(groupData);

        const tasksQ = query(collection(db, 'tasks'), where('assigned-to', '==', gid));
        const tasksSnap = await getDocs(tasksQ);
        setTasks(tasksSnap.docs.map(d => d.data() as Task));

        if (groupData.members.length > 0) {
          const membersQ = query(collection(db, 'users'), where('uid', 'in', groupData.members));
          const membersSnap = await getDocs(membersQ);
          setMemberProfiles(membersSnap.docs.map(d => d.data() as UserProfile));
        }
      } catch (err) {
        console.error("Error fetching group details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gid, user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gid || !user || !newTaskTitle.trim() || !group) return;

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
        members: newTaskMembers // assigned users
      };

      await setDoc(taskRef, newTask);
      await updateDoc(doc(db, 'groups', gid), {
        tasks: arrayUnion(taskRef.id)
      });

      setTasks(prev => [...prev, newTask]);
      
      // Reset form
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

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gid || !user || !newMemberName.trim() || !group) return;

    setInviting(true);
    try {
      // Case-insensitive manual filter for MVP (fetching all users is okay for small scale)
      const usersSnap = await getDocs(collection(db, 'users'));
      const invitedUserDoc = usersSnap.docs.find(d => {
        const data = d.data() as UserProfile;
        return data.username.toLowerCase() === newMemberName.trim().toLowerCase();
      });
      
      if (!invitedUserDoc) {
        alert("Usuario no encontrado.");
        setInviting(false);
        return;
      }

      const invitedUser = invitedUserDoc.data() as UserProfile;

      if (group.members.includes(invitedUser.uid)) {
        alert("El usuario ya está en el grupo.");
        setInviting(false);
        return;
      }

      await updateDoc(doc(db, 'groups', gid), {
        members: arrayUnion(invitedUser.uid)
      });

      setGroup(prev => prev ? { ...prev, members: [...prev.members, invitedUser.uid] } : null);
      setMemberProfiles(prev => [...prev, invitedUser]);
      setNewMemberName('');
      alert("¡Usuario añadido exitosamente!");
    } catch (err) {
      console.error("Error inviting member:", err);
      alert("Error al añadir miembro. ¿Eres administrador?");
    } finally {
      setInviting(false);
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
      
      // Clean up the tasks array in the group document
      await updateDoc(doc(db, 'groups', gid), {
        tasks: arrayRemove(tid)
      });
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Error al eliminar la tarea. ¿Eres administrador?");
    }
  };

  const handleSendEmail = async () => {
    if (!selectedEmail || !group) return;
    
    setSendingEmail(true);
    try {
      const taskSummary = tasks.length === 0 
        ? 'No hay tareas en este grupo actualmente.' 
        : tasks.map(t => `- [${t.complete ? 'X' : ' '}] ${t.title}: ${t.description || 'Sin descripción'}`).join('\n');

      const body = {
        to: selectedEmail,
        summary: `Resumen de Tareas para el Grupo: ${group.title}\n\n${taskSummary}`
      };

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al enviar el correo');
      }

      alert('¡Correo enviado exitosamente!');
      if (user) {
        localStorage.setItem(`email_cooldown_${user.uid}`, Date.now().toString());
      }
      setCooldownRemaining(5 * 60);
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al enviar el correo: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <div className="dashboard-subview"><span className="page-spinner" /></div>;
  if (!group) return <div className="dashboard-subview"><p>Grupo no encontrado o sin acceso.</p></div>;

  const isAdmin = group['admin-uid'].includes(user!.uid);

  return (
    <div className="dashboard-subview group-detail-view">
      <div className="view-header">
        <div className="breadcrumb">
          <Link to="/dashboard/groups">← Volver a grupos</Link>
        </div>
        <h2>{group.title}</h2>
      </div>

      <div className="group-layout">
        {/* Left Column: Tasks */}
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
                      const user = memberProfiles.find(m => m.uid === uid);
                      return (
                        <span key={uid} className="task-member-tag">
                          {user?.username}
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

        {/* Right Column: Members */}
        <aside className="group-members-col">
          <h3 style={{ marginBottom: '1.5rem' }}>Miembros</h3>
          <ul className="members-list card">
            {memberProfiles.map(m => (
              <li key={m.uid}>
                <span className="member-name">{m.username || 'unknown'}</span>
                {group['admin-uid'].includes(m.uid) && <span className="badge-admin">Admin</span>}
              </li>
            ))}
          </ul>

          {isAdmin && (
            <form className="card form-invite" onSubmit={handleInviteMember}>
              <h4>Añadir Miembro</h4>
              <input 
                type="text" 
                placeholder="Nombre de usuario" 
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                disabled={inviting}
              />
              <button className="btn-primary" disabled={inviting || !newMemberName.trim()} style={{ width: '100%', padding: '0.8rem' }}>
                {inviting ? 'Añadiendo...' : 'Añadir'}
              </button>
            </form>
          )}

          {isAdmin && (
            <div className="card form-invite" style={{ marginTop: '1rem' }}>
              <h4>Enviar Resumen de Tareas</h4>
              <select 
                value={selectedEmail} 
                onChange={e => setSelectedEmail(e.target.value)}
                disabled={sendingEmail || cooldownRemaining > 0}
                style={{ width: '100%', padding: '0.8rem', marginBottom: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              >
                {/* Fallback to user email if the user is missing an email in their profile */}
                <option value={user?.email || ''}>Tú ({user?.email})</option>
                {memberProfiles
                  .filter(m => m.uid !== user?.uid && m.email)
                  .map(m => (
                  <option key={m.uid} value={m.email}>{m.username} ({m.email})</option>
                ))}
              </select>
              
              <button 
                className="btn-primary" 
                onClick={handleSendEmail}
                disabled={sendingEmail || cooldownRemaining > 0 || !selectedEmail} 
                style={{ width: '100%', padding: '0.8rem' }}
              >
                {cooldownRemaining > 0 
                  ? `Espera ${Math.floor(cooldownRemaining / 60)}:${(cooldownRemaining % 60).toString().padStart(2, '0')} para reenviar`
                  : sendingEmail ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default GroupDetailView;
