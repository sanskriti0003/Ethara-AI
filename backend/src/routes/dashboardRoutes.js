const express = require("express");
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const Task = require("../models/Task");

const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id });
  const projectIds = projects.map((project) => project._id);

  const allTasks = await Task.find({ project: { $in: projectIds } }).populate("assignedTo", "name");
  const visibleTasks = allTasks.filter((task) => {
    const project = projects.find((p) => p._id.toString() === task.project.toString());
    const member = project.members.find((m) => m.user.toString() === req.user._id.toString());
    return member.role === "Admin" || task.assignedTo?._id?.toString() === req.user._id.toString();
  });

  const byStatus = visibleTasks.reduce(
    (acc, task) => {
      acc[task.status] += 1;
      return acc;
    },
    { "To Do": 0, "In Progress": 0, Done: 0 }
  );

  const tasksPerUser = visibleTasks.reduce((acc, task) => {
    const key = task.assignedTo?.name || "Unassigned";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const now = new Date();
  const overdueTasks = visibleTasks.filter((task) => task.dueDate && task.dueDate < now && task.status !== "Done");

  return res.json({
    totalTasks: visibleTasks.length,
    tasksByStatus: byStatus,
    tasksPerUser,
    overdueTasks: overdueTasks.length,
  });
});

module.exports = router;
