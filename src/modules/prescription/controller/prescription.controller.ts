import type { IResponse } from "../../../common/handlers/response.handler.js"
import type { Request, Response } from "express";
import { CreatePrescriptionSchema } from "../../../common/validation/prescription.validation.js";
import { BadRequestError, NotFoundError, ValidationError } from "../../../common/handlers/error.handlers.js";
import type { IAttachment } from "../../attachment/interface/attachment.interface.js";
import type { IPrescription } from "../interface/prescription.interface.js";
import prisma from "../../../config/prisma.js";
import * as prescriptionService from '../service/prescription.service.js'
import * as attachmentService from '../../attachment/service/attachment.service.js'

export const create = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const body = req.body
        const result = CreatePrescriptionSchema.safeParse(body);
        if(!result.success) {
            throw new ValidationError(result.error._zod.def[0]?.message)
        }

        const prescriptionData: IPrescription = {
            precautions: result.data.precautions,
            appointmentId: BigInt(result.data.appointmentId)
        }

        await prisma.$transaction(async (tx) => {
            
            const createdPrescription = await prescriptionService.create(prescriptionData,tx)
            
            const attachmentList = result.data.attachments;
            const attachmentItems: IAttachment[] = [];
            attachmentList?.forEach((item) => {
                const attachmentItem: IAttachment = {
                    secretKey: item.secretKey ?? null,
                    type: item.type,
                    url: item.url,
                    prescriptionId: createdPrescription.id
                }
                attachmentItems.push(attachmentItem);
            });
            
            const attachments = await attachmentService.create(attachmentItems);

            return {createdPrescription, attachments}
        });
        response = {
            message: 'Prescription Created Successfully',
            status: 201,
            success: true,
        }
        res.status(201).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}

export const getById = async(req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Id');
        }
        const prescription = await prescriptionService.findById(Number(id));
        if(!prescription) {
            throw new NotFoundError('Prescription with this id not found');
        }
        response = {
            message: 'Prescription fetched successfully',
            status: 200,
            success: true,
            data: prescription
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}

export const getByAppointmentId = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const appointmentId = req.params.appointmentId;
        if(!appointmentId || Array.isArray(appointmentId)) {
            throw new BadRequestError('Invalid Appointment Id');
        }
        const prescription = await prescriptionService.findByAppointmentId(Number(appointmentId));
        if(!prescription) {
            throw new NotFoundError('No prescription for this appointment');
        }
        response = {
            message: 'Appointment Prescription found successfully',
            status: 200,
            success: true,
            data: prescription
        }
        res.status(200).json(response)
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}

export const getByPatientId = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.patientId;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Patient Id');
        }
        const prescription = await prescriptionService.findByPatientId(BigInt(Number(id)));
        response = {
            message: 'Patient Prescriptions fetched',
            status: 200,
            success: true,
            data: prescription
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}

export const getByDoctorId = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.doctorId;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Patient Id');
        }
        const prescription = await prescriptionService.findByDoctorId(BigInt(Number(id)));
        response = {
            message: 'Patient Prescriptions fetched',
            status: 200,
            success: true,
            data: prescription
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}


export const getByPatientIdDoctorId = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const patientId = req.params.patientId;
        const doctorId = req.params.doctorId;
        if(!patientId || Array.isArray(patientId)) {
            throw new BadRequestError('Invalid Patient Id');
        }

        if(!doctorId || Array.isArray(doctorId)) {
            throw new BadRequestError('Invalid Doctor Id');
        }

        const prescription = await prescriptionService.findByPatientIdDoctorId(BigInt(Number(patientId)), BigInt(Number(doctorId)));
        response = {
            message: 'Patient Prescriptions fetched',
            status: 200,
            success: true,
            data: prescription
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}

export const remove = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Id');
        }
        const deletedPrescription = await prescriptionService.remove(BigInt(Number(id)));
        if(!deletedPrescription) {
            throw new NotFoundError('Prescription with this id not found');
        }
        response = {
            message: 'Prescription deleted successfully',
            status: 200,
            success: true,
        }
        res.status(200).json(response)
    } catch (error: any) {
        console.log(error);
        response = {
        status: error.statusCode || 500,
        message: error.message || 'Internal Server Error',
        success: false,
        error,
        };
        res.status(response.status).json(response);
    }
}
