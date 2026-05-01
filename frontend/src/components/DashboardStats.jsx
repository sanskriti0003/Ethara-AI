import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#4f46e5", "#f59e0b", "#10b981"];

const DashboardStats = ({ stats }) => {
  const statusData = Object.entries(stats.tasksByStatus || {}).map(([name, value]) => ({ name, value }));
  const userData = Object.entries(stats.tasksPerUser || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="dashboard-grid">
      <div className="card">
        <h3>Total Tasks</h3>
        <p className="metric">{stats.totalTasks || 0}</p>
      </div>
      <div className="card">
        <h3>Overdue Tasks</h3>
        <p className="metric overdue">{stats.overdueTasks || 0}</p>
      </div>
      <div className="card chart-card">
        <h3>Tasks by Status</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusData} dataKey="value" outerRadius={70}>
              {statusData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3>Tasks per User</h3>
        {userData.length === 0 ? (
          <p className="muted">No task data yet</p>
        ) : (
          <ul>
            {userData.map((item) => (
              <li key={item.name}>
                {item.name}: {item.value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardStats;
