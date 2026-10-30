import type { Request, Response } from 'express';

import type { IResponse } from '../../../common/handlers/response.handler.js';
import { BadRequestError, InternalServerError, ResourceAlreadyExistError, UnauthorizedError, ValidationError, NotFoundError } from '../../../common/handlers/error.handlers.js';
import {
  checkAppointmentTime,
  findDoctorAppointments,
} from '../service/appointment.service.js';
import * as doctorService from '../../doctor/service/doctor.service.js'
import prisma from '../../../config/prisma.js';
import { DAYS, ROLE } from '../../../common/constants/index.js';
import { CreateAppointmentSchema, RescheduleAppointmentSchema } from '../../../common/validation/appointment.validation.js';
import * as appointmentService from '../service/appointment.service.js'
import type { RescheduleAppointmentDto } from '../interface/appointment.interface.js';
import * as invoiceController from '../../invoice/controller/invoice.controller.js'
import { getReminderTimes, removeAppointmentReminder } from '../../../common/helpers/schedulers/reminder.scheduler.js';
import { scheduleAppointmentReminder } from '../../../common/helpers/schedulers/reminder.scheduler.js';
import { generateReferenceNumber } from '../../../common/helpers/referenceGenrator.helper.js';
import { removeMeetingLinkSender, scheduleMeetingLinkSender } from '../../../common/helpers/schedulers/meetingLink.scheduler.js';
import type { ICreateEvent } from '../../google/interface/google.interface.js';
import { createEvent, findCalendarConnectionByDoctorId } from '../../google/service/google.service.js';
import * as patientService from '../../patient/service/patient.service.js'

const getScheduleTimezone = () => 'Asia/Kolkata';

const getMinutesInTimezone = (date: Date | string | null | undefined, tz: string) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz
  });
  const parts = formatter.formatToParts(d);
  const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);
  return hour * 60 + minute;
};

