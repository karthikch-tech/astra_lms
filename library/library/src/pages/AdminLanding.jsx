import "./Landing.css";

function AdminLanding() {
  const handleClick = () => {
    window.location.href = "/admin/login";
  };

  return (
    <div className="landing-container">
      <div className="landing-logo">ASTRA ADMIN</div>

      <div className="landing-content">
        <h1>
          ADMIN PANEL
          <br />
          <span className="highlight">Manage Your Library</span>
        </h1>

        <p>
          Control books, manage copies, update records and monitor
          the entire library system from one place.
        </p>

        <button className="landing-btn" onClick={handleClick}>
          Get Started →
        </button>
      </div>
    </div>
  );
}

export default AdminLanding;