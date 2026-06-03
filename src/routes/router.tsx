import { createBrowserRouter } from 'react-router-dom';
import { Home, Dashboard, About } from '../index';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';

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
    },
    {
        path: '/about',
        element: <About />,
    },
]);

export default router;
