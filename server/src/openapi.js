/** OpenAPI 3 document for REST surface + interactive docs at GET /api/docs */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Campus Care API',
    version: '1.0.0',
    description:
      'REST API for the Campus Care complaint platform. Authenticated routes expect `Authorization: Bearer <JWT>`. Platform admin routes also accept `JWT_PLATFORM_SECRET`-signed tokens returned at login. GraphQL (Apollo) is available at `/graphql` with the same Bearer JWT for user operations.',
  },
  servers: [{ url: '/', description: 'Same origin (use absolute URL in production)' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Org' },
    { name: 'Users' },
    { name: 'Complaints' },
    { name: 'Admin' },
    { name: 'Export' },
    { name: 'Stats' },
    { name: 'Platform' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      platformBearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Platform admin token (same header as bearerAuth; signed with JWT_PLATFORM_SECRET)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      ComplaintCreate: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', description: 'Optional override; empty = auto-detect' },
          anonymous: { type: 'boolean' },
          templateId: { type: 'string' },
          files: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'multipart field name: files' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } } },
      },
    },
    '/api/auth/register/student': {
      post: {
        tags: ['Auth'],
        summary: 'Register student',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'collegeId', 'departmentId'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  city: { type: 'string' },
                  collegeId: { type: 'string' },
                  departmentId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'JWT + user payload' },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/register/dept-admin': {
      post: {
        tags: ['Auth'],
        summary: 'Register department admin (needs college registration key)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'registrationKey', 'collegeId', 'departmentId'],
              },
            },
          },
        },
        responses: { '200': { description: 'Pending approval' } },
      },
    },
    '/api/auth/register/college-admin': {
      post: {
        tags: ['Auth'],
        summary: 'Register college admin',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'registrationKey', 'collegeId'],
              },
            },
          },
        },
        responses: { '200': { description: 'Pending platform approval' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { '200': { description: 'token, optional platformToken, user' } },
      },
    },
    '/api/auth/forgot': {
      post: {
        tags: ['Auth'],
        summary: 'Request OTP for password reset',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } } },
        responses: { '200': { description: 'Always OK (no email enumeration)' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with OTP',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'password'],
                properties: { email: { type: 'string' }, code: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    '/api/auth/complete-profile': {
      patch: {
        tags: ['Auth'],
        summary: 'Google OAuth users — set college & department',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['city', 'collegeId', 'departmentId'],
              },
            },
          },
        },
      },
    },
    '/api/auth/google': {
      get: {
        tags: ['Auth'],
        summary: 'Start Google OAuth (browser redirect)',
        responses: { '302': { description: 'Redirect to Google' }, '503': { description: 'OAuth not configured' } },
      },
    },
    '/api/org/cities': {
      get: {
        tags: ['Org'],
        summary: 'List cities that have colleges',
        responses: { '200': { description: 'string[]' } },
      },
    },
    '/api/org/colleges': {
      get: {
        tags: ['Org'],
        summary: 'List colleges',
        parameters: [{ name: 'city', in: 'query', schema: { type: 'string' } }],
      },
    },
    '/api/org/colleges/{id}/departments': {
      get: {
        tags: ['Org'],
        summary: 'Departments for a college',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Current user profile',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/complaints': {
      get: {
        tags: ['Complaints'],
        summary: 'List complaints (scoped by role)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'stage', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
      },
      post: {
        tags: ['Complaints'],
        summary: 'Create complaint (multipart)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  anonymous: { type: 'string', description: '"true" or "false"' },
                  templateId: { type: 'string' },
                  files: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
      },
    },
    '/api/complaints/browse': {
      get: {
        tags: ['Complaints'],
        summary: 'Browse non-anonymous complaints in same college (student)',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/complaints/templates': {
      get: {
        tags: ['Complaints'],
        summary: 'Complaint templates',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/complaints/{id}': {
      get: {
        tags: ['Complaints'],
        summary: 'Complaint detail',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
      patch: {
        tags: ['Complaints'],
        summary: 'Update stage / priority (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  stage: { type: 'string', enum: ['under_review', 'in_progress', 'resolved'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                },
              },
            },
          },
        },
      },
    },
    '/api/complaints/{id}/reply': {
      post: {
        tags: ['Complaints'],
        summary: 'Staff reply',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { body: { type: 'string' } } } } } },
      },
    },
    '/api/complaints/{id}/upvote': {
      post: {
        tags: ['Complaints'],
        summary: 'Toggle upvote',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/admin/pending': {
      get: {
        tags: ['Admin'],
        summary: 'Pending approvals (dept: students; college: dept admins)',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/admin/approve/{id}': {
      post: {
        tags: ['Admin'],
        summary: 'Approve user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/admin/reject/{id}': {
      post: {
        tags: ['Admin'],
        summary: 'Reject / delete pending user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/export/complaints.csv': {
      get: {
        tags: ['Export'],
        summary: 'CSV export (department admin)',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/stats/department': {
      get: {
        tags: ['Stats'],
        summary: 'Department analytics',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/stats/college': {
      get: {
        tags: ['Stats'],
        summary: 'College overview stats',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/stats/platform': {
      get: {
        tags: ['Stats'],
        summary: 'Platform-wide stats',
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/platform/pending-college-admins': {
      get: {
        tags: ['Platform'],
        summary: 'Pending college admin registrations',
        security: [{ platformBearer: [] }],
      },
    },
    '/api/platform/approve-college-admin/{id}': {
      post: {
        tags: ['Platform'],
        summary: 'Approve college admin',
        security: [{ platformBearer: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/platform/colleges': {
      get: {
        tags: ['Platform'],
        summary: 'List all colleges',
        security: [{ platformBearer: [] }],
      },
      post: {
        tags: ['Platform'],
        summary: 'Create college + registration key',
        security: [{ platformBearer: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name', 'city'], properties: { name: { type: 'string' }, city: { type: 'string' } } },
            },
          },
        },
      },
    },
    '/api/platform/colleges/{id}': {
      patch: {
        tags: ['Platform'],
        summary: 'Update college (e.g. enabled)',
        security: [{ platformBearer: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
      delete: {
        tags: ['Platform'],
        summary: 'Delete college',
        security: [{ platformBearer: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/platform/colleges/{id}/regenerate-key': {
      post: {
        tags: ['Platform'],
        summary: 'Rotate registration key',
        security: [{ platformBearer: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
    '/api/platform/colleges/{id}/departments': {
      post: {
        tags: ['Platform'],
        summary: 'Add department',
        security: [{ platformBearer: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } },
        },
      },
    },
  },
};
