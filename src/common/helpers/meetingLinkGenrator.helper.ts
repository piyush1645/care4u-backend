import { randomCharacter } from "./referenceGenrator.helper.js";

export const generateMeetingCode = (): string => {
    return `${randomCharacter(3)}-${randomCharacter(4)}-${randomCharacter(3)}`;
}