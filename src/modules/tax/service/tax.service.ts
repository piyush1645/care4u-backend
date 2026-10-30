import { DatabaseError, NotFoundError } from "../../../common/handlers/error.handlers.js";
import prisma from "../../../config/prisma.js"

export const findByCountry = async (country: string) => {
    try {
        const taxData = await prisma.taxRate.findFirst({
            where: {
                country
            }
        });
        if(!taxData) {
            throw new NotFoundError('Invalid Country');
        }
        return taxData;
    } catch (error) {
        if(error instanceof NotFoundError) {
            throw new NotFoundError(error.message);
        }
        console.error(error);
        throw new DatabaseError('Error while finding tax rate');
    }
}