import { Request, Response, Router } from 'express';

import packageJson from '../../package.json';
import { AuthController } from '../controllers/auth.controller';
import { FocusTimeController } from '../controllers/focus-time.controller';
import { HabitsController } from '../controllers/habits.controller';
import firebaseAuthMiddleware from '../middlewares/firebase-auth.middleware';

export const routes = Router();

const habitsController = new HabitsController();
const focusTimeController = new FocusTimeController();
const authController = new AuthController();

routes.get('/', (req: Request, res: Response) => {
  const { name, description, version } = packageJson;

  res.status(200).json({
    name,
    description,
    version,
  });
});

// Rota de teste PÚBLICA para verificar configuração do Firebase
routes.get('/firebase-test', (req: Request, res: Response) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

  res.status(200).json({
    firebaseConfigured: !!(projectId && clientEmail && hasPrivateKey),
    projectId: projectId || 'NOT_SET',
    clientEmail: clientEmail ? clientEmail.substring(0, 20) + '...' : 'NOT_SET',
    hasPrivateKey,
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
  });
});

routes.get('/auth', (req: Request, res: Response) => {
  authController.auth(req, res);
});

routes.get('/auth/callback', (req: Request, res: Response) => {
  authController.authCallback(req, res);
});

routes.post('/auth/github', (req: Request, res: Response) => {
  authController.githubAuth(req, res);
});

// Todas as rotas protegidas agora usam apenas autenticação Firebase
routes.use(firebaseAuthMiddleware);

routes.get('/api/v1/profile', (req: Request, res: Response) => {
  authController.firebaseProfile(req, res);
});

routes.get('/api/v1/habits', (req: Request, res: Response) => {
  habitsController.index(req, res);
});

routes.get('/api/v1/habits/:id/metrics', (req: Request, res: Response) => {
  habitsController.metrics(req, res);
});

routes.post('/api/v1/habits', (req: Request, res: Response) => {
  habitsController.create(req, res);
});

routes.delete('/api/v1/habits/:id', (req: Request, res: Response) => {
  habitsController.delete(req, res);
});

routes.patch('/api/v1/habits/:id/toggle', (req: Request, res: Response) => {
  habitsController.toggle(req, res);
});

routes.post('/api/v1/focus-time', (req: Request, res: Response) => {
  focusTimeController.create(req, res);
});

routes.get(
  '/api/v1/focus-time/metrics/month',
  (req: Request, res: Response) => {
    focusTimeController.metricsByMonth(req, res);
  }
);

routes.get('/api/v1/focus-time', (req: Request, res: Response) => {
  focusTimeController.index(req, res);
});

// Rotas antigas sem o prefixo /api/v1 também protegidas pelo Firebase
routes.get('/habits', (req: Request, res: Response) => {
  habitsController.index(req, res);
});

routes.get('/habits/:id/metrics', (req: Request, res: Response) => {
  habitsController.metrics(req, res);
});

routes.post('/habits', (req: Request, res: Response) => {
  habitsController.create(req, res);
});

routes.delete('/habits/:id', (req: Request, res: Response) => {
  habitsController.delete(req, res);
});

routes.patch('/habits/:id/toggle', (req: Request, res: Response) => {
  habitsController.toggle(req, res);
});

routes.post('/focus-time', (req: Request, res: Response) => {
  focusTimeController.create(req, res);
});

routes.get('/focus-time/metrics/month', (req: Request, res: Response) => {
  focusTimeController.metricsByMonth(req, res);
});

routes.get('/focus-time', (req: Request, res: Response) => {
  focusTimeController.index(req, res);
});
