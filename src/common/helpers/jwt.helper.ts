import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { IJwtPayload } from '../interfaces/jwtPayload.interface.js';
import {
  InternalServerError,
  InvalidTokenError,
  TokenExpiredError,
} from '../handlers/error.handlers.js';

// Creates JWT Token for authentication
export const createAccessToken = (payload: IJwtPayload, time: number): string => {
  try {
    const secretKey = process.env.ACCESS_JWT_SECRET;
    const token = jwt.sign(payload, secretKey, { expiresIn: 60 * time });
    return token;
  } catch (error) {
    console.log(error);
    throw new InternalServerError('Error while creating token');
  }
};

export const createRefreshToken = (email: string): string => {
   try {
    const secretKey = process.env.REFRESH_JWT_SECRET;
    const token = jwt.sign({email}, secretKey, { expiresIn: 60 * 60 * 24 * 15 });
    return token;
  } catch (error) {
    console.log(error);
    throw new InternalServerError('Error while creating token');
  }
}

// Creates JWT token for svg captcha for captcha verification
export const createSvgToken = (svgText: string): string => {
  try {
    const secretKey = process.env.ACCESS_JWT_SECRET;
    const token = jwt.sign({ text: svgText }, secretKey, { expiresIn: 60 * 5 });
    return token;
  } catch (error) {
    console.log(error);
    throw new InternalServerError('Error while creating token');
  }
};

export const createOtpToken = (email: string, otp: string): string => {
  try {
    const secretKey = process.env.ACCESS_JWT_SECRET;
    const token = jwt.sign(
      {
        email,
        otp,
      },
      secretKey,
      { expiresIn: 60 * 2 },
    );
    return token;
  } catch (error) {
    console.log(error);
    throw new InternalServerError('Error while creating token');
  }
};

export const createResetToken = (email: string): string => {
  try {
    const secretKey = process.env.ACCESS_JWT_SECRET;
    const token = jwt.sign(
      {
        email,
      },
      secretKey,
      { expiresIn: 60 * 10 },
    );
    return token;
  } catch (error) {
    console.log(error);
    throw new InternalServerError('Error while creating token');
  }
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const secretKey = process.env.ACCESS_JWT_SECRET;
    const decodedToken = jwt.verify(token, secretKey);
    if (!decodedToken || typeof decodedToken == 'string') {
      throw new InvalidTokenError('Invalid Data insied token');
    }
    return decodedToken;
  } catch (error: any) {
    if (error.message == 'jwt expired') {
      throw new TokenExpiredError('Token is expired');
    }
    throw new InvalidTokenError(error.message);
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const secretKey = process.env.REFRESH_JWT_SECRET;
    const decodedToken = jwt.verify(token, secretKey);
    if (!decodedToken || typeof decodedToken == 'string') {
      throw new InvalidTokenError('Invalid Data insied token');
    }
    return decodedToken;
  } catch (error: any) {
    if (error.message == 'jwt expired') {
      throw new TokenExpiredError('Captcha is expired');
    }
    throw new InvalidTokenError(error.message);
  }
};

