export const appointmentReminderDayAgoTemplate = (
    patientName: string,
    doctorName: string,
    date: Date,
    time: Date,
    consultationType: string,
) => {
    return `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Reminder</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb;padding:30px 15px;">
        <tr>
            <td align="center">

                <table
                    width="600"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        background:#ffffff;
                        border-radius:12px;
                        overflow:hidden;
                        box-shadow:0 4px 12px rgba(0,0,0,0.08);
                    "
                >

                    <!-- HEADER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#2563eb;
                                padding:35px 20px;
                                color:#ffffff;
                            "
                        >
                            <div
                                style="
                                    font-size:36px;
                                    font-weight:bold;
                                    letter-spacing:1px;
                                "
                            >
                                Care4U
                            </div>

                            <p
                                style="
                                    margin:10px 0 0;
                                    font-size:15px;
                                    color:#dbeafe;
                                "
                            >
                                Your Health, Our Priority
                            </p>
                        </td>
                    </tr>

                    <!-- TITLE -->
                    <tr>
                        <td
                            align="center"
                            style="
                                padding:30px 30px 10px;
                            "
                        >
                            <h2
                                style="
                                    margin:0;
                                    color:#111827;
                                    font-size:28px;
                                "
                            >
                                Appointment Reminder
                            </h2>
                        </td>
                    </tr>

                    <!-- CONTENT -->
                    <tr>
                        <td
                            style="
                                padding:20px 35px;
                                color:#374151;
                                font-size:16px;
                                line-height:1.7;
                            "
                        >

                            <p>
                                Hello <strong>${patientName}</strong>,
                            </p>

                            <p>
                                This is a friendly reminder that you have an appointment scheduled for tomorrow.
                            </p>

                            <!-- APPOINTMENT DETAILS CARD -->
                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    margin:25px 0;
                                    background:#f8fafc;
                                    border:1px solid #e5e7eb;
                                    border-radius:10px;
                                "
                            >
                                <tr>
                                    <td style="padding:25px;">

                                        <h3
                                            style="
                                                margin-top:0;
                                                margin-bottom:20px;
                                                color:#2563eb;
                                            "
                                        >
                                            Appointment Details
                                        </h3>

                                        <p style="margin:10px 0;">
                                            <strong>Doctor:</strong>
                                            ${doctorName}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Date:</strong>
                                            ${date}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Time:</strong>
                                            ${time}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Consultation Type:</strong>
                                            ${consultationType}
                                        </p>

                                    </td>
                                </tr>
                            </table>

                            <!-- INFO BOX -->
                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    background:#eff6ff;
                                    border-left:4px solid #2563eb;
                                    margin:25px 0;
                                "
                            >
                                <tr>
                                    <td style="padding:16px;">
                                        <strong>Reminder:</strong>
                                        Please join the consultation
                                        5-10 minutes before the scheduled
                                        appointment time.
                                    </td>
                                </tr>
                            </table>

                            <p>
                                If you need to reschedule or cancel your appointment,
                                please do so at the earliest convenience.
                            </p>

                            <p>
                                We look forward to assisting you.
                            </p>

                            <p style="margin-top:30px;">
                                Regards,<br>
                                <strong>Care4U Team</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#f8fafc;
                                padding:25px;
                                color:#6b7280;
                                font-size:13px;
                                border-top:1px solid #e5e7eb;
                            "
                        >
                            © 2026 Care4U. All rights reserved.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `;
}

