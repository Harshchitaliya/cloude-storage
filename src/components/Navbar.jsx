import React from 'react';
import { Link } from 'react-router-dom';
import '../css/navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faTrash, faSignOutAlt, faHouse, faGift } from '@fortawesome/free-solid-svg-icons'; 
import { faStream } from '@fortawesome/free-solid-svg-icons';

const NavBar = React.memo(() => {
  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#474768' }}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
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
                <FontAwesomeIcon icon={faGift} style={{ marginRight: '8px' }} />
                Product
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Gallery">
                <FontAwesomeIcon icon={faStream} style={{ marginRight: '8px' }} />
                Gallery
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Delete">
                <FontAwesomeIcon icon={faTrash} style={{ marginRight: '8px' }} />
                Recycle Bin
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Logout">
                <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '8px' }} />
                Logout
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/Profile">
                <FontAwesomeIcon icon={faUserCircle} style={{ marginRight: '8px' }} />
                Profile
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
});

export default NavBar;
