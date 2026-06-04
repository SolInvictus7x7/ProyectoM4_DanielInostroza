import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../services/auth';
import type { Group } from '../../../types';

function GroupsListView() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // New group form state
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      const snap = await getDocs(q);
      const fetchedGroups = snap.docs.map(doc => doc.data() as Group);
      setGroups(fetchedGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;

    setCreating(true);
    try {
      // 1. Generate a new document reference with a native ID
      const newGroupRef = doc(collection(db, 'groups'));

      const newGroupData: Group = {
        gid: newGroupRef.id,
        title: newTitle.trim(),
        'admin-uid': [user.uid],
        members: [user.uid],
        tasks: []
      };

      // 2. Save it
      await setDoc(newGroupRef, newGroupData);

      // 3. Update local state
      setGroups(prev => [...prev, newGroupData]);
      setNewTitle('');
      setShowForm(false);
    } catch (err) {
      alert("Error al crear el grupo. Revisa tus permisos.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="dashboard-subview"><span className="page-spinner" /></div>;
  }

  return (
    <div className="dashboard-subview groups-list-view">
      <div className="view-header">
        <h2>Mis Grupos</h2>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Grupo'}
        </button>
      </div>

      {showForm && (
        <form className="create-group-form card" onSubmit={handleCreateGroup}>
          <input
            type="text"
            placeholder="Nombre del grupo..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={creating}
            autoFocus
            required
          />
          <button type="submit" disabled={creating || !newTitle.trim()}>
            {creating ? 'Creando...' : 'Crear'}
          </button>
        </form>
      )}

      {groups.length === 0 && !showForm && (
        <div className="empty-state card">
          <p>No perteneces a ningún grupo todavía.</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="groups-grid">
          {groups.map(g => (
            <Link key={g.gid} to={`/dashboard/groups/${g.gid}`} className="group-card card">
              <h3>{g.title}</h3>
              <p>{g.members.length} miembro(s)</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupsListView;
