import type { Request, Response } from "express"
import type { IResponse } from "../../../common/handlers/response.handler.js"
import { BadRequestError } from "../../../common/handlers/error.handlers.js";
import * as addressService from '../../address/service/address.service.js'
import * as taxService from '../service/tax.service.js'

export const getByHospitalId = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const hospitalId = req.params.id;
        if(!hospitalId || Array.isArray(hospitalId)) {
            throw new BadRequestError('Hospital ID is required');
        }
        const hospitalAddress = await addressService.findByHospitalId(BigInt(Number(hospitalId)));
        const country = hospitalAddress.country;

        const tax = await taxService.findByCountry(country);
        response = {
            message: 'Tax Rate Found Successfully',
            status: 200,
            success: true,
            data: tax
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