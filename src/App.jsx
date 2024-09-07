import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginForm from './components/login';
import HomePage from './components/home';
import Video from './components/video';
import Photo from './components/photo';
import Profile from './components/profile';
import Delete_item from './components/delete';
import NavBar from './components/Navbar';
import SignupForm from './components/signup';

function App() {
  const router = createBrowserRouter([
    {
      path: "/login",
      element: <LoginForm />
    },
    {
      path: "/",
      element: <><NavBar /><HomePage /></>
    },
    {
      path: "/Photo",
      element: <><NavBar /><Photo /></>
    },
    {
      path: "/Video",
      element: <><NavBar /><Video /></>
    },
    {
      path: "/Delete",
      element: <><NavBar /><Delete_item /></>
    },
    {
      path: "/Profile",
      element: <><NavBar /><Profile /></>
    },
    {
      path: "/sign-up",
      element: <><NavBar /><SignupForm /></>
    },
  ]);

  return (
    <RouterProvider router={router} />
  );
}

export default App;
