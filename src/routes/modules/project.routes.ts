import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/project.controller';
import * as todoCtrl from '../../controllers/projectTodo.controller';
import * as issueCtrl from '../../controllers/issue.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { uploadAttachmentMemory } from '../../middleware/uplod';

router.get('/by-employee/:empId',authenticate, ctrl.byEmployee);
router.get('/',authenticate, ctrl.list);
router.post('/',authenticate,requireRole('admin'), ctrl.create);
router.put('/:id',authenticate,requireRole('admin'), ctrl.update);
router.delete('/:id',authenticate,requireRole('admin'), ctrl.remove);
// Assignment/module write access is a project admin OR global admin/lead —
// checked inside project.service.ts's assertProjectAdmin, same reason issue
// writes are checked in issue.service.ts rather than here.
router.get('/:id/assignments',authenticate, ctrl.getAssignments);
router.post('/:id/assignments',authenticate, ctrl.addAssignment);
router.delete('/:id/assignments/:empId',authenticate, ctrl.removeAssignment);
router.get('/:id/modules',authenticate, ctrl.getModules);
router.post('/:id/modules',authenticate, ctrl.createModule);
router.put('/:id/modules/:mid',authenticate, ctrl.updateModule);
router.get('/:id/modules/:mid/members',authenticate, ctrl.getModuleMembers);
router.post('/:id/modules/:mid/members',authenticate, ctrl.addModuleMember);
router.delete('/:id/modules/:mid/members/:empId',authenticate, ctrl.removeModuleMember);

router.get('/:id/services', ctrl.getServices);
router.post('/:id/services', ctrl.addService);
router.delete('/:id/services/:serviceKey', ctrl.removeService);

router.get('/:id/todos', authenticate, todoCtrl.list);
router.get('/:id/todos/summary', authenticate, todoCtrl.summary);
router.post('/:id/todos', authenticate, requireRole('admin'), todoCtrl.create);
router.put('/:id/todos/:tid', authenticate, requireRole('admin'), todoCtrl.update);
router.patch('/:id/todos/:tid/toggle', authenticate, requireRole('admin'), todoCtrl.toggle);
router.delete('/:id/todos/:tid', authenticate, requireRole('admin'), todoCtrl.remove);

// Issue write permissions (project member or admin/lead) are checked inside
// issue.service.ts since they depend on project membership, not just role.
router.get('/:id/issues', authenticate, issueCtrl.list);
router.post('/:id/issues', authenticate, issueCtrl.create);
router.put('/:id/issues/:iid', authenticate, issueCtrl.update);
router.delete('/:id/issues/:iid', authenticate, issueCtrl.remove);
router.get('/:id/issues/:iid/comments', authenticate, issueCtrl.listComments);
router.post('/:id/issues/:iid/comments', authenticate, issueCtrl.addComment);
router.get('/:id/issues/:iid/activity', authenticate, issueCtrl.listActivity);
router.get('/:id/issues/:iid/links', authenticate, issueCtrl.listLinks);
router.post('/:id/issues/:iid/links', authenticate, issueCtrl.addLink);
router.delete('/:id/issues/:iid/links/:lid', authenticate, issueCtrl.removeLink);
router.get('/:id/issues/:iid/attachments', authenticate, issueCtrl.listAttachments);
router.post('/:id/issues/:iid/attachments', authenticate, uploadAttachmentMemory.single('file'), issueCtrl.addAttachment);
router.get('/:id/issues/:iid/attachments/:aid/download', authenticate, issueCtrl.downloadAttachment);
router.delete('/:id/issues/:iid/attachments/:aid', authenticate, issueCtrl.removeAttachment);

router.get('/:id/labels', authenticate, issueCtrl.listLabels);
router.post('/:id/labels', authenticate, requireRole('admin'), issueCtrl.createLabel);
router.delete('/:id/labels/:lid', authenticate, requireRole('admin'), issueCtrl.removeLabel);

export default router;
