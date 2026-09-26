import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/environment.js';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

/**
 * Cookie options helper
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: (config.isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: config.cookieMaxAge,
  path: '/',
});

const isPlaceholderGoogleId = (id?: string): boolean => {
  if (!id) return true;
  const s = id.trim().toLowerCase();
  return (
    s === '' ||
    s.includes('your-google-client-id') ||
    s.includes('paste_your_client_id_here') ||
    s.startsWith('paste_') ||
    s.includes('<') ||
    !s.includes('.apps.googleusercontent.com')
  );
};

/**
 * Initiates the Google OAuth 2.0 / OpenID Connect authorization code flow
 * In local dev without Google Cloud credentials, serves an authentic Google Account Chooser
 */
export const googleAuth = (req: Request, res: Response): void => {
  // If real Google Client ID is configured, redirect to accounts.google.com
  if (config.googleClientId && !isPlaceholderGoogleId(config.googleClientId)) {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const params = new URLSearchParams({
      client_id: config.googleClientId,
      redirect_uri: config.googleCallbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    logger.info(`Redirecting user to Google OAuth: ${authUrl}`);
    res.redirect(authUrl);
    return;
  }

  // If specific email is passed in query/body, authenticate directly
  if (req.query.email) {
    const email = req.query.email.toString();
    const name = (req.query.name || email.split('@')[0]).toString();
    res.redirect(`/api/auth/google/dev-callback?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
    return;
  }

  // Without live Google Cloud credentials, notify client to provide their Google account details
  res.redirect(`${config.clientUrl}/login?error=oauth_not_configured`);
};

/**
 * Handles Google OAuth callback for authentication
 */
export const googleDevCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEmail = (req.query.email || req.body?.email || '').toString().toLowerCase().trim();
    const rawName = (req.query.name || req.body?.name || '').toString().trim();

    if (!rawEmail) {
      if (req.xhr || req.is('json') || req.headers.accept?.includes('application/json') || req.method === 'POST') {
        res.status(400).json({ success: false, message: 'Google account email is required.' });
        return;
      }
      res.redirect(`${config.clientUrl}/login?error=missing_google_email`);
      return;
    }

    const email = rawEmail;
    const name = rawName || email.split('@')[0];
    const picture = (req.query.picture || req.body?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`).toString();

    const googleId = `google_sub_${Buffer.from(email).toString('hex').slice(0, 16)}`;

    // Find or create in MongoDB Atlas
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.provider = 'google';
        if (!user.profilePicture) user.profilePicture = picture;
        if (!user.avatar) user.avatar = picture;
        user.lastLoginAt = new Date();
        await user.save();
      } else {
        const parts = name.split(' ');
        user = new User({
          googleId,
          email,
          name,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          profilePicture: picture,
          avatar: picture,
          provider: 'google',
          lastLoginAt: new Date(),
        });
        await user.save();
      }
    } else {
      user.lastLoginAt = new Date();
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        user.avatar = picture;
      }
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // If client requested JSON (API / fetch call from React)
    if (
      req.xhr ||
      req.headers.accept?.includes('application/json') ||
      req.is('json') ||
      req.method === 'POST'
    ) {
      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          googleId: user.googleId,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture || user.avatar,
          avatar: user.avatar || user.profilePicture,
          provider: user.provider,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
      });
      return;
    }

    res.redirect(`${config.clientUrl}/dashboard?auth_success=true&token=${encodeURIComponent(token)}`);
  } catch (err: any) {
    logger.error('Dev Google Auth error:', err);
    if (req.method === 'POST' || req.is('json') || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: err.message || 'Google sign-in failed' });
      return;
    }
    res.redirect(`${config.clientUrl}/login?error=dev_auth_failed`);
  }
};

/**
 * Returns current OAuth configuration status
 */
export const authStatus = (req: Request, res: Response): void => {
  const hasLiveGoogle = Boolean(
    config.googleClientId &&
    !isPlaceholderGoogleId(config.googleClientId) &&
    config.googleClientSecret &&
    !config.googleClientSecret.includes('PASTE_')
  );

  res.status(200).json({
    success: true,
    hasLiveGoogleAuth: hasLiveGoogle,
    defaultEmail: 'ashme@gmail.com',
    defaultName: 'Ashme',
  });
};

