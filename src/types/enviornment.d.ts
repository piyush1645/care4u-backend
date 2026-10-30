declare namespace NodeJS {
    interface ProcessEnv{
        PORT: string
        FRONTEND_URL: string

        DATABASE_DAILECT: string
        DATABASE_URL: string
        DATABASE_USER: string
        DATABASE_PASSWORD: string
        DATABASE: string
        DATABASE_HOST: string

        ACCESS_JWT_SECRET: string
        REFRESH_JWT_SECRET: string
        COMMON_JWT_SECRET: string

        REDIS_HOST: string
        REDIS_PORT: string
        REDIS_USERNAME: string
        REDIS_PASSWORD: string

        IMAGE_KIT_PRIVATE_KEY: string
        IMAGE_KIT_ENDPOINT: string
        IMAGE_KIT_PUBLIC_KEY: string

        MEETING_LINK: string

        ZOOM_CLIENT_ID: string
        ZOOM_CLIENT_SECRET: string
        ZOOM_SECRET_TOKEN: string

        GOOGLE_CLIENT_ID: string
        GOOGLE_CLIENT_SECRET: string
        GOOGLE_REDIRECT_URL: string

        FRONTEND_URL: string
    }
}