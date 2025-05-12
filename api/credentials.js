import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Log environment variables (without exposing sensitive data)
// console.log('Supabase URL exists:', !!process.env.SUPABASE_URL);
// console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase client with error handling
let supabase;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in environment variables');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error('Invalid Supabase URL format. Expected format: https://your-project-id.supabase.co');
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error.message);
  throw error;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Set response headers
  res.setHeader('Content-Type', 'application/json');

  // Handle GET requests for profile action
  if (req.method === 'GET' && req.query.action === 'profile') {
    return await handleProfile(req, res);
  }

  // Handle DELETE requests for delete account action
  if (req.method === 'DELETE' && req.query.action === 'profile') {
    return await handleDeleteAccount(req, res);
  }

  // For all other actions, only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the action from query parameters
  const { action } = req.query;

  if (!action || !['login', 'signup', 'upload', 'validate', 'refresh'].includes(action)) {
    return res.status(400).json({ 
      error: 'Invalid action',
      details: 'Please specify a valid action (login, signup, upload, validate, or refresh) in the query parameters'
    });
  }

  try {
    if (action === 'signup') {
      return await handleSignup(req, res);
    } else if (action === 'login') {
      return await handleLogin(req, res);
    } else if (action === 'upload') {
      return await handleUpload(req, res);
    } else if (action === 'validate') {
      return await handleValidate(req, res);
    } else if (action === 'refresh') {
      return await handleRefresh(req, res);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleSignup(req, res) {
  const {
    email,
    password,
    firstName,
    lastName,
    country,
    city,
    dateOfBirth,
    phoneNumber,
    gender,
    linkedinUrl,
    twitterUrl,
    githubUrl,
    websiteUrl,
    profilePictureUrl
  } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!email) missingFields.push('email');
  if (!password) missingFields.push('password');
  if (!firstName) missingFields.push('firstName');
  if (!lastName) missingFields.push('lastName');

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: {
        missingFields,
        message: `The following fields are required: ${missingFields.join(', ')}`
      }
    });
  }

  // Check if user exists in users table first
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking for existing user:', checkError);
    return res.status(500).json({ 
      error: 'Error checking user existence',
      details: checkError.message
    });
  }

  if (existingUser) {
    return res.status(400).json({ 
      error: 'User already exists',
      details: 'A user with this email already exists in the system'
    });
  }

  // Create the user in Supabase Auth with all metadata
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      country,
      city,
      date_of_birth: dateOfBirth,
      phone_number: phoneNumber,
      gender,
      linkedin_url: linkedinUrl,
      twitter_url: twitterUrl,
      github_url: githubUrl,
      website_url: websiteUrl,
      profile_picture_url: profilePictureUrl
    }
  });

  if (authError) {
    if (authError.message.includes('User already registered')) {
      return res.status(400).json({ 
        error: 'Email already registered',
        details: 'This email address is already in use'
      });
    }

    return res.status(400).json({ 
      error: 'Failed to create user',
      details: authError.message,
      code: authError.code
    });
  }

  const userId = authData.user.id;

  // Wait a moment for the trigger to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update the user profile with any additional information
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      country: country || null,
      city: city || null,
      date_of_birth: dateOfBirth || null,
      phone_number: phoneNumber || null,
      gender: gender || null,
      linkedin_url: linkedinUrl || null,
      twitter_url: twitterUrl || null,
      github_url: githubUrl || null,
      website_url: websiteUrl || null,
      profile_picture_url: profilePictureUrl || null
    })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    // Attempt to delete the auth user if profile update fails
    await supabase.auth.admin.deleteUser(userId);
    return res.status(400).json({ 
      error: 'Failed to update user profile',
      details: updateError.message
    });
  }

  return res.status(200).json({ 
    success: true,
    message: 'User created successfully',
    userId,
    user: {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      profile_picture_url: profilePictureUrl
    }
  });
}

