import Fastify from 'fastify';
import fastifyFormbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({ logger: true });

// Register plugins
fastify.register(fastifyFormbody);
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
});
fastify.register(fastifyView, {
  engine: { ejs: (await import('ejs')).default }, // Use dynamic import for `ejs`
  root: path.join(__dirname, 'views'),
});
fastify.register(import('@fastify/rate-limit'), {
  max: 5, // Limit to 5 requests per minute per IP
  timeWindow: '1 minute',
});

// Synapse server configuration
const SYNAPSE_URL = process.env.SYNAPSE_URL; // Synapse base URL
const ADMIN_TOKEN = process.env.SYNAPSE_ADMIN_TOKEN; // Admin access token

// Routes
fastify.get('/', (req, reply) => {
  reply.view('change-password.ejs', {
    success: null, // Default value for success
    error: null, // Default value for error
  });
});

fastify.post('/change-password', async (req, reply) => {
  const { userId, currentPassword, newPassword } = req.body;

  // Ensure the username includes the homeserver
  const DEFAULT_HOMESERVER = 'matrix.fkrkn.ru';
  const resolvedUserId = userId.includes(':')
    ? userId
    : `@${userId}:${DEFAULT_HOMESERVER}`;

  // Validate password strength
  const passwordStrength = zxcvbn(newPassword);
  if (passwordStrength.score < 3) {
    return reply.view('change-password.ejs', {
      error: 'Пароль слишком лёгкий, используйте более сложный.',
      success: null,
    });
  }

  try {
    // Step 1: Authenticate the user with the current password
    const authResponse = await axios.post(
      `${SYNAPSE_URL}/_matrix/client/r0/login`,
      {
        type: 'm.login.password',
        identifier: {
          type: 'm.id.user',
          user: resolvedUserId,
        },
        password: currentPassword,
      }
    );

    // Step 2: Change the password using the Synapse Admin API
    await axios.post(
      `${SYNAPSE_URL}/_synapse/admin/v1/reset_password/${resolvedUserId}`,
      {
        new_password: newPassword,
        logout_devices: true, // Logs out all user devices
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      }
    );

    // Step 3: Render success page
    return reply.view('change-password.ejs', {
      error: null,
      success: `Пароль успешно изменён для пользователя ${resolvedUserId}.`,
    });
  } catch (error) {
    fastify.log.error(error.response?.data || error.message);

    // Render error message
    return reply.view('change-password.ejs', {
      error: 'Произошла ошибка при изменении пароля, попробуйте позже.',
      success: null,
    });
  }
});

// Start the server
fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
