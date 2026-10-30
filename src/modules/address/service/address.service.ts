import { DatabaseError, NotFoundError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js";
import type { IAddress } from "../interface/address.interface.js";

export const register = async (data: IAddress,tx: any) => {
    try {
        const hospitalAddress = await tx.address.create({
            data: {
                addressLine1: data.addressLine1,
                city: data.city,
                country: data.country,
                pincode: data.pincode,
                state: data.state,
                hospitalId: data.hospitalId,
                ...(data.addressLine2 && {
                    addressLine2: data.addressLine2
                })
            }
        });
        return hospitalAddress;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating address');
    }
}

export const update = async (data: IAddress, tx: any) => {
    try {
        const updatedAddress = await tx.address.update({
            where: {
                hospitalId: data.hospitalId
            },
            data
        });
        return updatedAddress
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating address');
    }
}

export const findByHospitalId = async (hospitalId: bigint) => {
    try {
        const address = await prisma.address.findUnique({
            where: {
                hospitalId
            }
        });
        if(!address) {
            throw new NotFoundError('Address for this hospital not found');
        }
        return address;
    } catch (error) {
        if(error instanceof NotFoundError) {
            throw new NotFoundError(error.message)
        }
        console.error(error);
        throw new DatabaseError('Error while finding hospital address');
    }
}