export const appointmentReminderTwoHourAgoTemplate = (
    patientName: string,
    doctorName: string,
    date: Date,
    time: Date,
    consultationType: string,
) => {
    return `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Starting Soon</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb;padding:30px 15px;">
        <tr>
            <td align="center">

                <table
                    width="600"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        background:#ffffff;
                        border-radius:12px;
                        overflow:hidden;
                        box-shadow:0 4px 12px rgba(0,0,0,0.08);
                    "
                >

                    <!-- HEADER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#2563eb;
                                padding:35px 20px;
                                color:#ffffff;
                            "
                        >
                            <div
                                style="
                                    font-size:36px;
                                    font-weight:bold;
                                    letter-spacing:1px;
                                "
                            >
                                Care4U
                            </div>

                            <p
                                style="
                                    margin:10px 0 0;
                                    font-size:15px;
                                    color:#dbeafe;
                                "
                            >
                                Your Health, Our Priority
                            </p>
                        </td>
                    </tr>

                    <!-- ALERT SECTION -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#eff6ff;
                                padding:25px;
                                border-bottom:1px solid #dbeafe;
                            "
                        >
                            <h2
                                style="
                                    margin:0;
                                    color:#1d4ed8;
                                    font-size:28px;
                                "
                            >
                                Your Appointment Starts in 2 Hours
                            </h2>
                        </td>
                    </tr>

                    <!-- CONTENT -->
                    <tr>
                        <td
                            style="
                                padding:30px 35px;
                                color:#374151;
                                font-size:16px;
                                line-height:1.7;
                            "
                        >

                            <p>
                                Hello <strong>${patientName}</strong>,
                            </p>

                            <p>
                                This is a reminder that your appointment is scheduled to begin in approximately <strong>2 hours</strong>.
                            </p>

                            <!-- DETAILS CARD -->
                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    margin:25px 0;
                                    background:#f8fafc;
                                    border:1px solid #e5e7eb;
                                    border-radius:10px;
                                "
                            >
                                <tr>
                                    <td style="padding:25px;">

                                        <h3
                                            style="
                                                margin-top:0;
                                                margin-bottom:20px;
                                                color:#2563eb;
                                            "
                                        >
                                            Appointment Details
                                        </h3>

                                        <p style="margin:10px 0;">
                                            <strong>Doctor:</strong>
                                            ${doctorName}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Date:</strong>
                                            ${date}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Time:</strong>
                                            ${time}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Consultation Type:</strong>
                                            ${consultationType}
                                        </p>

                                    </td>
                                </tr>
                            </table>

                            <!-- JOIN BUTTON -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding:15px 0 25px;">
                                        <a
                                            href="{{meetingLink}}"
                                            style="
                                                background:#2563eb;
                                                color:#ffffff;
                                                text-decoration:none;
                                                padding:14px 28px;
                                                border-radius:8px;
                                                display:inline-block;
                                                font-size:16px;
                                                font-weight:bold;
                                            "
                                        >
                                            Join Appointment
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- REMINDER BOX -->
                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    background:#eff6ff;
                                    border-left:4px solid #2563eb;
                                    margin:20px 0;
                                "
                            >
                                <tr>
                                    <td style="padding:16px;">
                                        <strong>Before You Join:</strong>
                                        <ul style="margin:10px 0 0 20px;padding:0;">
                                           ${
                                                consultationType === "ONLINE"
                                                    ? `
                                            <li>Ensure you have a stable internet connection.</li>
                                            <li>Keep your camera and microphone ready.</li>
                                            `
                                                    : ""
                                            }
                                            <li>Join 5-10 minutes before the scheduled time.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p>
                                If you are unable to attend, please notify us as soon as possible.
                            </p>

                            <p style="margin-top:30px;">
                                Regards,<br>
                                <strong>Care4U Team</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#f8fafc;
                                padding:25px;
                                color:#6b7280;
                                font-size:13px;
                                border-top:1px solid #e5e7eb;
                            "
                        >
                            © {{2026}} Care4U. All rights reserved.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `
}

