import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is missing. Email notifications will be disabled.');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
export const SENDER_EMAIL = 'workwithus@balancenutrition.in';
