import { type Request, type Response } from "express";
import type { IResponse } from "../../../common/handlers/response.handler.js";
import { BadRequestError, DatabaseError, NotFoundError, ValidationError } from "../../../common/handlers/error.handlers.js";
import * as hospitalGroupService from '../service/hospitalGroup.service.js';
import { CreateHospitalGroupSchema } from "../../../common/validation/hospitalGroup.validation.js";

export const register = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const body = req.body;
        if(!body) {
            throw new BadRequestError('Hospital Group Data is required');
        }
        const parseGroup = CreateHospitalGroupSchema.safeParse(body);
        if(!parseGroup.success) {
            throw new ValidationError(parseGroup.error._zod.def[0]?.message)
        }

        const hospitalGroup = await hospitalGroupService.create(parseGroup.data);
        if(!hospitalGroup) {
            throw new DatabaseError('Error while creating hospitalgroup');
        }
        response = {
            message: 'Hotel Group created successfully',
            status: 201,
            success: true
        }
        res.status(201).json(response)
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        }
        res.status(response.status).json(response);
    }
}

export const getByName = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const name = req.params.name;
        if(!name || Array.isArray(name)) {
            throw new BadRequestError('Invalid params');
        }
        const hospitalGroups = await hospitalGroupService.findByName(name);
        if(!hospitalGroups) {
            throw new NotFoundError('Hospital Group with given name is not found');
        }
        response = {
            message: 'Hospital Groups fetched successfully',
            status: 200,
            success: true,
            data: hospitalGroups
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        }
        res.status(response.status).json(response);
    }
}

export const getAll = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const hospitalGroups = await hospitalGroupService.findAll();
        if(!hospitalGroups) {
            throw new DatabaseError('Error while fetching hospital groups');
        }
        response = {
            message: 'Hospital Groups fetched successfully',
            status: 200,
            success: true,
            data: hospitalGroups
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        }
        res.status(response.status).json(response);
    }
}

export const deactivateGroup = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid id');
        }   
        const deactivatedGroup = await hospitalGroupService.deactivate(Number(id));
        if(!deactivatedGroup) {
            throw new NotFoundError('No such hospital group found');
        }
        response = {
            message: 'Hospital Group deactivated successfully',
            status: 200,
            success: true,
        }
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        }
        res.status(response.status).json(response);
    }
}

export const activateGroup = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Group ID');
        }
        const activatedHospitalGroup = await hospitalGroupService.activate(BigInt(Number(id)));
        if(!activatedHospitalGroup) {
            throw new NotFoundError('No such hospital group found');
        }
        response = {
            message: 'Hospital Group activated successfully',
            status: 200,
            success: true,
        }
        res.status(200).json(response);
    } catch (error: any) {
        console.log(error);
        response = {
            status: error.statusCode || 500,
            message: error.message || 'Internal Server Error',
            success: false,
            error
        }
        res.status(response.status).json(response);
    }
}