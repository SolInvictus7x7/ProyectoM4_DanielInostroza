import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from '../pages/home/home';
import Dashboard from '../pages/dashboard/dashboard';
import About from '../pages/about/about';
import { ProtectedRoute } from '../components';
import ProfileView from '../pages/dashboard/views/ProfileView';
import GroupsListView from '../pages/dashboard/views/GroupsListView';
import GroupDetailView from '../pages/dashboard/views/GroupDetailView';
import MyTasksView from '../pages/dashboard/views/MyTasksView';

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
