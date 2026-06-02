import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/home/home';
import Dashboard from '../pages/dashboard/dashboard';
import About from '../pages/about/about';

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