// GET /appointment/appointments?type=doctor|user&userId=X&date=YYYY-MM-DD
export const showAllAppointments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let response: IResponse;

  try {
    const { type, userId, date } = req.query;

    if (!type || !userId) {
      throw new BadRequestError(
        'type and userId are required',
      );
    }

    const appointmentData = await findDoctorAppointments(
      type as 'user' | 'doctor',
      userId as string,
      date as string | undefined,
    );

    response = {
      status: 200,
      message: 'Appointments fetched successfully',
      success: true,
      data: appointmentData,
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
};

// POST /appointment/appointments
// Body: { doctorId, patientId, appointmentTime, hospitalId }
export const bookAnAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let response: IResponse;
  try {
    const body = req.body;
    const user = req.user;
    if (!user || !user.userId) {
      throw new UnauthorizedError('Invalid user');
    }
    const result = CreateAppointmentSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid Appointment Data');
    }
    if (result.data.bookedBy == 'SELF') {
      result.data.patientId = req.user?.userId;
    }
    if (!result.data.patientId) {
      throw new BadRequestError('Invalid patient info');
    }
    const doctorSchedule = await doctorService.checkDoctorAvailability(result.data.doctorId);
    const slotDuration = doctorSchedule.slotDuration;
    const workingScheduleDay = doctorSchedule.schedule[0]?.workingDays;
    const workingDays = workingScheduleDay?.split(',')

    const appointmentDay = DAYS[result.data.appointmentDate.getDay()];

    const morningStart = doctorSchedule.schedule[0]?.morningStartTime;
    const morningEnd = doctorSchedule.schedule[0]?.morningEndTime;
    const eveningStart = doctorSchedule.schedule[0]?.eveningStartTime;
    const eveningEnd = doctorSchedule.schedule[0]?.eveningEndTime;

    const appointmentStart = result.data.appointmentStartTime;
    const appointmentEnd = new Date(appointmentStart.getTime() + slotDuration * 60 * 1000);

    const tz = getScheduleTimezone();

    const morningStartMinutes = morningStart
      ? getMinutesInTimezone(morningStart, tz)
      : null;

    const morningEndMinutes = morningEnd
      ? getMinutesInTimezone(morningEnd, tz)
      : null;

    const eveningStartMinutes = eveningStart
      ? getMinutesInTimezone(eveningStart, tz)
      : null;

    const eveningEndMinutes = eveningEnd
      ? getMinutesInTimezone(eveningEnd, tz)
      : null;

    const appointmentStartMinutes = getMinutesInTimezone(appointmentStart, tz);
    const appointmentEndMinutes = getMinutesInTimezone(appointmentEnd, tz);

    const isInMorningShift =
      morningStartMinutes !== null &&
      morningEndMinutes !== null &&
      appointmentStartMinutes !== null &&
      appointmentEndMinutes !== null &&
      appointmentStartMinutes >= morningStartMinutes &&
      appointmentEndMinutes <= morningEndMinutes;

    const isInEveningShift =
      eveningStartMinutes !== null &&
      eveningEndMinutes !== null &&
      appointmentStartMinutes !== null &&
      appointmentEndMinutes !== null &&
      appointmentStartMinutes >= eveningStartMinutes &&
      appointmentEndMinutes <= eveningEndMinutes;

    if (!isInMorningShift && !isInEveningShift) {
      console.error('here');

      throw new BadRequestError(
        "Appointment time is outside doctor working hours"
      );
    }

    if (!appointmentDay || !workingDays?.includes(appointmentDay)) {
      throw new BadRequestError(
        `Doctor is not available on ${appointmentDay}`
      );
    }

    const doctorLeaves = doctorSchedule.leaves;

    const hasConflictingLeave = doctorLeaves.some((leave: any) => {
      const isSameDate =
        new Date(result.data.appointmentDate).toDateString() ===
        new Date(leave.leaveDate).toDateString();

      if (!isSameDate) {
        return false;
      }

      // Full day leave
      if (!leave.leaveStartTime || !leave.leaveEndTime) {
        return true;
      }

      return (
        appointmentStart < leave.leaveEndTime &&
        appointmentEnd > leave.leaveStartTime
      );
    });

    if (hasConflictingLeave) {
      throw new BadRequestError(
        'Doctor is unavailable during the selected slot'
      );
    }


    const startTime = new Date(appointmentStart);
    const endTime = new Date(appointmentEnd);

    if (startTime < new Date()) {
      throw new BadRequestError('Cannot book an appointment in the past');
    }

    const existingAppointment = await appointmentService.checkExistingAppointment(
      startTime, 
      endTime, 
      result.data.doctorId,
      BigInt(result.data.patientId)
    );
    if (existingAppointment) {
      if (existingAppointment.doctorId === BigInt(result.data.doctorId)) {
        throw new ResourceAlreadyExistError('Slot already booked');
      } else {
        throw new BadRequestError('You already have another appointment scheduled during this slot');
      }
    }
    let referenceNumber;
    while(true) {
      const generatedReferenceNumber = generateReferenceNumber();
      if(!generatedReferenceNumber) {
        throw new InternalServerError('Error while booking appointment');
      }
      const isReferenceNumberExist = await appointmentService.findByReferenceNumber(generatedReferenceNumber);
      if(!isReferenceNumberExist) {
        referenceNumber = generatedReferenceNumber
        break;
      }
    }

    const appointmentData = {
      doctorId: result.data.doctorId,
      patientId: result.data.patientId,
      hospitalId: result.data.hospitalId,
      appointmentDate: result.data.appointmentDate,
      appointmentStartTime: appointmentStart,
      appointmentEndTime: appointmentEnd,
      referenceNumber,
      type: result.data.type,
      status: "BOOKED",
      bookedBy: result.data.bookedBy,
    };
    const createdAppointment = await prisma.$transaction(async (tx: any) => {
      const createdAppointment = await appointmentService.create(appointmentData,tx);
      if (!result.data.payment) {
        throw new ValidationError("Payment data is required");
      }
      const invoice = await invoiceController.create(
        createdAppointment.id,
        result.data.paidBy || "SELF",
        result.data.payment,
        result.data.payment.paymentDetails,
        tx
      )
      return { createdAppointment, invoice }
    });
    const { dayBeforeReminder, twoHourReminder } = getReminderTimes(result.data.appointmentStartTime);
    const now = new Date();
    if (dayBeforeReminder > now) {
      await scheduleAppointmentReminder(
        createdAppointment.createdAppointment.id,
        "day-before",
        dayBeforeReminder
      );
    }

    if (twoHourReminder > now) {
      await scheduleAppointmentReminder(
        createdAppointment.createdAppointment.id,
        "two-hour",
        twoHourReminder
      );
    }

    if(createdAppointment.createdAppointment.type == "ONLINE") {
      await scheduleMeetingLinkSender(
        createdAppointment.createdAppointment.id,
        result.data.doctorId,
        result.data.patientId,
        appointmentStart,
        twoHourReminder,
        slotDuration
      );
    }

    const calendarConnection = await findCalendarConnectionByDoctorId(createdAppointment.createdAppointment.doctorId);
    const patient = await patientService.getPatientProfileService(createdAppointment.createdAppointment.patientId);
    if(calendarConnection) {
      const eventData: ICreateEvent = {
        appointmentReferenceNumber: createdAppointment.createdAppointment.referenceNumber,
        endTime: createdAppointment.createdAppointment.appointmentEndTime,
        startTime: createdAppointment.createdAppointment.appointmentStartTime,
        calendarId: calendarConnection.calendarId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        refreshToken: calendarConnection.refreshToken
      }

      const calendarEvent = await createEvent(eventData);
      if(calendarEvent && calendarEvent.data.id) {
        await appointmentService.addGoogleEvent(calendarEvent.data.id,createdAppointment.createdAppointment.id);
      } else {
        console.error("Error creating event");
      }
    } else {
      console.error('Google Calendar not connected');
    }
    response = {
      status: 201,
      message: 'Appointment booked successfully',
      success: true,
      data: createdAppointment,
    };

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
};

