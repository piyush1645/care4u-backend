export interface IPayment {
    id?: bigint
    amount: number
    type: 'CARD' | 'UPI' | 'NET_BANKING' | 'CASH' | 'ADVANCE'
    status: 'SUCCESS' | 'PENDING' | 'FAILED',
    invoiceId: bigint
}

export interface ICreatePayment {
    amount: number
    type: 'CARD' | 'UPI' | 'NET_BANKING' | 'CASH' | 'ADVANCE'
    status: 'SUCCESS' | 'PENDING' | 'FAILED',
}

export interface IPaymentDetails {
    id?: bigint
    cardNumber?: string
    upiId?: string
    paymentId: bigint
    transactionId?: string
}

export interface ICreatePaymentDetails {
    cardNumber?: string | undefined
    upiId?: string | undefined
    transactionId?: string | undefined
}
