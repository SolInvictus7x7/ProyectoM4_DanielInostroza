import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../services/auth';
import { GroupTasks, GroupSidebar } from '../components';
import type { Group, Task, UserProfile } from '../../../types';

function GroupDetailView() {
  const { gid } = useParams<{ gid: string }>();
  const { user } = useAuth();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="dashboard-subview"><span className="page-spinner" /></div>;
  if (!group || !user) return <div className="dashboard-subview"><p>Grupo no encontrado o sin acceso.</p></div>;

  const isAdmin = group['admin-uid'].includes(user.uid);

  return (
    <div className="dashboard-subview group-detail-view">
      <div className="view-header">
        <div className="breadcrumb">
          <Link to="/dashboard/groups">← Volver a grupos</Link>
        </div>
        <h2>{group.title}</h2>
      </div>

      <div className="group-layout">
        <GroupTasks 
          gid={gid!}
          group={group}
          tasks={tasks}
          setTasks={setTasks}
          memberProfiles={memberProfiles}
          isAdmin={isAdmin}
          userUid={user.uid}
        />

        <GroupSidebar 
          gid={gid!}
          group={group}
          setGroup={setGroup}
          memberProfiles={memberProfiles}
          setMemberProfiles={setMemberProfiles}
          tasks={tasks}
          isAdmin={isAdmin}
          userUid={user.uid}
          userEmail={user.email || undefined}
        />
      </div>
    </div>
  );
}

export default GroupDetailView;
