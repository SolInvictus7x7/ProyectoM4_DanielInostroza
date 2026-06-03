import { createBrowserRouter } from 'react-router-dom';
import { Home, Dashboard, About } from '../index';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/dashboard',
        element: <Dashboard />,
    },
    {
        path: '/about',
        element: <About />,
    },
]);

export default router;
