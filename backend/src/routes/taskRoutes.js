const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const Task = require("../models/Task");
const { getProjectAndMembership } = require("../utils/projectAccess");

const router = express.Router();
router.use(auth);

router.get("/project/:projectId", async (req, res) => {
  const { project, error, status } = await getProjectAndMembership(req.params.projectId, req.user._id);
  if (error) return res.status(status).json({ message: error });

  const membership = project.members.find((member) => member.user._id.toString() === req.user._id.toString());
  const query =
    membership.role === "Admin"
      ? { project: project._id }
      : { project: project._id, assignedTo: req.user._id };

  const tasks = await Task.find(query)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  return res.json(tasks);
});

router.post(
  "/project/:projectId",
  [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    body("assignedTo").notEmpty().withMessage("assignedTo is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project, membership, error, status } = await getProjectAndMembership(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ message: error });
    if (membership.role !== "Admin") {
      return res.status(403).json({ message: "Only admins can create tasks" });
    }

    const isAssigneeMember = project.members.some((member) => member.user._id.toString() === req.body.assignedTo);
    if (!isAssigneeMember) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }

    const task = await Task.create({
      project: project._id,
      title: req.body.title,
      description: req.body.description || "",
      dueDate: req.body.dueDate,
      priority: req.body.priority || "Medium",
      assignedTo: req.body.assignedTo,
      createdBy: req.user._id,
    });

    await task.populate("assignedTo", "name email");
    return res.status(201).json(task);
  }
);

router.patch(
  "/:taskId/status",
  [body("status").isIn(["To Do", "In Progress", "Done"]).withMessage("Invalid status")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { membership, error, status } = await getProjectAndMembership(task.project, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = membership.role === "Admin";
    if (!isAssignee && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to update this task" });
    }

    task.status = req.body.status;
    await task.save();
    await task.populate("assignedTo", "name email");
    return res.json(task);
  }
);

module.exports = router;
