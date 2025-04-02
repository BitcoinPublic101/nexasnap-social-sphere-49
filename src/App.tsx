import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import Explore from './pages/Explore';
import Popular from './pages/Popular';
import Following from './pages/Following';
import Trending from './pages/Trending';
import Latest from './pages/Latest';
import PostDetails from './pages/PostDetails';
import SquadPage from './pages/SquadPage';
import UserProfilePage from './pages/UserProfilePage';
import BotManagement from './pages/BotManagement';

const App = () => {
  return (
    <RouterProvider
      router={createBrowserRouter([
        {
          path: '/',
          element: <Index />,
        },
        {
          path: '/login',
          element: <Login />,
        },
        {
          path: '/signup',
          element: <SignUp />,
        },
        {
          path: '/explore',
          element: <Explore />,
        },
        {
          path: '/popular',
          element: <Popular />,
        },
        {
          path: '/following',
          element: <Following />,
        },
        {
          path: '/trending',
          element: <Trending />,
        },
        {
          path: '/latest',
          element: <Latest />,
        },
        {
          path: '/post/:postId',
          element: <PostDetails />,
        },
        {
          path: '/r/:squadName',
          element: <SquadPage />,
        },
        {
          path: '/u/:username',
          element: <UserProfilePage />,
        },
        {
          path: '/admin/bots',
          element: <BotManagement />,
        },
        {
          path: '*',
          element: <NotFound />,
        },
      ])}
    />
  );
};

export default App;
