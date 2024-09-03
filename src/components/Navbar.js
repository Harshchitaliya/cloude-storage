import React from 'react';

const NavBar = () => {
  return (
    <>
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <a className="navbar-brand" href="/">MyApp</a>
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
              <a className="nav-link active" aria-current="page" href="/">Home</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/photo">Photo</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/video">Video</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/delete">Delete</a>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="/profile">Profile</a>
            </li>
          </ul>
        </div>
      </div>
        <div className="htmlhtmlForm-check htmlForm-switch">
            <input className="htmlForm-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault"/>
            <label className="htmlForm-check-label" htmlFor="flexSwitchCheckDefault">Default switch checkbox input</label>
        </div>
    </nav>

  </>
  );
};

export default NavBar;
