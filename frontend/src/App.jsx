import { useEffect, useState } from "react";
import api from "./api";
import AuthForm from "./components/AuthForm";
import DashboardStats from "./components/DashboardStats";
import { useAuth } from "./state/AuthContext";

const App = () => {
  const { user, token, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    assignedTo: "",
  });
  const [loading, setLoading] = useState(false);

  const selectedProjectData = projects.find((project) => project._id === selectedProject);
  const currentMember = selectedProjectData?.members?.find((member) => member.user._id === user?.id || member.user._id === user?._id);
  const isAdmin = currentMember?.role === "Admin";
  const currentUserId = user?.id || user?._id;

  const parseError = (err, fallback) => {
    if (err?.response?.data?.message) return err.response.data.message;
    const firstValidationError = err?.response?.data?.errors?.[0]?.msg;
    if (firstValidationError) return firstValidationError;
    return fallback;
  };

  const loadProjects = async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
    if (!selectedProject && data.length > 0) setSelectedProject(data[0]._id);
  };

  const loadStats = async () => {
    const { data } = await api.get("/dashboard");
    setStats(data);
  };

  const loadTasks = async (projectId) => {
    if (!projectId) return;
    const { data } = await api.get(`/tasks/project/${projectId}`);
    setTasks(data);
  };

  useEffect(() => {
    if (!token) return;
    Promise.all([loadProjects(), loadStats()]).catch((err) => setError(parseError(err, "Failed to load dashboard data")));
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject).catch(() => setError("Failed to load tasks"));
    }
  }, [selectedProject]);

  if (!token) {
    return (
      <main className="container">
        <h1>Team Task Manager</h1>
        <AuthForm />
      </main>
    );
  }

  const refreshAll = async () => {
    await Promise.all([loadProjects(), loadTasks(selectedProject), loadStats()]);
  };

  const createProject = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await api.post("/projects", projectForm);
      setProjectForm({ name: "", description: "" });
      await refreshAll();
    } catch (err) {
      setError(parseError(err, "Project create failed"));
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (event) => {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      setLoading(true);
      setError("");
      await api.post(`/projects/${selectedProject}/members`, { email: memberEmail });
      setMemberEmail("");
      await refreshAll();
    } catch (err) {
      setError(parseError(err, "Member add failed"));
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      setError("");
      await api.delete(`/projects/${selectedProject}/members/${memberId}`);
      await refreshAll();
    } catch (err) {
      setError(parseError(err, "Member remove failed"));
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!selectedProject) return;
    try {
      setLoading(true);
      setError("");
      await api.post(`/tasks/project/${selectedProject}`, taskForm);
      setTaskForm({ title: "", description: "", dueDate: "", priority: "Medium", assignedTo: "" });
      await refreshAll();
    } catch (err) {
      setError(parseError(err, "Task create failed"));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      setLoading(true);
      setError("");
      await api.patch(`/tasks/${taskId}/status`, { status });
      await refreshAll();
    } catch (err) {
      setError(parseError(err, "Task status update failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Team Task Manager</h1>
        <div>
          <span>{user?.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <DashboardStats stats={stats} />

      <div className="grid">
        <section className="card">
          <h2>Create Project</h2>
          <form onSubmit={createProject}>
            <input
              placeholder="Project name"
              value={projectForm.name}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              value={projectForm.description}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <button>Create</button>
          </form>
        </section>

        <section className="card">
          <h2>Your Projects</h2>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          {selectedProjectData && (
            <>
              <h3>Members</h3>
              <ul>
                {selectedProjectData.members.map((member) => (
                  <li key={member.user._id} className="member-row">
                    {member.user.name} ({member.role})
                    {isAdmin && member.user._id !== currentUserId && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => removeMember(member.user._id)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {isAdmin && (
        <div className="grid">
          <section className="card">
            <h2>Add Member</h2>
            <form onSubmit={addMember}>
              <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="Member email" />
              <button disabled={loading}>Add</button>
            </form>
          </section>

          <section className="card">
            <h2>Create Task</h2>
            <form onSubmit={createTask}>
              <input
                placeholder="Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                placeholder="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <select
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
              >
                <option value="">Assign to</option>
                {selectedProjectData?.members.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
              <button disabled={loading || !taskForm.assignedTo}>Create Task</button>
            </form>
          </section>
        </div>
      )}

      <section className="card">
        <h2>Tasks</h2>
        {tasks.length === 0 ? (
          <p className="muted">No tasks yet.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task._id}>
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <small>
                    Assigned: {task.assignedTo?.name} | Priority: {task.priority} | Due:{" "}
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                  </small>
                </div>
                <select value={task.status} onChange={(e) => updateStatus(task._id, e.target.value)}>
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default App;
