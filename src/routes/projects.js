const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projects');

router.get('/by-employee/:empId', ctrl.byEmployee);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.get('/:id/assignments', ctrl.getAssignments);
router.post('/:id/assignments', ctrl.addAssignment);
router.delete('/:id/assignments/:empId', ctrl.removeAssignment);
router.get('/:id/milestones', ctrl.getMilestones);
router.post('/:id/milestones', ctrl.addMilestone);
router.put('/:id/milestones/:mid', ctrl.updateMilestone);

router.get('/:id/services', ctrl.getServices);
router.post('/:id/services', ctrl.addService);
router.delete('/:id/services/:serviceKey', ctrl.removeService);

module.exports = router;
