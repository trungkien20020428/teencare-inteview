import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import parentsRouter from './routes/parents';
import studentsRouter from './routes/students';
import classesRouter from './routes/classes';
import registrationsRouter from './routes/registrations';
import subscriptionsRouter from './routes/subscriptions';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/parents', parentsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/subscriptions', subscriptionsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
