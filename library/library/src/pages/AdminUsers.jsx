import { useState } from "react";

function AdminUsers() {
  const [users] = useState([
    { id: 1, username: "Akhil", email: "akhil@gmail.com" },
    { id: 2, username: "User2", email: "user2@gmail.com" }
  ]);

  return (
    <div>
      <h2>Total Users</h2>
      <table className="admin-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Akhil</td>
      <td>akhil@gmail.com</td>
    </tr>
  </tbody>
</table>

      {users.map(user => (
        <div key={user.id} className="admin-card">
          <p>Name: {user.username}</p>
          <p>Email: {user.email}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminUsers;