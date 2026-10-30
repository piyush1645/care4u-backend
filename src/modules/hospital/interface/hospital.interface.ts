export interface IHospital {
    id?: number
    name: string
    photo: string
    isActive?: boolean
    hospitalGroupId: number | bigint
}

export interface IHospitalUpdate {
    name?: string | undefined
    photo?: string | undefined
    isActive?: boolean | undefined
    hospitalGroupId?: number | bigint
}