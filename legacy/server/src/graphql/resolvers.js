import { GraphQLError } from 'graphql';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { Complaint } from '../models/Complaint.js';
function assertAuth(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }
}

function mapCollege(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    city: doc.city,
    enabled: doc.enabled,
  };
}

function mapDept(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    collegeId: doc.college.toString(),
  };
}

function mapComplaint(c, opts = {}) {
  const d = typeof c.toObject === 'function' ? c.toObject() : c;
  const deptName =
    typeof d.department === 'object' && d.department?.name
      ? d.department.name
      : opts.departmentName ?? null;
  return {
    id: d._id.toString(),
    title: d.title,
    description: d.description,
    stage: d.stage,
    priority: d.priority,
    category: d.category,
    sentiment: d.sentiment,
    anonymous: !!d.anonymous,
    escalationLevel: d.escalationLevel ?? 0,
    createdAt: d.createdAt?.toISOString?.() || new Date(d.createdAt).toISOString(),
    departmentName: deptName,
  };
}

function mapUser(u) {
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    role: u.role,
    approved: u.approved,
    profileComplete: u.profileComplete,
    collegeId: u.college?.toString?.() ?? null,
    departmentId: u.department?.toString?.() ?? null,
  };
}

export const resolvers = {
  Query: {
    gqlCities: async () => {
      const cities = await College.distinct('city', { enabled: true });
      return cities.sort();
    },

    gqlColleges: async (_, { city }) => {
      const q = { enabled: true };
      if (city) q.city = city;
      const list = await College.find(q).sort({ name: 1 });
      return list.map(mapCollege);
    },

    gqlDepartments: async (_, { collegeId }) => {
      const list = await Department.find({ college: collegeId }).sort({ name: 1 });
      return list.map(mapDept);
    },

    gqlMe: async (_, __, { user }) => {
      assertAuth(user);
      return mapUser(user);
    },

    gqlComplaints: async (_, { stage, category }, { user }) => {
      assertAuth(user);
      const query = {};

      if (user.role === 'student') {
        query.submitter = user._id;
      } else if (user.role === 'dept_admin') {
        query.college = user.college;
        query.department = user.department;
      } else if (user.role === 'college_admin') {
        query.college = user.college;
      }

      if (stage) query.stage = stage;
      if (category) query.category = category;

      const sort =
        user.role === 'platform_admin'
          ? { escalationLevel: -1, createdAt: -1 }
          : { createdAt: -1 };
      const limit = user.role === 'platform_admin' ? 500 : 200;

      const list = await Complaint.find(query)
        .populate('department', 'name')
        .sort(sort)
        .limit(limit);

      return list.map((c) => mapComplaint(c));
    },

    gqlComplaint: async (_, { id }, { user }) => {
      assertAuth(user);
      const c = await Complaint.findById(id).populate('department', 'name').populate('college').populate('submitter');

      if (!c) return null;

      const cid = c.college?._id || c.college;
      const did = c.department?._id || c.department;
      const sid = c.submitter?._id || c.submitter;

      let allowed = false;
      if (user.role === 'student' && sid && String(sid) === String(user._id)) allowed = true;
      if (user.role === 'dept_admin' && cid.equals(user.college) && did.equals(user.department)) allowed = true;
      if (user.role === 'college_admin' && cid.equals(user.college)) allowed = true;
      if (user.role === 'platform_admin') allowed = true;

      if (!allowed) {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
      }

      return mapComplaint(c);
    },
  },

  Mutation: {
    gqlUpdateComplaintStage: async (_, { id, stage }, ctx) => {
      const { user } = ctx;
      assertAuth(user);
      const allowedStages = ['under_review', 'in_progress', 'resolved'];
      if (!allowedStages.includes(stage)) {
        throw new GraphQLError('Invalid stage', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const c = await Complaint.findById(id);
      if (!c) throw new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND', http: { status: 404 } } });

      if (user.role === 'dept_admin') {
        if (!c.college.equals(user.college) || !c.department.equals(user.department)) {
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
        }
      } else if (user.role === 'college_admin') {
        if (!c.college.equals(user.college)) {
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
        }
      } else if (user.role !== 'platform_admin') {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
      }

      c.stage = stage;
      if (stage !== 'resolved') c.lastStaffActionAt = new Date();
      if (stage === 'resolved') {
        c.resolvedAt = new Date();
        c.lastStaffActionAt = new Date();
      }
      await c.save();

      const io = ctx.req?.app?.get?.('io');
      if (c.submitter && io) {
        io.to(`user:${c.submitter.toString()}`).emit('complaint:updated', { id: c._id, stage: c.stage });
      }

      const fresh = await Complaint.findById(c._id).populate('department', 'name');
      return mapComplaint(fresh);
    },

    gqlReplyToComplaint: async (_, { id, body }, ctx) => {
      const { user } = ctx;
      assertAuth(user);
      if (!body?.trim()) {
        throw new GraphQLError('Empty body', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      if (user.role !== 'dept_admin' && user.role !== 'college_admin') {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
      }

      const c = await Complaint.findById(id);
      if (!c) throw new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND', http: { status: 404 } } });

      if (user.role === 'dept_admin') {
        if (!c.college.equals(user.college) || !c.department.equals(user.department)) {
          throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
        }
      } else if (!c.college.equals(user.college)) {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
      }

      c.replies.push({
        author: user._id,
        role: user.role,
        body: body.trim(),
        createdAt: new Date(),
      });
      c.lastStaffActionAt = new Date();
      await c.save();

      const io = ctx.req?.app?.get?.('io');
      if (c.submitter && io) {
        io.to(`user:${c.submitter.toString()}`).emit('complaint:reply', { id: c._id });
      }

      const fresh = await Complaint.findById(c._id).populate('department', 'name');
      return mapComplaint(fresh);
    },
  },
};
