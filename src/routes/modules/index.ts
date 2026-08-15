import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import leaveRoutes from './leave.routes';
import standupRoutes from './standup.routes';
import projectRoutes from './project.routes';
import cultureEventRoutes from './cultureEvent.routes';
import holidayRoutes from './holiday.routes';

// Every domain converted to the standard layering — route -> controller ->
// service -> repository -> model (see src/routes/modules/employee.routes.ts
// for a worked example) — registers itself here exactly once, instead of
// routes/index.js growing an ad-hoc `router.use(path, require(...))` line
// per domain. routes/index.js mounts this single aggregate router; batch-
// converting the rest of the app later means adding one entry to this list,
// not touching routes/index.js again.
const modules: Array<{ path: string; router: Router }> = [
  { path: '/auth', router: authRoutes },
  { path: '/employees', router: employeeRoutes },
  { path: '/leaves', router: leaveRoutes },
  { path: '/standups', router: standupRoutes },
  { path: '/projects', router: projectRoutes },
  { path: '/events', router: cultureEventRoutes },
  { path: '/holidays', router: holidayRoutes },
];

const router = Router();
modules.forEach(({ path, router: moduleRouter }) => router.use(path, moduleRouter));

export default router;
