import { Redis } from "ioredis";
import { InternalServerError, UnauthorizedError } from "../handlers/error.handlers.js";

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null,
});

export default redis;

redis.on("connect", () => {
  console.log("✅ Redis Connected");
});

redis.on("ready", () => {
  console.log("✅ Redis Ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

export const setRefreshToken = async (email: string,token: string) => {
    try {
        await redis.set(
            `refreshToken:${email}`,
            token,
            "EX",
            60*60*24*15
        )
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while setting refresh token') ;
    }
}

export const getRefreshToken = async (email: string) => {
    try {
        const storedToken = await redis.get(
            `refreshToken:${email}`
        );
        if(!storedToken) {
            throw new UnauthorizedError('User not authorized');
        }
        return storedToken;
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while getting refresh token') ;
    }
}

export const deleteRefreshToken = async (email: string) => {
    try {
        await redis.del(
            `refreshToken:${email}`
        )
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while deleting refresh token') ;
    }
}

export const createOtp = async (email: string, otp: string) => {
    try {
        await redis.set(
            `otp:${email}`,
            otp,
            "EX",
            120
        )
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while sending otp');
    }
}

export const getOtp = async (email: string) => {
    try {
        const storedToken = await redis.get(
            `otp:${email}`
        );
        if(!storedToken) {
            throw new UnauthorizedError('OTP expired');
        }
        return storedToken;
    } catch (error) {
        console.error(error);
        throw new InternalServerError('OTP Expired') ;
    }
}

export const deleteOTP = async (email: string) => {
    try {
        await redis.del(
            `otp:${email}`
        )
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while deleting refresh token') ;
    }
}