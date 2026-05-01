const Project = require("../models/Project");

const getProjectAndMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate("members.user", "name email");
  if (!project) {
    return { error: "Project not found", status: 404 };
  }

  const membership = project.members.find((member) => member.user._id.toString() === userId.toString());
  if (!membership) {
    return { error: "You are not a project member", status: 403 };
  }

  return { project, membership };
};

module.exports = { getProjectAndMembership };
