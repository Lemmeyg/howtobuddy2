import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Starting registration process...');
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed:', { email: body.email, hasPassword: !!body.password });
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields:', { hasEmail: !!email, hasPassword: !!password });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabase = createRouteHandlerClient({ cookies });

    // Attempt to sign up
    console.log('Attempting to sign up user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.headers.get('origin')}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase auth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      });
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 400 }
      );
    }

    if (!data?.user) {
      console.error('No user data returned from Supabase');
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    console.log('Registration successful:', { userId: data.user.id });
    return NextResponse.json(
      { 
        message: 'Registration successful. Please check your email to verify your account.',
        user: data.user 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 