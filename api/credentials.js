import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Log environment variables (without exposing sensitive data)
console.log('Supabase URL exists:', !!process.env.VITE_SUPABASE_URL);
console.log('Service Role Key exists:', !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase client with error handling
let supabase;
try {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the action from query parameters
  const { action } = req.query;

  if (!action || !['login', 'signup', 'upload'].includes(action)) {
    return res.status(400).json({ 
      error: 'Invalid action',
      details: 'Please specify a valid action (login, signup, or upload) in the query parameters'
    });
  }

  try {
    if (action === 'signup') {
      return await handleSignup(req, res);
    } else if (action === 'login') {
      return await handleLogin(req, res);
    } else if (action === 'upload') {
      return await handleUpload(req, res);
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
        error: 'Invalid credentials',
        details: 'The email or password you entered is incorrect'
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
    // Parse the form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        details: 'Only JPEG, PNG, and GIF images are allowed'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({ 
        error: 'File too large',
        details: 'Maximum file size is 5MB'
      });
    }

    // Read the file
    const fileData = fs.readFileSync(file.filepath);

    // Generate a unique file name
    const fileName = `profile-${Date.now()}.${file.originalFilename.split('.').pop()}`;
    const filePath = `avatars/${fileName}`;

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
      console.error('Upload error:', error);
      return res.status(400).json({ error: error.message });
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
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
} 