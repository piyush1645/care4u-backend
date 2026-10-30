import type { Request, Response } from 'express'
import * as hospitalService from '../service/hospital.service.js'
import * as addressService from '../../address/service/address.service.js'
import { BadRequestError, ValidationError } from '../../../common/handlers/error.handlers.js';
import { CreateHospitalSchema, UpdateHospitalSchema } from '../../../common/validation/hospital.validation.js';
import prisma from '../../../config/prisma.js';
import type { IResponse } from '../../../common/handlers/response.handler.js';
import type { IHospital } from '../interface/hospital.interface.js';



export const register = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const body = req.body;
        if(!body) {
            throw new BadRequestError('Hospital Body is required');
        }
        const result = CreateHospitalSchema.safeParse(req.body);
        if (!result.success) {
         throw new ValidationError(result.error._zod.def[0]?.message)
        }
        const address = {
            addressLine1: result.data.address.addressLine1,
            addressLine2: result.data.address.addressLine2,
            city: result.data.address.city,
            state: result.data.address.state,
            country: result.data.address.country,
            pincode: result.data.address.pincode
        };
        const hospital = {
            name: result.data.branchName,
            photo: result.data.photo || 'No photo provided',
            hospitalGroupId: result.data.hospitalGroupId
        }
        await prisma.$transaction(async (tx) => {
            
            const createdHospital = await hospitalService.register(hospital,tx);
            
            const updatedAddress = {
                ...address,
                hospitalId: createdHospital.id,
                addressLine2: address.addressLine2 ?? null
            }
            
            const createdAddress = await addressService.register(updatedAddress,tx);

            return {createdAddress, createdHospital}
        });
        response = {
            message: 'Hospital Created Successfully',
            status: 201,
            success: true
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

export const getByName = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const name = req.params.name;
        if(!name || Array.isArray(name)) {
            throw new BadRequestError('Invalid name');
        }
        const hospitalList = await hospitalService.findByName(name);
        response = {
           message: 'Hospitals Found Successfully',
           status: 200,
           success: true,
           data: hospitalList 
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

export const deactivate = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id')
        }
        await hospitalService.deactivate(Number(id));
        response = {
            message: 'Hospital Deactivated Successfully',
            status: 200,
            success: true
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

export const update = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const body = req.body;
        const id = req.params.id;

        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }

        const result = UpdateHospitalSchema.safeParse(body);
        if(!result.success) {
            throw new ValidationError(result.error._zod.def[0]?.message);
        }
        const hospitalData: IHospital = {
            name: result.data.branchName,
            photo: result.data.photo,
            hospitalGroupId: result.data.hospitalGroupId,
            isActive: true
        }

        const addressData = {
            addressLine1: result.data.address.addressLine1,
            addressLine2: result.data.address.addressLine2,
            city: result.data.address.city,
            country: result.data.address.country,
            pincode: result.data.address.pincode,
            state: result.data.address.pincode,
            hospitalId: Number(id),
        }
        await prisma.$transaction(async (tx) => {
            
            const createdHospital = await hospitalService.update(Number(id),hospitalData,tx);
            
            const updatedAddress = {
                ...addressData,
                addressLine2: addressData.addressLine2 ?? null
            }
            const createdAddress = await addressService.update(updatedAddress,tx);

            return {createdAddress, createdHospital}
        });
        response = {
            message: 'Hospital Data updated successfully',
            status: 200,
            success: true
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

export const getAll = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const hospitalList = await hospitalService.findAll();
        response = {
            message: 'Hospital List fetched successfully',
            status: 200,
            success: true,
            data: hospitalList
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

export const getByHospitalGroupId = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.groupId;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid group id');
        }
        const hospitalList = await hospitalService.findByGroupId(Number(id));
        response = {
            message: 'Hospitals fetched successfully',
            status: 200,
            success: true,
            data: hospitalList
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

export const activate = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Hospital Id');
        }
        await hospitalService.activate(BigInt(Number(id)));
        response = {
            message: 'Hospital Activated Successfully',
            status: 200,
            success: true
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

export const getDetail = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if (!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Hospital Id');
        }
        const data = await hospitalService.getHospitalDetailById(BigInt(id));
        response = {
            message: 'Hospital detail fetched successfully',
            status: 200,
            success: true,
            data,
        };
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