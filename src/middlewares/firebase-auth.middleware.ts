import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { firebaseConfig } from '../config/firebase';

// Estender o tipo Request para incluir a propriedade user
declare module 'express-serve-static-core' {
  interface Request {
    user?: admin.auth.DecodedIdToken;
  }
}

export const firebaseAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('🔐 [AUTH] Middleware de autenticação Firebase iniciado');

  try {
    // Verificar se o Firebase Admin está inicializado
    console.log('🔧 [AUTH] Verificando inicialização do Firebase Admin...');
    
    // Verificar variáveis de ambiente
    console.log('🌍 [AUTH] Variáveis de ambiente:', {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) + '...',
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0
    });

    const app = admin.app();
    console.log('✅ [AUTH] Firebase Admin inicializado:', {
      name: app.name,
      projectId: app.options.projectId,
      hasCredential: !!app.options.credential
    });

    // Extrair o token do header Authorization
    const authHeader = req.headers.authorization;
    console.log(
      '📋 [AUTH] Header Authorization recebido:',
      authHeader ? `${authHeader.substring(0, 50)}...` : 'AUSENTE'
    );

    if (!authHeader) {
      console.log('❌ [AUTH] Header Authorization ausente');
      return res.status(401).json({
        error: 'Token de autenticação não fornecido',
        details: 'Header Authorization não encontrado'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log(
        '❌ [AUTH] Formato de header inválido:',
        authHeader.substring(0, 20)
      );
      return res.status(401).json({
        error: 'Formato de token inválido',
        details: 'Token deve começar com "Bearer "'
      });
    }

    const idToken = authHeader.substring(7); // Remove "Bearer "
    console.log(
      '🎫 [AUTH] Token extraído (primeiros 50 chars):',
      idToken.substring(0, 50)
    );
    console.log('📏 [AUTH] Tamanho do token:', idToken.length);

    // Verificar formato básico do JWT
    const tokenParts = idToken.split('.');
    console.log('🔍 [AUTH] Token tem', tokenParts.length, 'partes (esperado: 3)');

    if (tokenParts.length !== 3) {
      console.log(
        '❌ [AUTH] Token JWT mal formado - deveria ter 3 partes separadas por ponto'
      );
      return res.status(401).json({
        error: 'Token mal formado',
        details: 'JWT deve ter header.payload.signature'
      });
    }

    // Tentar decodificar o header do JWT para debug
    try {
      const headerBase64 = tokenParts[0];
      const header = JSON.parse(Buffer.from(headerBase64, 'base64').toString());
      console.log('📄 [AUTH] Header JWT decodificado:', header);
      
      // Decodificar o payload também
      const payloadBase64 = tokenParts[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      console.log('📦 [AUTH] Payload JWT decodificado:', {
        iss: payload.iss,
        aud: payload.aud,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
        iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'N/A',
        sub: payload.sub,
        firebase: payload.firebase
      });
    } catch (error) {
      console.log('⚠️ [AUTH] Não foi possível decodificar JWT:', error);
    }

    // Verificar o token com o Firebase Admin usando a configuração existente
    console.log('🔍 [AUTH] Iniciando verificação do token com Firebase Admin...');

    const decodedToken = await firebaseConfig.verifyIdToken(idToken);

    console.log('✅ [AUTH] Token verificado com sucesso!');
    console.log('👤 [AUTH] Dados do usuário decodificado:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      iss: decodedToken.iss,
      aud: decodedToken.aud,
      exp: new Date(decodedToken.exp * 1000).toISOString(),
      iat: new Date(decodedToken.iat * 1000).toISOString()
    });

    // Adicionar o usuário ao objeto request
    req.user = decodedToken;
    console.log('✅ [AUTH] Usuário adicionado ao request, prosseguindo...');

    next();
  } catch (error: any) {
    console.error('❌ [AUTH] Erro na verificação do token:');
    console.error('📊 [AUTH] Tipo do erro:', error.constructor.name);
    console.error('💬 [AUTH] Mensagem:', error.message);
    console.error('🔧 [AUTH] Code:', error.code);
    console.error('📋 [AUTH] Stack trace:', error.stack);

    // Logs específicos para diferentes tipos de erro
    if (error.code === 'auth/id-token-expired') {
      console.error('⏰ [AUTH] Token expirado');
    } else if (error.code === 'auth/invalid-id-token') {
      console.error('🚫 [AUTH] Token inválido');
    } else if (error.code === 'auth/project-not-found') {
      console.error('🏗️ [AUTH] Projeto Firebase não encontrado');
    } else if (error.code === 'auth/insufficient-permission') {
      console.error('🔒 [AUTH] Permissões insuficientes');
    }

    // Informações adicionais do Firebase
    if (error.errorInfo) {
      console.error('ℹ️ [AUTH] Informações extras do Firebase:', error.errorInfo);
    }

    return res.status(401).json({
      error: 'Token inválido ou expirado',
      code: error.code || 'unknown',
      message: error.message,
      details: 'Verifique se o token Firebase está correto e não expirado'
    });
  }
};
