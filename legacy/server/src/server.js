import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { Server as SocketIOServer } from 'socket.io';
import { connectDb } from './db.js';
import { seedPlatformAdmin } from './utils/seed.js';
import { registerEscalationJob } from './utils/escalation.js';
import { attachSocket } from './socket.js';
import { openApiDocument } from './openapi.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { buildGraphQLContext } from './graphql/context.js';

import authRoutes from './routes/auth.js';
import orgRoutes from './routes/org.js';
import complaintRoutes from './routes/complaints.js';
import adminRoutes from './routes/admin.js';
import exportRoutes from './routes/export.js';
import statsRoutes from './routes/stats.js';
import platformRoutes from './routes/platform.js';
import userRoutes from './routes/users.js';

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

if (!process.env.JWT_SECRET || !process.env.JWT_PLATFORM_SECRET) {
  console.error('Missing JWT_SECRET or JWT_PLATFORM_SECRET');
  process.exit(1);
}

await connectDb(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_care');
await seedPlatformAdmin();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL.split(','),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  },
});

app.set('io', io);
attachSocket(io);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
});

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: CLIENT_URL.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(limiter);

app.use(passport.initialize());

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer: server }),
    ...(process.env.NODE_ENV !== 'production'
      ? [ApolloServerPluginLandingPageLocalDefault({ embed: true })]
      : []),
  ],
});
await apolloServer.start();

app.use(
  '/graphql',
  expressMiddleware(apolloServer, {
    context: async ({ req }) => buildGraphQLContext({ req }),
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/openapi.json', (_req, res) => res.json(openApiDocument));

/** Swagger UI (CDN) — no extra npm deps; works with ESM */
app.get('/api/docs', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Campus Care API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" crossorigin />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/users', userRoutes);

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Fallback for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.use((_err, _req, res, _next) => {
  console.error(_err);
  res.status(500).json({ message: 'Internal error' });
});

registerEscalationJob(io);

server.listen(PORT, () => console.log(`Campus Care API + WS on ${PORT}`));
