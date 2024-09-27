import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const Gallary = () => {
  return (
    <div className="container">
      <h1>Gallery</h1>
      <nav>
        <div className="nav nav-tabs">
          {/* Update navigation to use NavLink to the respective routes */}
          <NavLink
            to="/Gallary/All"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            All
          </NavLink>
          <NavLink
            to="/Gallary/Photo"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Image
          </NavLink>
          <NavLink
            to="/Gallary/Video"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Video
          </NavLink>
        </div>
      </nav>

      {/* This is where the child routes (all, photo, video) will be rendered */}
      <div className="tab-content mt-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Gallary;
