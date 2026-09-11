import express from 'express';
import cors from 'cors';
import { config, isMetaConfigured } from './config.js';
import clientsRouter from './routes/clients.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', metaConfigured: isMetaConfigured() });
});

app.use('/api/clients', clientsRouter);
app.use('/api/auth', authRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(config.port, () => {
  console.log(`API del dashboard escuchando en http://localhost:${config.port}`);
  if (!isMetaConfigured()) {
    console.log('META_APP_ID / META_APP_SECRET no configurados: los clientes usarán datos de ejemplo hasta que se conecten.');
  }
});
