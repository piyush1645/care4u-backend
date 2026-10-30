export interface IAddress {
    id?: number
    addressLine1: string
    addressLine2?: string | null
    city: string
    state: string
    pincode: string
    country: string
    hospitalId: number | bigint
}