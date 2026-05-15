export const typeDefs = `#graphql
  type College {
    id: ID!
    name: String!
    city: String!
    enabled: Boolean!
  }

  type Department {
    id: ID!
    name: String!
    collegeId: ID!
  }

  type UserGql {
    id: ID!
    email: String!
    name: String
    role: String!
    approved: Boolean!
    profileComplete: Boolean!
    collegeId: ID
    departmentId: ID
  }

  type ComplaintGql {
    id: ID!
    title: String!
    description: String!
    stage: String!
    priority: String!
    category: String!
    sentiment: String!
    anonymous: Boolean!
    escalationLevel: Int!
    createdAt: String!
    departmentName: String
  }

  type Query {
    """Public onboarding helpers (no auth)."""
    gqlCities: [String!]!
    gqlColleges(city: String): [College!]!
    gqlDepartments(collegeId: ID!): [Department!]!

    """Current profile — requires Bearer JWT."""
    gqlMe: UserGql

    """Complaints visible to your role (same rules as REST GET /api/complaints)."""
    gqlComplaints(stage: String, category: String): [ComplaintGql!]!

    """Single complaint if your role may access it."""
    gqlComplaint(id: ID!): ComplaintGql
  }

  type Mutation {
    """Department / college / platform staff — move complaint stage."""
    gqlUpdateComplaintStage(id: ID!, stage: String!): ComplaintGql!

    """Department or college staff — text reply to submitter."""
    gqlReplyToComplaint(id: ID!, body: String!): ComplaintGql!
  }
`;
