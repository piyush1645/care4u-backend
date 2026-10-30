export interface IAttachment {
    id?: bigint | number
    url: string
    secretKey: string | null
    type: "PRESCRIPTION" | "REPORT"
    prescriptionId: bigint
}