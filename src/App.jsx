import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginForm from './components/login';
import HomePage from './components/home';
import Profile from './components/profile';
import Delete_item from './components/delete';
import NavBar from './components/Navbar';
import SignupForm from './components/signup';
import Logout from './components/logout';
import Gallary from './components/gallary';
import Product from './components/product';


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
      path: "/Gallary",
      element: <><NavBar /><Gallary /></>
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
      element: <><SignupForm /></>
    },
    {
      path: "/Logout",
      element: <><NavBar /><Logout /></>
    },
    {
      path: "/Product",
      element: <><NavBar /><Product /></>
    },
  ]);

  return (
    <RouterProvider router={router} />
  );
}

export default App;
