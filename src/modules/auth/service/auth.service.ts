import { InternalServerError, NotFoundError } from "../../../common/handlers/error.handlers.js"
import prisma from "../../../config/prisma.js"
import type { UserCredential } from "../../../databases/generated/client.js";
import type { ICreateCredential } from "../interface/auth.interface.js";
import { Role } from "../../../databases/generated/client.js";

export const findUser = async (credential: string): Promise<UserCredential> => {
    try {
        if(!credential) {
            throw new InternalServerError('Error while fetching user as email is not available')
        }
        const user = await prisma.userCredential.findFirst({
            where: {
                OR: [
                    { email: credential },
                    { mobile: credential },
                ],
                isActive: true
            }
        });
        if(!user) {
            throw new NotFoundError('User with given email not found');
        }
        return user;
    } catch (error) {
        if(error instanceof InternalServerError) {
            throw new InternalServerError(error.message);
        }
        if(error instanceof NotFoundError) {
            throw new NotFoundError(error.message)
        }
        throw new InternalServerError('Error while fetching user')
    }
}

export const updatePassword = async (password: string, email: string): Promise<UserCredential> => {
    try {
        if(!email || !password) {
            throw new InternalServerError('Error while reseting password');
        }
        const updatedUser = await prisma.userCredential.update({
        where: {
            email,
        },
        data: {
            hashedPassword: password
        },
        });
        if(!updatedUser) {
            throw new InternalServerError('Error while updating password');
        }
        return updatedUser;
    } catch (error) {
        if(error instanceof InternalServerError) {
            throw new InternalServerError(error.message);
        }
        throw new InternalServerError('Error while fetching user')
    }
}


export const createCredential = async (
  tx: any,
  data: ICreateCredential
) => {
  return tx.userCredential.create({
    data: {
      email: data.email,
      mobile: data.mobile,
      hashedPassword: data.hashedPassword,
      role: data.role ?? Role.PATIENT,
      isActive: true
    }
  });
};