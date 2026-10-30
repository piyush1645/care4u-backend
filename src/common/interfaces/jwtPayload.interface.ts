export interface IJwtPayload {
  userId: bigint | number;
  email: string;
  role: 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'STAFF' | 'SUPER_ADMIN';
}
