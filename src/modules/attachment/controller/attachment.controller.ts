import { type Request, type Response } from "express";
import { BadRequestError, DatabaseError, InternalServerError } from "../../../common/handlers/error.handlers.js";
import * as imageKitHelper from "../../../common/helpers/imageKit.helper.js";
import type { IResponse } from "../../../common/handlers/response.handler.js";
import type { IAttachment } from "../interface/attachment.interface.js";
import * as attachmentService from '../service/attachment.service.js'

export const addPrescription = async (req: Request, res: Response) => {
    let response: IResponse
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Prescription');
        }
        if(!req.file) {
            throw new BadRequestError('Please upload the file');
        }
        const file = req.file;
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
        const uploadedImage = await imageKitHelper.uploadImage(
            file.buffer,
            fileName,
            "/uploads"
        );
        if(!uploadedImage) {
            throw new InternalServerError('Error while uploading profile photo');
        }
        const attachment: IAttachment = {
            prescriptionId: BigInt(Number(id)),
            secretKey: uploadedImage.secretKey,
            url: uploadedImage.url,
            type: 'PRESCRIPTION'
        }
        const attachmentArray: IAttachment[] = [] ;
        attachmentArray.push(attachment);
        const createdPrescription = await attachmentService.create(attachmentArray);
        if(createdPrescription.count != 1) {
            throw new DatabaseError('Error while attaching prescription');
        }
        response = {
            message: 'Prescription Added Successfully',
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

export const addReport = async (req: Request, res: Response) => {
    let response: IResponse
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Prescription');
        }
        if(!req.file) {
            throw new BadRequestError('Please upload the file');
        }
        const file = req.file;
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
        const uploadedImage = await imageKitHelper.uploadImage(
            file.buffer,
            fileName,
            "/uploads"
        );
        if(!uploadedImage) {
            throw new InternalServerError('Error while uploading profile photo');
        }
        const attachment: IAttachment = {
            prescriptionId: BigInt(Number(id)),
            secretKey: uploadedImage.secretKey,
            url: uploadedImage.url,
            type: 'REPORT'
        }
        const attachmentArray: IAttachment[] = [] ;
        attachmentArray.push(attachment);
        const createdPrescription = await attachmentService.create(attachmentArray);
        if(createdPrescription.count != 1) {
            throw new DatabaseError('Error while attaching prescription');
        }
        response = {
            message: 'Prescription Added Successfully',
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

export const deleteAttachment = async (req: Request, res: Response) => {
    let response: IResponse;
    try {
        const id = req.params.id;
        if(!id || Array.isArray(id)) {
            throw new BadRequestError('Invalid Attachment');
        }
        const attachment = await attachmentService.findById(BigInt(Number(id)));
        const fieldId = attachment.secretKey;
        if(!fieldId) {
            throw new InternalServerError('Error while deleting this document');
        }
        await imageKitHelper.deleteFile(fieldId);
        await attachmentService.remove(BigInt(Number(id)));
        response = {
            message: 'Document Deleted Successfully',
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