export const appointmentLinkTemplate = (
    patientName: string,
    doctorName: string,
    date: Date,
    time: Date,
    link: string
) => {
    return `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telemedicine Appointment Confirmation</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb;padding:30px 15px;">
        <tr>
            <td align="center">

                <table
                    width="600"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        background:#ffffff;
                        border-radius:12px;
                        overflow:hidden;
                        box-shadow:0 4px 12px rgba(0,0,0,0.08);
                    "
                >

                    <!-- HEADER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#2563eb;
                                padding:35px 20px;
                                color:#ffffff;
                            "
                        >
                            <div
                                style="
                                    font-size:36px;
                                    font-weight:bold;
                                    letter-spacing:1px;
                                "
                            >
                                Care4U
                            </div>

                            <p
                                style="
                                    margin:10px 0 0;
                                    font-size:15px;
                                    color:#dbeafe;
                                "
                            >
                                Your Health, Our Priority
                            </p>
                        </td>
                    </tr>

                    <!-- TITLE -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#eff6ff;
                                padding:25px;
                                border-bottom:1px solid #dbeafe;
                            "
                        >
                            <h2
                                style="
                                    margin:0;
                                    color:#1d4ed8;
                                    font-size:28px;
                                "
                            >
                                Telemedicine Appointment Confirmed
                            </h2>
                        </td>
                    </tr>

                    <!-- CONTENT -->
                    <tr>
                        <td
                            style="
                                padding:30px 35px;
                                color:#374151;
                                font-size:16px;
                                line-height:1.7;
                            "
                        >

                            <p>
                                Hello <strong>${patientName}</strong>,
                            </p>

                            <p>
                                Your telemedicine appointment has been successfully scheduled.
                                Please use the secure meeting link below to join your consultation.
                            </p>

                            <!-- DETAILS CARD -->
                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    margin:25px 0;
                                    background:#f8fafc;
                                    border:1px solid #e5e7eb;
                                    border-radius:10px;
                                "
                            >
                                <tr>
                                    <td style="padding:25px;">

                                        <h3
                                            style="
                                                margin-top:0;
                                                margin-bottom:20px;
                                                color:#2563eb;
                                            "
                                        >
                                            Appointment Details
                                        </h3>

                                        <p style="margin:10px 0;">
                                            <strong>Doctor:</strong>
                                            ${doctorName}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Date:</strong>
                                            ${date}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Time:</strong>
                                            ${time}
                                        </p>

                                        <p style="margin:10px 0;">
                                            <strong>Consultation Type:</strong>
                                            Telemedicine (Online)
                                        </p>

                                    </td>
                                </tr>
                            </table>

                            <!-- JOIN BUTTON -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding:15px 0;">
                                        <a
                                            href="${link}"
                                            style="
                                                background:#2563eb;
                                                color:#ffffff;
                                                text-decoration:none;
                                                padding:15px 30px;
                                                border-radius:8px;
                                                display:inline-block;
                                                font-size:16px;
                                                font-weight:bold;
                                            "
                                        >
                                            Join Telemedicine Session
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- FALLBACK LINK -->
                            <p
                                style="
                                    text-align:center;
                                    font-size:14px;
                                    color:#6b7280;
                                    margin-top:15px;
                                    word-break:break-all;
                                "
                            >
                                If the button doesn't work, copy and paste the following link into your browser:
                                <br><br>
                                <a
                                    href="${link}"
                                    style="color:#2563eb;"
                                >
                                    ${link}
                                </a>
                            </p>

                            <!-- INFO BOX -->
                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="
                                    background:#eff6ff;
                                    border-left:4px solid #2563eb;
                                    margin:25px 0;
                                "
                            >
                                <tr>
                                    <td style="padding:16px;">
                                        <strong>Before Your Consultation:</strong>

                                        <ul style="margin:10px 0 0 20px;padding:0;">
                                            <li>Ensure you have a stable internet connection.</li>
                                            <li>Test your camera and microphone beforehand.</li>
                                            <li>Keep your prescriptions and medical records nearby.</li>
                                            <li>Join 5–10 minutes before your scheduled appointment.</li>
                                            <li>Use a quiet and well-lit environment.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p>
                                If you need to reschedule or cancel your appointment,
                                please contact us at the earliest convenience.
                            </p>

                            <p style="margin-top:30px;">
                                Regards,<br>
                                <strong>Care4U Team</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td
                            align="center"
                            style="
                                background:#f8fafc;
                                padding:25px;
                                color:#6b7280;
                                font-size:13px;
                                border-top:1px solid #e5e7eb;
                            "
                        >
                            © 2026 Care4U. All rights reserved.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `
}