// DELETE /appointment/appointments
// Body: { appointmentId }
export const cancelAnAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let response: IResponse;

  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      throw new BadRequestError('appointmentId is required');
    }

    const isCancellationAllowed = await checkAppointmentTime(
      appointmentId,
    );

    if (!isCancellationAllowed) {
      throw new BadRequestError(
        'Appointment cannot be cancelled within 4 hours',
      );
    }

    // Staff can cancel without the 4-hour window restriction
    const role = req.user?.role;
    const cancelledBy = role === ROLE.STAFF ? 'STAFF' : 'SELF';

    await prisma.appointment.update({
      where: { id: BigInt(appointmentId) },
      data: {
        status: 'CANCELLED',
        cancelledBy,
      } as any,
    });

    await removeAppointmentReminder(BigInt((appointmentId)),"day-before");
    await removeAppointmentReminder(BigInt((appointmentId)),"two-hour");
    await removeMeetingLinkSender(BigInt(appointmentId));

    response = {
      status: 200,
      message: 'Appointment cancelled successfully',
      success: true,
      data: null,
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
};

// PATCH /appointment/appointments/reschedule
export const rescheduleAnAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let response: IResponse;

  try {
    const body = req.body;
    const id = req.params.appointmentId || req.body.appointmentId;

    if (!id || Array.isArray(id)) {
      throw new BadRequestError('Invalid appointment id');
    }

    const result = RescheduleAppointmentSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Invalid Data provided')
    }

    const bookedAppointment = await appointmentService.findAppointmentById(BigInt((id)));

    const appointmentStartTime = new Date(bookedAppointment.appointmentStartTime);
    const now = new Date();
    console.log(typeof appointmentStartTime);
    const diffInHours =
      (appointmentStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours <= 4) {
      throw new BadRequestError('Appointment cannot be reschedule 4 hours before the appointment time')
    }

    const doctorSchedule = bookedAppointment.doctor.schedule[0];
    const doctorLeaves = bookedAppointment.doctor.leaves;
    if (!doctorSchedule || !doctorLeaves) {
      throw new BadRequestError('Invalid appointment');
    }
    const slotDuration = bookedAppointment.doctor.slotDuration;

    const workingScheduleDay = doctorSchedule.workingDays;
    const workingDays = workingScheduleDay?.split(',')

    const appointmentDay = DAYS[result.data.appointmentDate.getDay()];

    const morningStart = doctorSchedule.morningStartTime;
    const morningEnd = doctorSchedule.morningEndTime;
    const eveningStart = doctorSchedule.eveningStartTime;
    const eveningEnd = doctorSchedule.eveningEndTime;

    const appointmentStart = result.data.appointmentStartTime;
    const appointmentEnd = new Date(appointmentStart.getTime() + slotDuration * 60 * 1000);

    const tz = getScheduleTimezone();

     const morningStartMinutes = morningStart
      ? getMinutesInTimezone(morningStart, tz)
      : null;

    const morningEndMinutes = morningEnd
      ? getMinutesInTimezone(morningEnd, tz)
      : null;

    const eveningStartMinutes = eveningStart
      ? getMinutesInTimezone(eveningStart, tz)
      : null;

    const eveningEndMinutes = eveningEnd
      ? getMinutesInTimezone(eveningEnd, tz)
      : null;

    const appointmentStartMinutes = getMinutesInTimezone(appointmentStart, tz);
    const appointmentEndMinutes = getMinutesInTimezone(appointmentEnd, tz);

    const isInMorningShift =
      morningStartMinutes !== null &&
      morningEndMinutes !== null &&
      appointmentStartMinutes !== null &&
      appointmentEndMinutes !== null &&
      appointmentStartMinutes >= morningStartMinutes &&
      appointmentEndMinutes <= morningEndMinutes;

    const isInEveningShift =
      eveningStartMinutes !== null &&
      eveningEndMinutes !== null &&
      appointmentStartMinutes !== null &&
      appointmentEndMinutes !== null &&
      appointmentStartMinutes >= eveningStartMinutes &&
      appointmentEndMinutes <= eveningEndMinutes;

    if (!isInMorningShift && !isInEveningShift) {
      console.error('here');

      throw new BadRequestError(
        "Appointment time is outside doctor working hours"
      );
    }

    if (!appointmentDay || !workingDays?.includes(appointmentDay)) {
      throw new BadRequestError(
        `Doctor is not available on ${appointmentDay}`
      );
    }

    const hasConflictingLeave = doctorLeaves.some((leave: any) => {
      
      const isSameDate = new Date(result.data.appointmentDate).toDateString() === new Date(leave.leaveDate).toDateString();

      if (!isSameDate) {
        return false;
      }

      // Full day leave
      if (!leave.leaveStartTime || !leave.leaveEndTime) {
        return true;
      }

      return (
        appointmentStart < leave.leaveEndTime &&
        appointmentEnd > leave.leaveStartTime
      );
    });

    if (hasConflictingLeave) {
      throw new BadRequestError(
        'Doctor is unavailable during the selected slot'
      );
    }

    const startTime = new Date(appointmentStart);
    const endTime = new Date(appointmentEnd);

    if (startTime < new Date()) {
      throw new BadRequestError('Cannot reschedule an appointment in the past');
    }

    const existingAppointment = await appointmentService.checkExistingAppointment(
      startTime, 
      endTime, 
      bookedAppointment.doctorId,
      bookedAppointment.patientId,
      bookedAppointment.id
    );
    if (existingAppointment) {
      if (existingAppointment.doctorId === bookedAppointment.doctorId) {
        throw new ResourceAlreadyExistError('Slot already booked');
      } else {
        throw new BadRequestError('You already have another appointment scheduled during this slot');
      }
    }
    const rescheduleData: RescheduleAppointmentDto = {
      newAppointmentDate: result.data.appointmentDate,
      newStartTime: result.data.appointmentStartTime,
      newEndTime: appointmentEnd
    }
    const updatedAppointment = await appointmentService.reschedule(rescheduleData, BigInt((id)));
    await removeAppointmentReminder(BigInt((id)),"day-before");
    await removeAppointmentReminder(BigInt((id)),"two-hour");
    
    if(updatedAppointment.type == "ONLINE") {
      await removeMeetingLinkSender(BigInt(id));
    }

    const { dayBeforeReminder, twoHourReminder } = getReminderTimes(result.data.appointmentStartTime);

    
    if (dayBeforeReminder > now) {
      await scheduleAppointmentReminder(
        BigInt(id),
        "day-before",
        dayBeforeReminder
      );
    }

    if (twoHourReminder > now) {
      await scheduleAppointmentReminder(
        BigInt((id)),
        "two-hour",
        twoHourReminder
      );
    }

    if(updatedAppointment.type == "ONLINE") {
      await scheduleMeetingLinkSender(
        BigInt(id),
        updatedAppointment.doctorId,
        updatedAppointment.patientId,
        updatedAppointment.appointmentStartTime,
        twoHourReminder,
        slotDuration
      )
    }


    response = {
      status: 200,
      message: 'Appointment rescheduled successfully',
      success: true,
      data: updatedAppointment,
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
};

