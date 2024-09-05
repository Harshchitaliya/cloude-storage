import React from 'react';
import "../css/home.css"
import NavBar from './Navbar';
const HomePage = () => {
  return (
    <>
    <div className="home-container">


       <NavBar/> 


      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Innovating the Future with Mindron</h1>
          <p>Leading the world in technology solutions and innovations.</p>
          <button className="hero-button">Explore More</button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="services">
        <h2>Our Services</h2>
        <div className="features-list">
          <div className="feature-item">
            <i className="fas fa-cloud"></i>
            <h3>Cloud Solutions</h3>
            <p>Cutting-edge cloud computing services for your business.</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-shield-alt"></i>
            <h3>Cyber Security</h3>
            <p>Advanced security solutions to protect your digital assets.</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-robot"></i>
            <h3>AI & Automation</h3>
            <p>Leveraging AI to automate and improve your business processes.</p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about" id="about">
        <h2>About Mindron</h2>
        <p>
          At Mindron, we believe in shaping the future with technology. Our mission is to provide world-class digital solutions, from cloud services to AI-driven automation.
        </p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 Mindron. All rights reserved.</p>
        <div className="social-media">
          <a href="#"><i className="fab fa-facebook"></i></a>
          <a href="#"><i className="fab fa-twitter"></i></a>
          <a href="#"><i className="fab fa-linkedin"></i></a>
        </div>
      </footer>
    </div>
    </>
  );
};

export default HomePage;