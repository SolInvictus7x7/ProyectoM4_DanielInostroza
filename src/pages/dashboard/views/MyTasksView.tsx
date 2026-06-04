import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../services/auth';
import { TaskCard } from '../components';
import type { Group, Task, UserProfile } from '../../../types';

interface GroupedTasks {
  groupData: Group;
  tasks: Task[];
}

function MyTasksView() {
  const { user } = useAuth();
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMyTasks = async () => {
      try {
        // 1. Fetch user's groups
        const groupsQ = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
        const groupsSnap = await getDocs(groupsQ);

        if (groupsSnap.empty) {
          return;
        }

        const groupsData = groupsSnap.docs.map(d => d.data() as Group);
        const groupIds = groupsData.map(g => g.gid);

        // Dictionary for easy group lookup
        const groupDict = groupsData.reduce((acc, g) => {
          acc[g.gid] = g;
          return acc;
        }, {} as Record<string, Group>);

        // 2. Fetch tasks for all those groups (Firestore 'in' limit is 30)
        const chunkedGroupIds = groupIds.slice(0, 30);
        const tasksQ = query(collection(db, 'tasks'), where('assigned-to', 'in', chunkedGroupIds));
        const tasksSnap = await getDocs(tasksQ);
        const allTasks = tasksSnap.docs.map(d => d.data() as Task);

        // 3. Filter tasks assigned to this specific user (or whole group)
        const myTasks = allTasks.filter(t =>
          t.members.length === 0 || t.members.includes(user.uid)
        );

        // 4. Group by Group ID
        const groupedMap: Record<string, Task[]> = {};
        myTasks.forEach(task => {
          if (!groupedMap[task['assigned-to']]) {
            groupedMap[task['assigned-to']] = [];
          }
          groupedMap[task['assigned-to']].push(task);
        });

        const formattedGrouping: GroupedTasks[] = Object.keys(groupedMap).map(gid => ({
          groupData: groupDict[gid],
          tasks: groupedMap[gid],
        }));

        // 5. Fetch member profiles for the groups the user belongs to (BUG-10).
        //    Query only the relevant UIDs instead of the whole users collection.
        const uniqueMemberUids = [
          ...new Set(groupsData.flatMap(g => g.members)),
        ];
        const membersQ = query(collection(db, 'users'), where('uid', 'in', uniqueMemberUids));
        const membersSnap = await getDocs(membersQ);
        setMemberProfiles(membersSnap.docs.map(d => d.data() as UserProfile));

        setGroupedTasks(formattedGrouping);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [user]);

  const handleToggleTaskComplete = async (tid: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', tid), { complete: !current });
      setGroupedTasks(prev => prev.map(group => ({
        ...group,
        tasks: group.tasks.map(t => t.tid === tid ? { ...t, complete: !current } : t)
      })));
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const handleUpdateTask = async (tid: string, updates: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'tasks', tid), updates);
      setGroupedTasks(prev => prev.map(group => ({
        ...group,
        tasks: group.tasks.map(t => t.tid === tid ? { ...t, ...updates } : t)
      })));
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Error al actualizar la tarea. ¿Eres administrador?");
    }
  };

  const handleDeleteTask = async (tid: string, gid: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', tid));

      // Remove from the local state
      setGroupedTasks(prev => prev.map(group => ({
        ...group,
        tasks: group.tasks.filter(t => t.tid !== tid)
      })));

      // Clean up the tasks array in the group document
      await updateDoc(doc(db, 'groups', gid), {
        tasks: arrayRemove(tid)
      });
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Error al eliminar la tarea. ¿Eres administrador?");
    }
  };

  if (loading) return <div className="dashboard-subview"><span className="page-spinner" /></div>;

  return (
    <div className="dashboard-subview my-tasks-view">
      <div className="view-header">
        <h2>Mis Tareas</h2>
      </div>

      {groupedTasks.length === 0 ? (
        <div className="empty-state card">
          <p>No tienes tareas asignadas en este momento.</p>
        </div>
      ) : (
        <div className="grouped-tasks-container">
          {groupedTasks.map(({ groupData, tasks }) => {
            const isAdmin = groupData['admin-uid'].includes(user!.uid);

            // Filter member profiles to only those in THIS group for the edit dropdown
            const thisGroupProfiles = memberProfiles.filter(m => groupData.members.includes(m.uid));

            return (
              <section key={groupData.gid} className="task-group-section">
                <h3 className="task-group-title">{groupData.title}</h3>
                <div className="tasks-list">
                  {tasks.map(t => (
                    <TaskCard
                      key={t.tid}
                      task={t}
                      groupMembers={thisGroupProfiles}
                      isAdmin={isAdmin}
                      onToggleComplete={handleToggleTaskComplete}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={() => handleDeleteTask(t.tid, groupData.gid)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyTasksView;
