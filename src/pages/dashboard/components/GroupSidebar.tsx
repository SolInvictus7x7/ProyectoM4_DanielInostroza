import React, { useState, useEffect } from 'react';
import { doc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { Group, Task, UserProfile } from '../../../types';

interface GroupSidebarProps {
  gid: string;
  group: Group;
  setGroup: React.Dispatch<React.SetStateAction<Group | null>>;
  memberProfiles: UserProfile[];
  setMemberProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  tasks: Task[];
  isAdmin: boolean;
  userUid: string;
  userEmail?: string;
}

function GroupSidebar({
  gid, group, setGroup, memberProfiles, setMemberProfiles, tasks, isAdmin, userUid, userEmail
}: GroupSidebarProps) {
  const [newMemberName, setNewMemberName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string>(userEmail || '');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    if (!selectedEmail && userEmail) {
      setSelectedEmail(userEmail);
    }
    const lastSent = localStorage.getItem(`email_cooldown_${userUid}`);
    if (lastSent) {
      const elapsed = Date.now() - parseInt(lastSent, 10);
      const remaining = 5 * 60 * 1000 - elapsed;
      if (remaining > 0) {
        setCooldownRemaining(Math.ceil(remaining / 1000));
      }
    }
  }, [userUid, userEmail, selectedEmail]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gid || !userUid || !newMemberName.trim() || !group) return;

    setInviting(true);
    try {
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
      localStorage.setItem(`email_cooldown_${userUid}`, Date.now().toString());
      setCooldownRemaining(5 * 60);
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al enviar el correo: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
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
            style={{
              width: '100%',
              padding: '0.8rem',
              marginBottom: '0.5rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          >
            <option value={userEmail || ''}>Tú ({userEmail})</option>
            {memberProfiles
              .filter(m => m.uid !== userUid && m.email)
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
  );
}

export default GroupSidebar;
