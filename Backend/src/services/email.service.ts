import '../config/env';
import nodemailer from 'nodemailer';

const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || (smtpPort === 465 ? 'true' : 'false')).toLowerCase() === 'true';
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();
const smtpFrom = (process.env.SMTP_FROM || smtpUser).trim();
const isPlaceholderPassword = /APP_PASSWORD_16_KY_TU|your-16-character-app-password/i.test(smtpPass);

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
});

export const isEmailConfigured = (): boolean => Boolean(smtpUser && smtpPass && smtpFrom && !isPlaceholderPassword);

export const sendPasswordResetOtp = async (recipientEmail: string, otp: string): Promise<void> => {
    if (!isEmailConfigured()) {
        throw new Error('Backend chưa được cấu hình Gmail SMTP. Vui lòng thay SMTP_PASS bằng Gmail App Password thật trong Backend/.env.');
    }

    await transporter.sendMail({
        from: smtpFrom,
        // SMTP_USER is only the sender; the OTP goes to the user's email.
        to: recipientEmail,
        subject: 'Mã OTP đặt lại mật khẩu Kids English',
        text: `Mã OTP đặt lại mật khẩu Kids English của bạn là ${otp}. Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b">
            <h2 style="color:#2563eb">Kids English</h2>
            <p>Bạn vừa yêu cầu đặt lại mật khẩu.</p>
            <p>Mã OTP của bạn là:</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb">${otp}</p>
            <p>Mã có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p>
          </div>
        `
    });
};
