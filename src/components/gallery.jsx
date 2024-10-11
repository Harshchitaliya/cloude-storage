import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faImage, faVideo } from '@fortawesome/free-solid-svg-icons'; // Updated icon import
import "../css/gallery.css"; // Ensure the CSS path is correct

const Gallery = () => {
  return (
    <div className="full-width-container">
      <h1>Gallery</h1>
      <nav>
        <div className="nav nav-tabs">
          {/* Changing faThLarge to faFolder for the "All" section */}
          <NavLink
            to="/Gallery/All"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FontAwesomeIcon 
              icon={faFolder} 
              style={{ marginRight: '8px' }} // Black color for icon
            />
            All
          </NavLink>
          <NavLink
            to="/Gallery/Photo"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {/* Keep the faImage icon for the "Image" section */}
            <FontAwesomeIcon 
              icon={faImage} 
              style={{ marginRight: '8px' }} // Black color for icon
            />
            Image
          </NavLink>
          <NavLink
            to="/Gallery/Video"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {/* Add faVideo icon for the "Video" section */}
            <FontAwesomeIcon 
              icon={faVideo} 
              style={{ marginRight: '8px' }} // Black color for icon
            />
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

export default Gallery;
