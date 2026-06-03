import { createBrowserRouter } from 'react-router-dom';
import { Home, Dashboard, About } from '../index';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

import ProfileView from '../pages/dashboard/views/ProfileView';
import GroupsListView from '../pages/dashboard/views/GroupsListView';
import GroupDetailView from '../pages/dashboard/views/GroupDetailView';
import MyTasksView from '../pages/dashboard/views/MyTasksView';
import { Navigate } from 'react-router-dom';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="groups" replace /> },
            { path: 'profile', element: <ProfileView /> },
            { path: 'groups', element: <GroupsListView /> },
            { path: 'groups/:gid', element: <GroupDetailView /> },
            { path: 'tasks', element: <MyTasksView /> },
        ]
    },
    {
        path: '/about',
        element: <About />,
    },
]);

export default router;
