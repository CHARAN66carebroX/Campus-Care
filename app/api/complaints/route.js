import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectToDatabase from '@/lib/mongodb';
import Complaint from '@/models/Complaint';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, category, priority, departmentId, isAnonymous, attachments } = await req.json();

    if (!title || !description || !category || !departmentId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Basic sentiment analysis logic (dummy implementation)
    let sentiment = 'unknown';
    const descLower = description.toLowerCase();
    if (descLower.includes('urgent') || descLower.includes('immediately')) sentiment = 'urgent';
    else if (descLower.includes('frustrating') || descLower.includes('annoying')) sentiment = 'frustrated';
    else if (descLower.includes('please check') || descLower.includes('concern')) sentiment = 'concerned';
    else sentiment = 'calm';

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      status: 'Pending',
      sentiment,
      isAnonymous,
      attachments: attachments || [],
      studentId: session.user.id,
      collegeId: session.user.collegeId, // Assuming student has collegeId in session
      departmentId, // The target department
    });

    return NextResponse.json({ message: 'Complaint created', complaint }, { status: 201 });
  } catch (error) {
    console.error('Create Complaint Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let query = {};

    // Filter based on role
    if (session.user.role === 'student') {
      query.studentId = session.user.id;
    } else if (session.user.role === 'dept_admin') {
      query.departmentId = session.user.departmentId;
    } else if (session.user.role === 'college_admin') {
      query.collegeId = session.user.collegeId;
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ complaints }, { status: 200 });
  } catch (error) {
    console.error('Fetch Complaints Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
