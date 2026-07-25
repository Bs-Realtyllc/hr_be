const Project = require('../models/Project');
const projectDto = require('../dtos/projectDto');

exports.list = async (req, res) => {
  try {
    const { status } = req.query;
    const rows = await Project.findAll(status);
    res.json(projectDto.toResponseList(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = projectDto.toCreateInput(req.body);
    const id = await Project.create(data);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const updates = projectDto.toUpdateInput(req.body);
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
  try {
    await Project.update(req.params.id, updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const rows = await Project.findAssignments(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAssignment = async (req, res) => {
  const { employee_id, role } = req.body;
  try {
    await Project.addAssignment(req.params.id, employee_id, role);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeAssignment = async (req, res) => {
  try {
    await Project.removeAssignment(req.params.id, req.params.empId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMilestones = async (req, res) => {
  try {
    const rows = await Project.findMilestones(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMilestone = async (req, res) => {
  const { title, due_date, status } = req.body;
  try {
    const id = await Project.addMilestone(req.params.id, title, due_date, status || 'pending');
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMilestone = async (req, res) => {
  const { title, due_date, status } = req.body;
  try {
    await Project.updateMilestone(req.params.id, req.params.mid, title, due_date, status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const rows = await Project.findServices(req.params.id);
    res.json(rows.map(r => r.service_key));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addService = async (req, res) => {
  const { service_key } = req.body;
  if (!service_key) return res.status(400).json({ error: 'service_key required' });
  try {
    await Project.addService(req.params.id, service_key);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeService = async (req, res) => {
  try {
    await Project.removeService(req.params.id, req.params.serviceKey);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns all projects an employee is assigned to, with their role + milestones
exports.byEmployee = async (req, res) => {
  try {
    const rows = await Project.findByEmployee(req.params.empId);
    const projects = projectDto.toResponseList(rows);

    // Attach milestones to each project
    for (const proj of projects) {
      proj.milestones = await Project.findMilestonesForProject(proj.id);
    }

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
