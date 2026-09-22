import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import leaveRoutes from './leave.routes';
import standupRoutes from './standup.routes';
import projectRoutes from './project.routes';
import cultureEventRoutes from './cultureEvent.routes';
import holidayRoutes from './holiday.routes';
import serverRoutes from './server.routes';
import payrollRoutes from './payroll.routes';
import overtimeRoutes from './overtime.routes';
import discordRoutes from './discord.routes';
import webhookRoutes from './webhook.routes';
import emailSettingsRoutes from './emailSettings.routes';
import monthlyReportRoutes from './monthlyReport.routes';
import weeklyReportRoutes from './weeklyReport.routes';
import serviceCredentialRoutes from './serviceCredential.routes';
import googleRoutes from './google.routes';
import dashboardRoutes from './dashboard.routes';
import profileRoutes from './profile.routes';
import goalRoutes from './goal.routes';
import performanceRoutes from './performance.routes';
import feedbackRoutes from './feedback.routes';
import policyRoutes from './policy.routes';
import formLayoutRoutes from './formLayout.routes'
import onboardRoutes from './onboard.routes'
import roadmapRoutes from './roadmap.routes'
import clockRoutes from './clock.routes'

const modules: Array<{ path: string; router: Router }> = [
  { path: '/auth', router: authRoutes },
  { path: '/employees', router: employeeRoutes },
  { path: '/leaves', router: leaveRoutes },
  { path: '/standups', router: standupRoutes },
  { path: '/projects', router: projectRoutes },
  { path: '/events', router: cultureEventRoutes },
  { path: '/holidays', router: holidayRoutes },
  { path: '/servers', router: serverRoutes },
  { path: '/payroll', router: payrollRoutes },
  { path: '/overtime', router: overtimeRoutes },
  { path: '/discord', router: discordRoutes },
  { path: '/webhooks', router: webhookRoutes },
  { path: '/email-settings', router: emailSettingsRoutes },
  { path: '/reports', router: monthlyReportRoutes },
  { path: '/weekly-reports', router: weeklyReportRoutes },
  { path: '/service-credentials/:employeeId', router: serviceCredentialRoutes },
  { path: '/google', router: googleRoutes },
  { path: '/dashboard', router: dashboardRoutes },
  { path: '/profile', router: profileRoutes },
  { path: '/goals', router: goalRoutes },
  { path: '/performance', router: performanceRoutes },
  { path: '/feedback', router: feedbackRoutes },
  { path: '/policies', router: policyRoutes },
  { path: '/form-layout', router: formLayoutRoutes},
  { path: '/onboard', router: onboardRoutes},
  { path: '/roadmap', router: roadmapRoutes },
  { path: '/clock', router: clockRoutes },


];

const router = Router();
modules.forEach(({ path, router: moduleRouter }) => router.use(path, moduleRouter));

export default router;