export const updateAppointmentStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let response: IResponse;

  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!appointmentId || !status) {
      throw new BadRequestError('appointmentId and status are required');
    }

    const validStatuses = ['BOOKED', 'CANCELLED', 'RESCHEDULED', 'ON_GOING', 'NO_SHOW', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const existing = await prisma.appointment.findUnique({
      where: { id: BigInt(appointmentId as string) }
    });
    if (!existing) {
      throw new NotFoundError('Appointment not found');
    }

    const now = new Date();

    if (status === 'ON_GOING') {
      const appointmentStartTime = new Date(existing.appointmentStartTime);
      if (now < appointmentStartTime) {
        throw new BadRequestError('Cannot check in before the scheduled appointment start time.');
      }
    }

    let updatedAppointment;

    if (status === 'COMPLETED') {
      const updateData: any = {
        appointmentEndTime: now,
      };
      if (existing.status === 'CANCELLED' || existing.status === 'NO_SHOW') {
        updateData.status = 'ON_GOING';
      }
      updatedAppointment = await prisma.appointment.update({
        where: { id: BigInt(appointmentId as string) },
        data: updateData,
      });
    } else {
      const updateData: any = {
        status: status as any,
      };

      // If transitioning to active status but end time is in the past, extend it by 30 mins so it becomes active.
      if (['BOOKED', 'ON_GOING', 'RESCHEDULED'].includes(status) && new Date(existing.appointmentEndTime) <= now) {
        updateData.appointmentEndTime = new Date(now.getTime() + 30 * 60 * 1000);
        if (new Date(existing.appointmentStartTime) <= now) {
          updateData.appointmentStartTime = now;
        }
      }

      updatedAppointment = await prisma.appointment.update({
        where: { id: BigInt(appointmentId as string) },
        data: updateData,
      });
    }

    response = {
      status: 200,
      message: 'Appointment status updated successfully',
      success: true,
      data: {
        ...updatedAppointment,
        id: updatedAppointment.id.toString(),
      },
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
};

