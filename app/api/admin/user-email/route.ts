import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userUuid = searchParams.get('uuid');
    
    console.log('[user-email] Request for UUID:', userUuid);
    
    if (!userUuid) {
      return NextResponse.json({ error: 'Missing uuid parameter' }, { status: 400 });
    }
    
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL;
    
    console.log('[user-email] Config check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
      url: supabaseUrl ? 'present' : 'MISSING'
    });
    
    if (!supabaseUrl) {
      console.error('[user-email] Supabase URL not configured');
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 });
    }
    
    if (!serviceRoleKey) {
      console.error('[user-email] Service role key not configured');
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }
    
    console.log('[user-email] Creating admin client...');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('[user-email] Fetching user by ID:', userUuid);
    
    // Get user email from Supabase Auth by ID
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userUuid);
    
    console.log('[user-email] Result:', { user: user?.email, error: error?.message });
    
    if (error) {
      console.error('[user-email] Error fetching user:', error);
      return NextResponse.json({ email: null }, { status: 200 });
    }
    
    if (!user || !user.email) {
      console.log('[user-email] User not found or no email');
      return NextResponse.json({ email: null }, { status: 200 });
    }
    
    console.log('[user-email] Success! Email:', user.email);
    return NextResponse.json({ email: user.email }, { status: 200 });
  } catch (error) {
    console.error('[user-email] Unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

