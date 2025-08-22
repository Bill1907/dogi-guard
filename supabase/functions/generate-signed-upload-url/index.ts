// Supabase Edge Function to generate signed upload URLs for dog photos
// This function uses service role to bypass RLS policies
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Signed Upload URL Generator Function Started")

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

// Service role client for storage operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Anon client for validating user tokens
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

Deno.serve(async (req) => {
  // CORS headers for web client compatibility
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Verify Authorization header exists
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header')
    }

    // Extract and verify Supabase JWT token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token using Supabase Auth (this validates the JWT)
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Token validation failed:', authError)
      throw new Error('Invalid or expired authentication token')
    }
    
    console.log('Authenticated user:', user.id)
    
    // Parse request body
    const requestBody = await req.json()
    const { fileName, bucket = 'dog-photos', contentType = 'image/jpeg' } = requestBody
    
    if (!fileName) {
      throw new Error('fileName is required')
    }

    // Validate fileName format (basic security check)
    if (!fileName.match(/^[a-zA-Z0-9\-_\/\.]+$/)) {
      throw new Error('Invalid fileName format')
    }
    
    // Ensure fileName starts with user's ID for security
    const expectedPrefix = `${user.id}/`
    if (!fileName.startsWith(expectedPrefix)) {
      throw new Error('Invalid file path - must be in user directory')
    }

    console.log(`Generating signed URL for: ${fileName} in bucket: ${bucket}`)

    // Generate signed upload URL using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(fileName, {
        upsert: false // Prevent overwriting existing files
      })

    if (error) {
      console.error('Supabase Storage error:', error)
      throw new Error(`Failed to generate signed URL: ${error.message}`)
    }

    if (!data?.signedUrl || !data?.path) {
      throw new Error('Invalid response from Supabase Storage')
    }

    console.log(`Successfully generated signed URL for: ${data.path}`)

    // Return signed URL and path info
    return new Response(
      JSON.stringify({ 
        signedUrl: data.signedUrl,
        path: data.path,
        bucket: bucket,
        expiresIn: '2 hours'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    
    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.includes('authorization') ? 401 : 
                      errorMessage.includes('Method not allowed') ? 405 : 400

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

/* To invoke locally:

  1. Start Supabase services:
     supabase start
     
  2. Serve the function:
     supabase functions serve generate-signed-upload-url
     
  3. Test with curl:
     curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-signed-upload-url' \
       --header 'Authorization: Bearer YOUR_CLERK_JWT_TOKEN' \
       --header 'Content-Type: application/json' \
       --data '{"fileName":"test_user_id/dog_photo_123456789_abc123.jpg"}'

  4. Expected response:
     {
       "signedUrl": "https://your-project.supabase.co/storage/v1/object/...",
       "path": "test_user_id/dog_photo_123456789_abc123.jpg",
       "bucket": "dog-photos",
       "expiresIn": "2 hours"
     }
*/