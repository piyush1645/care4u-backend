export interface ICreateCalendarConnection {
    doctorId: bigint
    email: string
    calendarId: string
    refreshToken: string
}

export interface ICreateEvent {
    refreshToken: string
    patientName: string
    appointmentReferenceNumber: string
    startTime: Date
    endTime: Date
    calendarId: string
}