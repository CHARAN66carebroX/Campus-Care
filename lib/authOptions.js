import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import connectToDatabase from './mongodb';
import User from '@/models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isMatch = await user.comparePassword(credentials.password);
        if (!isMatch) {
          throw new Error('Invalid email or password');
        }

        if (!user.isApproved) {
          throw new Error('Your account is pending approval by the admin.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          collegeId: user.collegeId ? user.collegeId.toString() : null,
          departmentId: user.departmentId ? user.departmentId.toString() : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.collegeId = user.collegeId;
        token.departmentId = user.departmentId;
      }

      // Handle Google OAuth signup/login
      if (account?.provider === 'google') {
        await connectToDatabase();
        let dbUser = await User.findOne({ email: token.email });
        
        if (!dbUser) {
          // Create new user for google signup (needs additional info later maybe)
          dbUser = await User.create({
            name: profile.name,
            email: profile.email,
            authProvider: 'google',
            role: 'student', // default
            isApproved: true,
          });
        }
        token.id = dbUser._id.toString();
        token.role = dbUser.role;
        token.collegeId = dbUser.collegeId ? dbUser.collegeId.toString() : null;
        token.departmentId = dbUser.departmentId ? dbUser.departmentId.toString() : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.collegeId = token.collegeId;
        session.user.departmentId = token.departmentId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
