import React from 'react';
import { Link } from 'react-router-dom';
import '../css/navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faTrash, faSignOutAlt, faHouse, faGift } from '@fortawesome/free-solid-svg-icons'; // Import all icons
import { faStream } from '@fortawesome/free-solid-svg-icons'; // Import the stream icon for the gallery

const NavBar = () => {
  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#474768' }}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          {/* Add the home icon before the text */}
          <FontAwesomeIcon icon={faHouse} style={{ marginRight: '8px' }} />
          Home
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/Product">
                {/* Add the gift icon before the text */}
                <FontAwesomeIcon icon={faGift} style={{ marginRight: '8px' }} />
                Product
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Gallery">
                {/* Add the stream icon before the text */}
                <FontAwesomeIcon icon={faStream} style={{ marginRight: '8px' }} />
                Gallery
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Delete">
                {/* Add the trash icon before the text */}
                <FontAwesomeIcon icon={faTrash} style={{ marginRight: '8px' }} />
                Delete
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Logout">
                {/* Add the logout icon before the text */}
                <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '8px' }} />
                Logout
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/Profile">
                {/* Add the profile icon before the text */}
                <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '8px' }} />
                Profile
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
