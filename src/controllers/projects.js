const Project = require('../models/Project');
const projectDto = require('../dtos/projectDto');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../pkg/AppError');

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const rows = await Project.findAll(status);
  res.json(projectDto.toResponseList(rows));
});

exports.create = asyncHandler(async (req, res) => {
  const data = projectDto.toCreateInput(req.body);
  const id = await Project.create(data);
  res.status(201).json({ id });
});

exports.update = asyncHandler(async (req, res) => {
  const updates = projectDto.toUpdateInput(req.body);
  if (!Object.keys(updates).length) throw new AppError('Nothing to update', 400);
  await Project.update(req.params.id, updates);
  res.json({ success: true });
});

exports.remove = asyncHandler(async (req, res) => {
  await Project.remove(req.params.id);
  res.json({ success: true });
});

exports.getAssignments = asyncHandler(async (req, res) => {
  const rows = await Project.findAssignments(req.params.id);
  res.json(rows);
});

exports.addAssignment = asyncHandler(async (req, res) => {
  const { employee_id, role } = req.body;
  await Project.addAssignment(req.params.id, employee_id, role);
  res.status(201).json({ success: true });
});

exports.removeAssignment = asyncHandler(async (req, res) => {
  await Project.removeAssignment(req.params.id, req.params.empId);
  res.json({ success: true });
});

exports.getMilestones = asyncHandler(async (req, res) => {
  const rows = await Project.findMilestones(req.params.id);
  res.json(rows);
});

exports.addMilestone = asyncHandler(async (req, res) => {
  const { title, due_date, status } = req.body;
  const id = await Project.addMilestone(req.params.id, title, due_date, status || 'pending');
  res.status(201).json({ id });
});

exports.updateMilestone = asyncHandler(async (req, res) => {
  const { title, due_date, status } = req.body;
  await Project.updateMilestone(req.params.id, req.params.mid, title, due_date, status);
  res.json({ success: true });
});

exports.getServices = asyncHandler(async (req, res) => {
  const rows = await Project.findServices(req.params.id);
  res.json(rows.map(r => r.service_key));
});

exports.addService = asyncHandler(async (req, res) => {
  const { service_key } = req.body;
  if (!service_key) throw new AppError('service_key required', 400);
  await Project.addService(req.params.id, service_key);
  res.status(201).json({ success: true });
});

exports.removeService = asyncHandler(async (req, res) => {
  await Project.removeService(req.params.id, req.params.serviceKey);
  res.json({ success: true });
});

// Returns all projects an employee is assigned to, with their role + milestones
exports.byEmployee = asyncHandler(async (req, res) => {
  const rows = await Project.findByEmployee(req.params.empId);
  const projects = projectDto.toResponseList(rows);

  // Attach milestones to each project
  for (const proj of projects) {
    proj.milestones = await Project.findMilestonesForProject(proj.id);
  }

  res.json(projects);
});
