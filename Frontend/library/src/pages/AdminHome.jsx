function admindashboard() {
  return (
    <div>
      <h1>📊 Admin Dashboard</h1>
      <p>Welcome to the admin control panel.</p>

      <div className="dashboard-cards">
  <div className="dashboard-card">
    <h3>Total Books</h3>
    <p>10</p>
  </div>

  <div className="dashboard-card">
    <h3>Total Users</h3>
    <p>5</p>
  </div>
</div>
    </div>
  );
}

export default admindashboard;