async function handleLogin(req, res) {
  const { email, password, rememberMe } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'Email and password are required'
    });
  }

  // First check if the email exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking for existing user:', checkError);
    return res.status(500).json({ 
      error: 'Error checking user existence',
      details: checkError.message
    });
  }

  if (!existingUser) {
    return res.status(401).json({ 
      error: 'Invalid email',
      details: 'No account found with this email address'
    });
  }

  // Sign in the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      persistSession: rememberMe
    }
  });

  if (authError) {
    if (authError.message.includes('Invalid login credentials')) {
      return res.status(401).json({ 
        error: 'Invalid password',
        details: 'The password you entered is incorrect'
      });
    }

    return res.status(400).json({ 
      error: 'Authentication failed',
      details: authError.message
    });
  }

  // Get the user's profile from the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError) {
    return res.status(500).json({ 
      error: 'Failed to fetch user profile',
      details: userError.message
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    session: authData.session,
    user: {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      profile_picture_url: userData.profile_picture_url
    }
  });
}

async function handleUpload(req, res) {
  try {
    // Set proper headers for file upload
    res.setHeader('Content-Type', 'application/json');

    // Parse the form data with more options
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image/');
      }
    });

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Please select a file to upload'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        details: 'Only JPEG, PNG, and GIF images are allowed'
      });
    }

    // Read the file
    const fileData = fs.readFileSync(file.filepath);

    // Generate a unique file name
    const fileName = `profile-${Date.now()}.${file.originalFilename.split('.').pop()}`;
    const filePath = `avatars/${fileName}`;

    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, fileData, {
          contentType: file.mimetype,
          upsert: true
        });

      // Clean up the temporary file
      fs.unlinkSync(file.filepath);

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(400).json({ 
          error: 'Failed to upload file',
          details: error.message
        });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      return res.status(200).json({ 
        success: true,
        url: publicUrl,
        filePath: filePath
      });
    } catch (uploadError) {
      // Clean up the temporary file in case of error
      if (file.filepath && fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
      throw uploadError;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleProfile(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token and get the user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get the user's profile from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      console.error('User profile error:', userError);
      return res.status(500).json({ 
        error: 'Failed to fetch user profile',
        details: userError.message
      });
    }

    // Return the user data
    return res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        profile_picture_url: userData.profile_picture_url,
        country: userData.country,
        city: userData.city,
        date_of_birth: userData.date_of_birth,
        phone_number: userData.phone_number,
        gender: userData.gender,
        linkedin_url: userData.linkedin_url,
        twitter_url: userData.twitter_url,
        github_url: userData.github_url,
        website_url: userData.website_url,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleDeleteAccount(req, res) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token and get the user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Delete the user from the users table first
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', authUser.id);

    if (deleteUserError) {
      console.error('Delete user error:', deleteUserError);
      return res.status(500).json({ 
        error: 'Failed to delete user data',
        details: deleteUserError.message
      });
    }

    // Delete the user from Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.id);
    if (deleteAuthError) {
      console.error('Delete auth user error:', deleteAuthError);
      return res.status(500).json({ 
        error: 'Failed to delete user account',
        details: deleteAuthError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleValidate(req, res) {
  const { session } = req.body;

  if (!session) {
    return res.status(400).json({ 
      error: 'Missing session',
      details: 'Session data is required'
    });
  }

  try {
    // Verify the token and get the user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(session.access_token);
    
    if (authError) {
      // If token is expired, try to refresh it
      if (authError.message.includes('expired')) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: session.refresh_token
        });

        if (refreshError) {
          return res.status(401).json({ 
            error: 'Session expired',
            details: 'Please log in again'
          });
        }

        // Return the refreshed session
        return res.status(200).json({
          success: true,
          session: refreshData.session
        });
      }

      return res.status(401).json({ 
        error: 'Invalid session',
        details: authError.message
      });
    }

    // Session is valid, return success
    return res.status(200).json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleRefresh(req, res) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ 
      error: 'Missing refresh token',
      details: 'Refresh token is required'
    });
  }

  try {
    // Attempt to refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (refreshError) {
      console.error('Token refresh error:', refreshError);
      return res.status(401).json({ 
        error: 'Token refresh failed',
        details: refreshError.message
      });
    }

    // Return the new session
    return res.status(200).json({
      success: true,
      session: refreshData.session
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
} 