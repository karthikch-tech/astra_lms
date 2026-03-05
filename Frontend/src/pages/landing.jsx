import React from "react";
import "./landing.css";

function Landing() {
  const handleClick = () => {
  window.location.href = "/login";
};

  return (
    <div className="landing-container">
      <div className="landing-logo">ASTRA</div>

      <div className="landing-content">
        <h1>
          FIND YOUR
          <br />
          <span className="highlight">Book from Anywhere.</span>
        </h1>

        <p>
          Discover a world of knowledge at your fingertips. Access books
          seamlessly anytime, anywhere with ASTRA Library Management System.
        </p>

        <button className="landing-btn" onClick={handleClick}>
          Get Started →
        </button>
      </div>
    </div>
  );
}

export default Landing;
