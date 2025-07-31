/* eslint-disable */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/conversations
// Get all conversations for the current user
export async function GET(req: Request) {
  try {
    console.log('GET /api/conversations - Starting request');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('GET /api/conversations - Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('GET /api/conversations - User ID:', session.user.id);
    
    // In a real implementation, this would fetch conversations from the database
    // For now, we'll return mock data
    const conversations = [
      {
        id: 'conv_1',
        participants: [
          {
            id: 'user2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'MENTOR',
            isOnline: true
          },
          {
            id: session.user.id,
            name: session.user.name || 'User',
            email: session.user.email || '',
            role: (session.user as any)?.role || 'STUDENT',
            isOnline: true
          }
        ],
        lastMessage: {
          id: 'msg_1',
          senderId: 'user2',
          content: 'Hi there! How can I help you today?',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          isRead: false
        },
        unreadCount: 1,
        isGroupChat: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ];
    
    console.log('Returning conversations:', conversations);
    
    // Return the conversations array directly as the response
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/conversations
// Create a new conversation
export async function POST(req: Request) {
  try {
    console.log('POST /api/conversations - Starting request');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('POST /api/conversations - Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { participantId, message } = await req.json();
    
    console.log('Received request with:', { participantId, message });
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    if (!message?.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would create a conversation in the database
    // For now, we'll return a mock response
    const conversation = {
      id: `conv_${Date.now()}`,
      participants: [
        {
          id: session.user.id,
          name: session.user.name || 'User',
          email: session.user.email || '',
          role: (session.user as any)?.role || 'STUDENT',
          isOnline: true
        },
        {
          id: participantId,
          name: message.senderName || 'Recipient',
          role: message.senderRole || 'STUDENT',
          isOnline: false
        }
      ],
      lastMessage: {
        id: `msg_${Date.now()}`,
        senderId: session.user.id,
        content: message.content,
        timestamp: new Date().toISOString(),
        isRead: false
      },
      unreadCount: 0,
      isGroupChat: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Created conversation:', conversation);
    
    // Return the conversation object directly as the response
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
