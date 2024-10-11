import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginForm from './components/login';
import HomePage from './components/home';
import Profile from './components/profile';
import Delete_item from './components/delete';
import NavBar from './components/Navbar';
import SignupForm from './components/signup';
import Logout from './components/logout';
import Gallery from './components/gallery';
import Product from './components/product';
import MediaModule from './components/all';
import PhotoModule from './components/photo';
import VideoModule from './components/video';
import { AuthProvider } from './contex/theam';


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
      path: "/Gallery",
      element: <><NavBar /><Gallery /></>,
      children: [
        {
          index: true,  // This will match /Gallary and redirect to /Gallary/All
          element: <Navigate to="/Gallery/All" />
        },
        {
          path: "All",  // Route for /Gallary/All
          element: (
            <>
          <MediaModule/>
            </>
          )
        },
        {
          path: "Photo",  // Route for /Gallary/Photo
          element: <PhotoModule />
        },
        {
          path: "Video",  // Route for /Gallary/Video
          element: <VideoModule />
        }
      ]
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
    
    <AuthProvider> {/* Wrap the router with AuthProvider */}
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
