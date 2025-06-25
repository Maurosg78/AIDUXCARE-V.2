/**
 * 🔐 SISTEMA DE AUTENTICACIÓN ZERO-TRUST
 * Verificación continua de identidad con JWT + OAuth2 + MFA
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// import { OAuth2Client } from 'google-auth-library'; // ⛔ Solo usar en backend Node.js, nunca en frontend React
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'PHYSICIAN' | 'ADMIN' | 'VIEWER';
  specialty?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  permissions: Permission[];
  metadata: UserMetadata;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface UserMetadata {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceId?: string;
  lastActivity?: Date;
  sessionCount: number;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthContext {
  user: User;
  sessionId: string;
  permissions: Permission[];
  riskScore: number;
  lastVerified: Date;
}

export class ZeroTrustAuthService {
  private jwtSecret: string;
  private refreshSecret: string;
  // private googleClient: OAuth2Client; // ⛔ Solo usar en backend Node.js, nunca en frontend React
  private users: Map<string, User> = new Map();
  private sessions: Map<string, AuthContext> = new Map();
  private blacklistedTokens: Set<string> = new Set();

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'aiduxcare-super-secret-jwt-key-2025';
    this.refreshSecret = process.env.REFRESH_SECRET || 'aiduxcare-refresh-secret-2025';
    
    this.initializeDefaultUsers();
  }

  /**
   * Inicializa usuarios por defecto
   */
  private initializeDefaultUsers(): void {
    // Usuario OWNER (Mauricio)
    const ownerUser: User = {
      id: 'owner-001',
      email: 'msobarzo78@gmail.com',
      name: 'Mauricio Sobarzo',
      role: 'OWNER',
      specialty: 'General',
      mfaEnabled: false,
      loginAttempts: 0,
      permissions: [
        {
          resource: '*',
          actions: ['*']
        }
      ],
      metadata: {
        sessionCount: 0
      }
    };

    this.users.set(ownerUser.email, ownerUser);
  }

  /**
   * Registra nuevo usuario
   */
  async registerUser(userData: {
    email: string;
    name: string;
    password: string;
    specialty?: string;
  }): Promise<User> {
    // Verificar si usuario ya existe
    if (this.users.has(userData.email)) {
      throw new Error('Usuario ya existe');
    }

    // Validar email
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Email inválido');
    }

    // Validar contraseña
    if (!this.isValidPassword(userData.password)) {
      throw new Error('Contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números');
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Determinar rol basado en email
    const role = this.determineUserRole(userData.email);

    const user: User = {
      id: `user-${Date.now()}`,
      email: userData.email,
      name: userData.name,
      role,
      specialty: userData.specialty,
      mfaEnabled: false,
      loginAttempts: 0,
      permissions: this.getDefaultPermissions(role),
      metadata: {
        sessionCount: 0
      }
    };

    this.users.set(user.email, user);
    console.log(`SUCCESS: Usuario registrado: ${user.email} (${user.role})`);

    return user;
  }

  /**
   * Autenticación con email/password
   */
  async authenticate(email: string, password: string, context: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  }): Promise<AuthToken> {
    const user = this.users.get(email);
    
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si cuenta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error(`Cuenta bloqueada hasta ${user.lockedUntil.toISOString()}`);
    }

    // Verificar contraseña (simulado para demo)
    // En producción, verificar contra hash almacenado
    if (email === 'msobarzo78@gmail.com' && password === 'aidux2025') {
      // Login exitoso
      user.loginAttempts = 0;
      user.lastLogin = new Date();
      user.metadata.lastActivity = new Date();
      user.metadata.ipAddress = context.ipAddress;
      user.metadata.userAgent = context.userAgent;
      user.metadata.deviceId = context.deviceId;

      // Generar tokens
      const tokens = await this.generateTokens(user);

      console.log(`SUCCESS: Autenticación exitosa: ${email}`);
      return tokens;

    } else {
      // Login fallido
      user.loginAttempts++;
      
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        throw new Error('Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.');
      }

      throw new Error('Credenciales inválidas');
    }
  }

  /**
   * Autenticación con Google OAuth2
   */
  async authenticateWithGoogle(idToken: string): Promise<AuthToken> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Token de Google inválido');
      }

      const email = payload.email;
      let user = this.users.get(email!);

      if (!user) {
        // Crear usuario automáticamente
        user = await this.registerUser({
          email: email!,
          name: payload.name || email!,
          password: this.generateSecurePassword(),
          specialty: 'General'
        });
      }

      // Generar tokens
      const tokens = await this.generateTokens(user);
      
      console.log(`SUCCESS: Autenticación Google exitosa: ${email}`);
      return tokens;

    } catch (error) {
      console.error('Error en autenticación Google:', error);
      throw new Error('Error en autenticación con Google');
    }
  }

  /**
   * Configura MFA para usuario
   */
  async setupMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Generar secreto MFA
    const secret = speakeasy.generateSecret({
      name: `AiDuxCare (${user.email})`,
      issuer: 'AiDuxCare'
    });

    // Generar QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Guardar secreto temporalmente (en producción, encriptar)
    user.mfaSecret = secret.base32;

    return {
      secret: secret.base32,
      qrCode
    };
  }

  /**
   * Verifica código MFA
   */
  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const user = this.findUserById(userId);
    if (!user || !user.mfaSecret) {
      throw new Error('MFA no configurado');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2 // Ventana de 2 períodos (60 segundos)
    });

    if (verified) {
      user.mfaEnabled = true;
      console.log(`SUCCESS: MFA verificado para: ${user.email}`);
    }

    return verified;
  }

  /**
   * Verifica token JWT
   */
  async verifyToken(token: string): Promise<AuthContext> {
    try {
      // Verificar si token está en blacklist
      if (this.blacklistedTokens.has(token)) {
        throw new Error('Token invalidado');
      }

      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const user = this.findUserById(decoded.userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contexto de sesión
      const sessionId = decoded.sessionId;
      const session = this.sessions.get(sessionId);

      if (!session) {
        throw new Error('Sesión no válida');
      }

      // Verificación continua (Zero-Trust)
      const riskScore = await this.calculateRiskScore(user, session);
      
      if (riskScore > 0.8) {
        throw new Error('Riesgo de seguridad detectado');
      }

      // Actualizar contexto
      session.lastVerified = new Date();
      session.riskScore = riskScore;

      return session;

    } catch (error) {
      console.error('Error verificando token:', error);
      throw new Error('Token inválido');
    }
  }

  /**
   * Refresca token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any;
      const user = this.findUserById(decoded.userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Generar nuevos tokens
      const tokens = await this.generateTokens(user);

      // Invalidar refresh token anterior
      this.blacklistedTokens.add(refreshToken);

      return tokens;

    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }

  /**
   * Invalida token (logout)
   */
  async invalidateToken(token: string, sessionId: string): Promise<void> {
    this.blacklistedTokens.add(token);
    this.sessions.delete(sessionId);
    console.log(`🔒 Token invalidado: ${sessionId}`);
  }

  /**
   * Genera tokens JWT
   */
  private async generateTokens(user: User): Promise<AuthToken> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear contexto de autenticación
    const authContext: AuthContext = {
      user,
      sessionId,
      permissions: user.permissions,
      riskScore: 0,
      lastVerified: new Date()
    };

    this.sessions.set(sessionId, authContext);

    // Generar access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId,
        permissions: user.permissions
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    // Generar refresh token
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        sessionId
      },
      this.refreshSecret,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos
      tokenType: 'Bearer'
    };
  }

  /**
   * Calcula score de riesgo
   */
  private async calculateRiskScore(user: User, session: AuthContext): Promise<number> {
    let riskScore = 0;

    // Verificar actividad reciente
    if (user.metadata.lastActivity) {
      const timeSinceLastActivity = Date.now() - user.metadata.lastActivity.getTime();
      if (timeSinceLastActivity > 30 * 60 * 1000) { // 30 minutos
        riskScore += 0.3;
      }
    }

    // Verificar múltiples sesiones
    if (user.metadata.sessionCount > 3) {
      riskScore += 0.2;
    }

    // Verificar cambios de IP (simulado)
    if (session.user.metadata.ipAddress !== user.metadata.ipAddress) {
      riskScore += 0.4;
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * Valida email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida contraseña
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }

  /**
   * Determina rol de usuario
   */
  private determineUserRole(email: string): User['role'] {
    if (email === 'msobarzo78@gmail.com') {
      return 'OWNER';
    }
    
    // Lógica para otros roles
    if (email.includes('admin')) {
      return 'ADMIN';
    }
    
    if (email.includes('doctor') || email.includes('medico')) {
      return 'PHYSICIAN';
    }
    
    return 'VIEWER';
  }

  /**
   * Obtiene permisos por defecto
   */
  private getDefaultPermissions(role: User['role']): Permission[] {
    const permissions: Record<User['role'], Permission[]> = {
      OWNER: [{ resource: '*', actions: ['*'] }],
      ADMIN: [
        { resource: 'users', actions: ['read', 'create', 'update'] },
        { resource: 'medical_records', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'analytics', actions: ['read'] }
      ],
      PHYSICIAN: [
        { resource: 'medical_records', actions: ['read', 'create', 'update'] },
        { resource: 'patients', actions: ['read', 'create'] }
      ],
      VIEWER: [
        { resource: 'medical_records', actions: ['read'] },
        { resource: 'patients', actions: ['read'] }
      ]
    };

    return permissions[role] || permissions.VIEWER;
  }

  /**
   * Encuentra usuario por ID
   */
  private findUserById(userId: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.id === userId);
  }

  /**
   * Genera contraseña segura
   */
  private generateSecurePassword(): string {
    return Math.random().toString(36).substr(2, 15) + 
           Math.random().toString(36).substr(2, 15).toUpperCase() +
           Math.floor(Math.random() * 10);
  }

  /**
   * Obtiene estadísticas de autenticación
   */
  getAuthStats(): any {
    return {
      totalUsers: this.users.size,
      activeSessions: this.sessions.size,
      blacklistedTokens: this.blacklistedTokens.size,
      usersByRole: Array.from(this.users.values()).reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
} 