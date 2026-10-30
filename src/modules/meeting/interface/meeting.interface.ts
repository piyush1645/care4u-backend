export interface IMeeting {
    id?: bigint
    startTime: Date
    startUrl: string
    joinUrl: string
    password: string
    link: string
    status?: "UPCOMING" | "COMPLETED" | "IN_PROGRESS"
    appointmentId: bigint
    doctorId: bigint
    patientId: bigint   
}