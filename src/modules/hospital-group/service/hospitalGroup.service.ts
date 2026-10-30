import { DatabaseError, InternalServerError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js";
import type { IHospitalGroup } from "../interface/hospitalGroup.interface.js";

const create = async (data: IHospitalGroup) => {
    try {
        const newHospitalGroup = await prisma.hospitalGroup.create({
            data: {
                name: data.name,
                logo: data.logo
            }
        });
        return newHospitalGroup;
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while creating hotel group')
    }
}

const findById = async (id: bigint) => {
    try {
        const hospitalGroup = await prisma.hospitalGroup.findUnique({
            where: {
                id
            }
        });
        return hospitalGroup;
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while fetching hospital groups')
    }
}

const findAll = async () => {
    try {
        const hospitalGroups = await prisma.hospitalGroup.findMany({
            include: {
                admin: {
                    include: {
                        credential: {
                            select: {
                                email: true,
                                mobile: true
                            }
                        }
                    }
                }
            }
        });
        return hospitalGroups;
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while fetching hospital groups');
    }
}

const findByName = async (name: string) => {
    try {
        const hospitalGroups = await prisma.hospitalGroup.findMany({
            where: {
                name: {
                    contains: name,
                }
            }
        });
        return hospitalGroups;
    } catch (error) {
        throw new InternalServerError('Error while fetching hospital groups');
    }
}

const deactivate = async (id: number) => {
    try {
        const deactivatedGroup = await prisma.hospitalGroup.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
        return deactivatedGroup;
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while deactivating the hospital Group');
    }
}

const activate = async (id: bigint) => {
    try {
        const activateGroup = await prisma.hospitalGroup.update({
            where: {
                id
            },
            data: {
                isActive: true
            }
        });
        return activateGroup
    } catch (error) {
        console.error(error);
        throw new DatabaseError('Error while activating hospital group');
    }
}

export {
    create,
    findById,
    findByName,
    findAll,
    deactivate,
    activate
}