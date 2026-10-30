import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../../common/handlers/error.handlers.js';
import prisma from '../../../config/prisma.js';

export const checkDoctorAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new UnauthorizedError('Unauthorized');
        }

        const doctorId = Number(req.params.id);
        if (!doctorId) {
            return next();
        }

        // 1. SUPER_ADMIN has access to all doctors
        if (user.role === 'SUPER_ADMIN') {
            return next();
        }

        // 2. DOCTOR has access to only their own ID
        if (user.role === 'DOCTOR') {
            if (Number(user.userId) !== doctorId) {
                return res.status(403).json({ message: 'Permission denied: Cannot access other doctors\' data' });
            }
            return next();
        }

        // 3. ADMIN has access to doctors associated with their hospital group
        if (user.role === 'ADMIN') {
            const admin = await prisma.admin.findUnique({
                where: { id: BigInt(user.userId) },
                select: { hospitalGroupId: true }
            });
            if (!admin) {
                return res.status(403).json({ message: 'Permission denied: Admin not found' });
            }

            const doctor = await prisma.doctor.findUnique({
                where: { id: BigInt(doctorId) },
                select: {
                    hospital: {
                        select: { hospitalGroupId: true }
                    }
                }
            });
            if (!doctor || doctor.hospital.hospitalGroupId !== admin.hospitalGroupId) {
                return res.status(403).json({ message: 'Permission denied: Doctor does not belong to your hospital group' });
            }

            return next();
        }

        // 4. STAFF has access if they are associated with the doctor's hospital group
        if (user.role === 'STAFF') {
            const staff = await prisma.staff.findUnique({
                where: { id: BigInt(user.userId) },
                select: { hospital: { select: { hospitalGroupId: true } } }
            });
            if (!staff) {
                return res.status(403).json({ message: 'Permission denied: Staff not found' });
            }

            const doctor = await prisma.doctor.findUnique({
                where: { id: BigInt(doctorId) },
                select: {
                    hospital: {
                        select: { hospitalGroupId: true }
                    }
                }
            });
            if (!doctor || doctor.hospital.hospitalGroupId !== staff.hospital.hospitalGroupId) {
                return res.status(403).json({ message: 'Permission denied: Doctor does not belong to your hospital group' });
            }

            return next();
        }

        return res.status(403).json({ message: 'Permission denied' });
    } catch (error) {
        next(error);
    }
};
