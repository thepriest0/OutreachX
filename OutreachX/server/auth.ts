import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertInvitationSchema, acceptInvitationSchema } from "@shared/schema";
import { invitationService } from "./services/invitationService";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-session-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: 'outreach.sid',
    cookie: {
      secure: isProduction, // HTTPS required in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax' // Keep lax for better compatibility
    },
    rolling: true
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Initial setup route - only works when no users exist
  app.post("/api/setup-admin", async (req, res, next) => {
    try {
      const userCount = await storage.getUserCount();
      if (userCount > 0) {
        return res.status(403).json({ message: "Admin user already exists" });
      }

      const { username, email, password, firstName, lastName } = req.body;
      
      // Validate required fields
      if (!username || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Username, password, first name, and last name are required" });
      }

      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
        role: 'head_admin',
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    } catch (error) {
      console.error('Admin setup error:', error);
      res.status(500).json({ message: "Admin setup failed" });
    }
  });

  // Check if setup is needed
  app.get("/api/setup-needed", async (req, res) => {
    try {
      const userCount = await storage.getUserCount();
      res.json({ setupNeeded: userCount === 0 });
    } catch (error) {
      console.error('Setup check error:', error);
      res.status(500).json({ message: "Failed to check setup status" });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    console.log('🔐 LOGIN ATTEMPT:', { 
      username: req.body.username,
      hasPassword: !!req.body.password,
      sessionID: req.sessionID 
    });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('🔐 LOGIN ERROR:', err);
        return res.status(500).json({ message: "Internal server error" });
      }
      
      if (!user) {
        console.log('🔐 LOGIN FAILED:', info?.message || 'Invalid credentials');
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('🔐 SESSION LOGIN ERROR:', loginErr);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        
        console.log('🔐 LOGIN SUCCESS:', { 
          userId: user.id, 
          username: user.username,
          sessionID: req.sessionID 
        });
        
        res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  });

  // Session debug endpoint
  app.get("/api/session-debug", (req, res) => {
    res.json({
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
      session: {
        cookie: req.session.cookie,
        passport: (req.session as any).passport || null
      }
    });
  });

  // Admin routes for user management
  app.get("/api/admin/users", requireRole(['head_admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireRole(['head_admin']), async (req: any, res) => {
    try {
      const { email, role } = req.body;
      
      // Validate input
      const validatedData = insertInvitationSchema.parse({ email, role });
      
      const result = await invitationService.createInvitation(
        validatedData.email,
        validatedData.role,
        req.user.id
      );

      if (result.success) {
        res.status(201).json({
          message: "Invitation sent successfully",
          invitation: {
            id: result.invitation.id,
            email: result.invitation.email,
            role: result.invitation.role,
            status: result.invitation.status,
            createdAt: result.invitation.createdAt,
            expiresAt: result.invitation.expiresAt,
          }
        });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.put("/api/admin/users/:id", requireRole(['head_admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, firstName, lastName, role } = req.body;
      
      // Prevent admin from modifying head_admin
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.role === 'head_admin' && req.user?.role !== 'head_admin') {
        return res.status(403).json({ message: "Cannot modify head admin" });
      }

      const user = await storage.updateUser(id, {
        username,
        email,
        firstName,
        lastName,
        role,
      });

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireRole(['head_admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting head_admin
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.role === 'head_admin') {
        return res.status(403).json({ message: "Cannot delete head admin" });
      }

      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Invitation management routes
  app.post("/api/admin/invitations", requireRole(['head_admin']), async (req: any, res) => {
    try {
      const { email, role } = req.body;
      
      // Validate input
      const validatedData = insertInvitationSchema.parse({ email, role });
      
      console.log(`🔄 Creating invitation for ${email} with role ${role} by user ${req.user.id}`);
      
      const result = await invitationService.createInvitation(
        validatedData.email,
        validatedData.role,
        req.user.id
      );

      if (result.success) {
        console.log(`✅ Invitation created successfully for ${email}`);
        res.status(201).json({
          message: "Invitation sent successfully",
          invitation: {
            id: result.invitation.id,
            email: result.invitation.email,
            role: result.invitation.role,
            status: result.invitation.status,
            createdAt: result.invitation.createdAt,
            expiresAt: result.invitation.expiresAt,
          }
        });
      } else {
        console.log(`❌ Failed to create invitation for ${email}: ${result.error}`);
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.get("/api/admin/invitations", requireRole(['head_admin']), async (req, res) => {
    try {
      const invitations = await storage.getAllInvitations();
      res.json(invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.delete("/api/admin/invitations/:id", requireRole(['head_admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvitation(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Public invitation routes (no authentication required)
  app.get("/api/invitations/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const validation = await invitationService.validateInvitation(token);
      
      if (validation.valid) {
        res.json({
          valid: true,
          email: validation.invitation.email,
          role: validation.invitation.role,
        });
      } else {
        res.status(400).json({ valid: false, error: validation.error });
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      res.status(500).json({ valid: false, error: "Failed to validate invitation" });
    }
  });

  app.post("/api/invitations/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { username, password, firstName, lastName } = req.body;
      
      const validatedData = acceptInvitationSchema.parse({
        token,
        username,
        password,
        firstName,
        lastName,
      });

      const result = await invitationService.acceptInvitation(token, {
        username: validatedData.username,
        password: await hashPassword(validatedData.password),
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      if (result.success) {
        res.json({ 
          success: true, 
          message: "Account created successfully",
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
          }
        });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ success: false, error: "Failed to accept invitation" });
    }
  });

  // User profile routes
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, email, username } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Validate required fields
      if (!firstName || !lastName || !username) {
        return res.status(400).json({ message: "First name, last name, and username are required" });
      }

      // Check if username is already taken by another user
      if (username !== req.user?.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }

      // Update user profile
      await storage.updateUser(userId, {
        firstName,
        lastName,
        email: email || null,
        username,
      });

      const updatedUser = await storage.getUser(userId);
      res.json({ 
        message: "Profile updated successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/user/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(userId, {
        password: hashedNewPassword,
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Invitation routes
  app.get("/api/admin/invitations", requireRole(['head_admin']), async (req, res) => {
    try {
      const invitations = await storage.getAllInvitations();
      const safeInvitations = invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        acceptedAt: invitation.acceptedAt,
      }));
      res.json(safeInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.delete("/api/admin/invitations/:id", requireRole(['head_admin']), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvitation(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Public invitation routes
  app.get("/api/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const validation = await invitationService.validateInvitation(token);
      
      if (validation.valid) {
        res.json({
          valid: true,
          email: validation.invitation.email,
          role: validation.invitation.role,
        });
      } else {
        res.status(400).json({
          valid: false,
          error: validation.error,
        });
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      res.status(500).json({ message: "Failed to validate invitation" });
    }
  });

  app.post("/api/invite/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const validatedData = acceptInvitationSchema.parse(req.body);
      
      // Hash the password
      const hashedPassword = await hashPassword(validatedData.password);
      
      const result = await invitationService.acceptInvitation(validatedData.token, {
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      });

      if (result.success) {
        res.status(201).json({
          message: "Account created successfully",
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
          }
        });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to require specific roles
export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}