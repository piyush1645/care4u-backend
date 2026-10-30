declare namespace NodeJS {
    interface ProcessEnv{
        PORT: string
        FRONTEND_URL: string

        DATABASE_DAILECT: string
        DATABSE_URL: string
        DATABASE_USER: string
        DATABASE_PASSWORD: string
        DATABASE: string
        DATABASE_HOST: string

        JWT_SECRET: string
    }
}