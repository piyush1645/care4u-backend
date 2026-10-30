import axios from "axios";
import { InternalServerError } from "../handlers/error.handlers.js";

export const generateZoomAccessToken = async () => {
    try {
        const credentials = Buffer.from(
                `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
            ).toString("base64");
            const response = await axios.post(
                `https://zoom.us/oauth/token`,
                null,
                {
                    params: {
                        grant_type: "account_credentials",
                        account_id: process.env.ZOOM_ACCOUNT_ID
                    },
                    headers: {
                        Authorization: `Basic ${credentials}`
                    }
                }
            );
            return response.data.access_token;
    } catch (error) {
        console.error(error);
        throw new InternalServerError('Error while generating access token');
    }
}