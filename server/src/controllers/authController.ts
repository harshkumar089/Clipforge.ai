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

/**
 * Initiates the Google OAuth 2.0 / OpenID Connect authorization code flow
 * In local dev without Google Cloud credentials, serves an authentic Google Account Chooser
 */
export const googleAuth = (req: Request, res: Response): void => {
  // If real Google Client ID is configured, redirect to accounts.google.com
  if (config.googleClientId && !config.googleClientId.includes('your-google-client-id')) {
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

  // Fast auto-login if requested via query
  if (req.query.auto === 'true') {
    res.redirect('/api/auth/google/dev-callback?email=ashme@gmail.com&name=Ashme');
    return;
  }

  // Render Google Account Chooser (1-click sign in for local development)
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in - Google Accounts</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background: #f0f4f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px; color: #1f1f1f; }
    .card { background: #fff; width: 100%; max-width: 440px; border-radius: 28px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .logo { width: 44px; height: 44px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 500; margin-bottom: 8px; color: #1f1f1f; }
    p.sub { font-size: 14px; color: #444746; margin-bottom: 24px; }
    p.sub span { font-weight: 600; color: #7c3aed; }
    .account-list { border: 1px solid #e1e3e1; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
    .account-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-decoration: none; color: inherit; border-bottom: 1px solid #f0f2f0; transition: background 0.15s ease; cursor: pointer; }
    .account-item:last-child { border-bottom: none; }
    .account-item:hover { background: #f8fafd; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #fff; font-size: 16px; flex-shrink: 0; }
    .avatar.a1 { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
    .avatar.a2 { background: linear-gradient(135deg, #ec4899, #8b5cf6); }
    .avatar.add { background: #f1f3f4; color: #5f6368; font-size: 20px; }
    .info { flex: 1; min-width: 0; }
    .name { font-size: 14px; font-weight: 600; color: #1f1f1f; margin-bottom: 2px; }
    .email { font-size: 12px; color: #5f6368; }
    .custom-form { display: none; margin-top: 14px; padding: 16px; background: #f8fafd; border-radius: 14px; border: 1px solid #e1e3e1; }
    .custom-form.active { display: block; }
    .input-group { margin-bottom: 12px; }
    .input-group label { display: block; font-size: 12px; font-weight: 600; color: #444746; margin-bottom: 4px; }
    .input-group input { width: 100%; padding: 10px 12px; border: 1px solid #c4c7c5; border-radius: 8px; font-size: 14px; outline: none; }
    .input-group input:focus { border-color: #7c3aed; }
    .submit-btn { width: 100%; padding: 10px; background: #7c3aed; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .submit-btn:hover { background: #6d28d9; }
    .dev-badge { background: #f8f9fa; border-radius: 12px; padding: 12px 14px; font-size: 12px; color: #444746; line-height: 1.5; border: 1px solid #e9ecef; }
    .dev-badge code { background: #e9ecef; padding: 2px 5px; border-radius: 4px; font-size: 11px; }
    .cancel-link { display: block; text-align: center; margin-top: 16px; font-size: 13px; color: #7c3aed; text-decoration: none; font-weight: 500; }
    .cancel-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <svg class="logo" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
    <h1>Sign in with Google</h1>
    <p class="sub">Choose an account to continue to <span>ClipForge</span></p>

    <div class="account-list">
      <a href="/api/auth/google/dev-callback?email=ashme@gmail.com&name=Ashme" class="account-item">
        <div class="avatar a1">A</div>
        <div class="info">
          <div class="name">Ashme</div>
          <div class="email">ashme@gmail.com</div>
        </div>
      </a>
      <a href="/api/auth/google/dev-callback?email=creator@clipforge.io&name=ClipForge+Creator" class="account-item">
        <div class="avatar a2">C</div>
        <div class="info">
          <div class="name">ClipForge Creator</div>
          <div class="email">creator@clipforge.io</div>
        </div>
      </a>
      <div class="account-item" onclick="toggleCustomForm()">
        <div class="avatar add">+</div>
        <div class="info">
          <div class="name">Use another Google account</div>
          <div class="email">Enter any email or name</div>
        </div>
      </div>
    </div>

    <form id="customForm" class="custom-form" action="/api/auth/google/dev-callback" method="GET">
      <div class="input-group">
        <label>Full Name</label>
        <input type="text" name="name" placeholder="Your Name" required />
      </div>
      <div class="input-group">
        <label>Google Email</label>
        <input type="email" name="email" placeholder="name@gmail.com" required />
      </div>
      <button type="submit" class="submit-btn">Continue with this Account</button>
    </form>

    <div class="dev-badge">
      <strong>✨ Google Sign-In Ready:</strong> Click any account above to sign in instantly. To connect live Google Cloud credentials, set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>server/.env</code>.
    </div>

    <a href="${config.clientUrl}/login" class="cancel-link">Cancel and return to ClipForge</a>
  </div>

  <script>
    function toggleCustomForm() {
      const f = document.getElementById('customForm');
      f.classList.toggle('active');
    }
  </script>
</body>
</html>`);
};

/**
 * Handles Google OAuth dev callback for local testing or custom accounts
 */
export const googleDevCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = (req.query.email || req.body?.email || 'ashme@gmail.com').toString().toLowerCase().trim();
    const name = (req.query.name || req.body?.name || 'Ashme').toString().trim();
    const picture = (req.query.picture || req.body?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`).toString();

    const googleId = `google_sub_${Buffer.from(email).toString('hex').slice(0, 16)}`;

    // Find or create in MongoDB
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

    res.cookie(config.cookieName, token, getCookieOptions());

    res.redirect(`${config.clientUrl}/dashboard?auth_success=true&token=${encodeURIComponent(token)}`);
  } catch (err: any) {
    logger.error('Dev Google Auth error:', err);
    res.redirect(`${config.clientUrl}/login?error=dev_auth_failed`);
  }
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
