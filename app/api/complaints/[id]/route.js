import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import Complaint from '@/models/Complaint';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'student') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { status, escalationLevel } = await req.json();

    await connectToDatabase();

    const updateData = {};
    if (status) updateData.status = status;
    if (escalationLevel !== undefined) updateData.escalationLevel = escalationLevel;

    const complaint = await Complaint.findByIdAndUpdate(id, updateData, { new: true });

    if (!complaint) {
      return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }

    // TODO: Trigger Socket.IO event here to notify student

    return NextResponse.json({ message: 'Complaint updated', complaint }, { status: 200 });
  } catch (error) {
    console.error('Update Complaint Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
