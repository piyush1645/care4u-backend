export interface IInvoice {
    id?: bigint
    consultationFees: number
    taxRate: number
    taxCharges: number
    totalAmount: number
    appointmentId: bigint
    paidBy: string
}