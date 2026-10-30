import { DatabaseError, NotFoundError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js";
import type { IAttachment } from "../interface/attachment.interface.js";

export const create = async (data: IAttachment[]) => {
    try {
        const newAttachment = await prisma.attachment.createMany({
            data: data.map((attachment) => ({
                type: attachment.type,
                url: attachment.url,
                secretKey: attachment.secretKey,
                prescriptionId: attachment.prescriptionId,
            })),
        });
        return newAttachment;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating attachment');
    }
}

export const remove = async (id: bigint) => {
    try {
        const deletedAttachment = await prisma.attachment.delete({
            where: {
                id
            }
        });
        if(!deletedAttachment) {
            throw new DatabaseError('Error while deleting attachment');
        }
        return deletedAttachment;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while deleting attachment');
    }
}

export const findById = async (id: bigint) => {
    try {
        const attachment = await prisma.attachment.findUnique({
            where: {
                id
            }
        });
        if(!attachment) {
            throw new NotFoundError('Attachment with this id not found');
        }
        return attachment;
    } catch (error) {
        if(error instanceof NotFoundError) {
            throw new NotFoundError(error.message)
        }
        console.error(error);
        throw new DatabaseError('Error while finding attachment');
    }
}