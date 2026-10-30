import axios from "axios";
import { generateZoomAccessToken } from "../../../common/helpers/zoom.helper.js"
import { InternalServerError } from "../../../common/handlers/error.handlers.js";
export const createMeeting = async (
    topic: string,
    startTime: string,
    duration: number
) => {
    try {
        const accessToken = await generateZoomAccessToken();
        console.log("Access Token",accessToken);
        
        const response = await axios.post(
            "https://api.zoom.us/v2/users/me/meetings",
            {
                topic,
                type: 2,
                start_time: startTime,
                duration,
                timezone: "Asia/Kolkata",
                settings: {
                    waiting_room: true,
                    join_before_host: false
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )
        return response.data
    } catch (error) {
        console.error(error);
        throw new InternalServerError("Error while generating meeting link")
    }
}