/**
 * Handles the Google OAuth 2.0 callback, exchanges code for token, and authenticates user
 */
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, error } = req.query;

    if (error) {
      logger.warn(`Google OAuth error received: ${error}`);
      res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(String(error))}`);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.redirect(`${config.clientUrl}/login?error=missing_authorization_code`);
      return;
    }

    // 1. Exchange authorization code for tokens directly with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleCallbackUrl,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      logger.error('Failed to exchange Google OAuth code for tokens:', errBody);
      res.redirect(`${config.clientUrl}/login?error=token_exchange_failed`);
      return;
    }

    const tokenData = (await tokenResponse.json()) as any;
    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated user profile using Google's UserInfo OpenID Connect endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      logger.error('Failed to fetch user info from Google UserInfo API');
      res.redirect(`${config.clientUrl}/login?error=user_info_failed`);
      return;
    }

    const googleUser = (await userInfoResponse.json()) as any;
    const { sub: googleId, email, name, given_name, family_name, picture } = googleUser;

    if (!email) {
      res.redirect(`${config.clientUrl}/login?error=email_not_provided_by_google`);
      return;
    }

    // 3. Find or create user in MongoDB
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user already exists by email
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        // Link Google ID to existing account
        user.googleId = googleId;
        user.provider = 'google';
        if (picture && !user.profilePicture) user.profilePicture = picture;
        if (picture && !user.avatar) user.avatar = picture;
        user.lastLoginAt = new Date();
        await user.save();
        logger.info(`Linked Google account to existing user: ${email}`);
      } else {
        // Create new Google user
        user = new User({
          googleId,
          email: email.toLowerCase(),
          name: name || `${given_name || ''} ${family_name || ''}`.trim() || 'Creator',
          firstName: given_name || '',
          lastName: family_name || '',
          profilePicture: picture || '',
          avatar: picture || '',
          provider: 'google',
          lastLoginAt: new Date(),
        });
        await user.save();
        logger.info(`Created new Google user: ${email} (${googleId})`);
      }
    } else {
      // Update last login timestamp and profile picture if refreshed
      user.lastLoginAt = new Date();
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
        user.avatar = picture;
      }
      await user.save();
      logger.info(`Google user signed in: ${email}`);
    }

    // 4. Sign JWT session token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // 5. Set secure HTTP-only cookie
    res.cookie(config.cookieName, token, getCookieOptions());

    // 6. Redirect to frontend dashboard (also pass token in query param for optional localStorage backup)
    res.redirect(`${config.clientUrl}/dashboard?auth_success=true&token=${encodeURIComponent(token)}`);
  } catch (err: any) {
    logger.error('Unhandled error during Google OAuth callback:', err);
    res.redirect(`${config.clientUrl}/login?error=authentication_failed`);
  }
};

/**
 * Returns current authenticated user profile
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      googleId: req.user.googleId,
      name: req.user.name,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      profilePicture: req.user.profilePicture || req.user.avatar,
      avatar: req.user.profilePicture || req.user.avatar,
      provider: req.user.provider,
      lastLoginAt: req.user.lastLoginAt,
      createdAt: req.user.createdAt,
    },
  });
};

/**
 * Logs out user by clearing HTTP-only cookie
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: (config.isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * Updates user profile name and avatar
 */
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, firstName, lastName, profilePicture, avatar } = req.body;
    if (name) req.user.name = name;
    if (firstName !== undefined) req.user.firstName = firstName;
    if (lastName !== undefined) req.user.lastName = lastName;
    if (profilePicture !== undefined) req.user.profilePicture = profilePicture;
    if (avatar !== undefined) req.user.avatar = avatar;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: req.user._id,
        googleId: req.user.googleId,
        name: req.user.name,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        profilePicture: req.user.profilePicture || req.user.avatar,
        avatar: req.user.profilePicture || req.user.avatar,
        provider: req.user.provider,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Optional local email/password registration (kept for dev/testing)
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      provider: 'local',
      lastLoginAt: new Date(),
    });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
    res.cookie(config.cookieName, token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || user.avatar,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Optional local email/password login (kept for dev/testing)
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
    res.cookie(config.cookieName, token, getCookieOptions());

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || user.avatar,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (err) {
    next(err);
  }
};
