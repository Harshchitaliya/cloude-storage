import React from 'react';
import { Link } from 'react-router-dom';
import '../css/navbar.css'
const NavBar = () => {
  return (
    <nav className="navbar navbar-expand-lg " style={{ backgroundColor: '#474768' }}>
      <div className="container-fluid">
        {/* Updated "MyApp" to "Home" */}
        <Link className="navbar-brand" to="/">Home</Link>
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
              <Link className="nav-link" to="/Product">product</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Gallery">Gallery</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Delete">Delete</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Logout">Logout</Link>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/Profile">Profile</Link>
            </li>
          </ul>
          
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
