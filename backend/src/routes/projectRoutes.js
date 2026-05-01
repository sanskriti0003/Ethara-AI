const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const User = require("../models/User");
const { getProjectAndMembership } = require("../utils/projectAccess");

const router = express.Router();

router.use(auth);

router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Project name is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.create({
      name: req.body.name,
      description: req.body.description || "",
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: "Admin" }],
    });

    return res.status(201).json(project);
  }
);

router.get("/", async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id })
    .populate("members.user", "name email")
    .sort({ createdAt: -1 });

  return res.json(projects);
});

router.post(
  "/:projectId/members",
  [body("email").isEmail().withMessage("Valid email is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project, membership, error, status } = await getProjectAndMembership(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ message: error });
    if (membership.role !== "Admin") {
      return res.status(403).json({ message: "Only admins can manage members" });
    }

    const memberUser = await User.findOne({ email: req.body.email });
    if (!memberUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = project.members.some((member) => member.user._id.toString() === memberUser._id.toString());
    if (exists) {
      return res.status(409).json({ message: "User already in project" });
    }

    project.members.push({ user: memberUser._id, role: "Member" });
    await project.save();
    await project.populate("members.user", "name email");
    return res.json(project);
  }
);

router.delete("/:projectId/members/:memberId", async (req, res) => {
  const { project, membership, error, status } = await getProjectAndMembership(req.params.projectId, req.user._id);
  if (error) return res.status(status).json({ message: error });
  if (membership.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can manage members" });
  }
  if (req.params.memberId === req.user._id.toString()) {
    return res.status(400).json({ message: "Admin cannot remove themselves" });
  }

  const memberToRemove = project.members.find((member) => member.user._id.toString() === req.params.memberId);
  if (!memberToRemove) {
    return res.status(404).json({ message: "Member not found in project" });
  }

  project.members = project.members.filter((member) => member.user._id.toString() !== req.params.memberId);
  await project.save();
  await project.populate("members.user", "name email");
  return res.json(project);
});

module.exports = router;
