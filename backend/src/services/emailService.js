/**
 * Service: Email Service
 * Centralizes ALL email templates and sending logic.
 * Controllers call named functions — they never build HTML inline.
 */

const { sendEmail } = require('../config/nodemailer');

// ─── Base Layout ─────────────────────────────────────────────────────────────
const emailLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BizConnect</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563EB,#1d4ed8);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">BizConnect</h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Business Directory & Booking Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} BizConnect. All rights reserved.<br/>
                You received this email because you have an account on BizConnect.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Button Helper ────────────────────────────────────────────────────────────
const ctaButton = (href, text) =>
  `<a href="${href}" style="display:inline-block;background:#2563EB;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;margin-top:16px;">${text}</a>`;

// ─── Info Row Helper ──────────────────────────────────────────────────────────
const infoRow = (label, value) =>
  `<tr>
    <td style="padding:10px 16px;font-size:14px;font-weight:600;color:#374151;background:#F8FAFC;border-radius:4px;width:140px;">${label}</td>
    <td style="padding:10px 16px;font-size:14px;color:#1e293b;">${value}</td>
  </tr>`;

// ─── Heading Helper ───────────────────────────────────────────────────────────
const heading = (text) =>
  `<h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:700;">${text}</h2>`;

const subtext = (text) =>
  `<p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">${text}</p>`;

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Welcome email after registration
 */
const sendWelcomeEmail = async ({ to, name, role }) => {
  const roleLabel = role === 'business_owner' ? 'Business Owner' : 'Customer';
  const actionUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const actionText = role === 'business_owner' ? 'Set Up Your Business' : 'Browse Businesses';
  const actionPath = role === 'business_owner' ? '/dashboard/business' : '/businesses';

  const html = emailLayout(`
    ${heading(`Welcome to BizConnect, ${name}! 🎉`)}
    ${subtext(`Your account has been created as a <strong>${roleLabel}</strong>. You're all set to get started.`)}
    <p style="margin:0 0 8px;color:#374151;font-size:15px;">Here's what you can do:</p>
    <ul style="color:#64748b;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
      ${role === 'business_owner'
        ? '<li>Create your business profile</li><li>Add your services</li><li>Start accepting appointments</li>'
        : '<li>Browse local businesses</li><li>Book appointments</li><li>Leave reviews</li>'}
    </ul>
    ${ctaButton(actionUrl + actionPath, actionText)}
  `);

  await sendEmail({ to, subject: `Welcome to BizConnect, ${name}! 🎉`, html });
};

/**
 * Appointment booking confirmation (sent to the customer)
 */
const sendAppointmentConfirmationEmail = async ({ to, customerName, businessName, serviceName, date, timeSlot, amount }) => {
  const html = emailLayout(`
    ${heading('Appointment Confirmed! ✅')}
    ${subtext(`Hi ${customerName}, your appointment has been booked successfully.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      ${infoRow('Business', businessName)}
      ${infoRow('Service', serviceName)}
      ${infoRow('Date', date)}
      ${infoRow('Time', `${timeSlot.start} – ${timeSlot.end}`)}
      ${infoRow('Amount', `$${amount}`)}
    </table>
    ${subtext('The business will confirm your appointment shortly. You\'ll receive another email when they do.')}
    ${ctaButton((process.env.CLIENT_URL || 'http://localhost:5173') + '/dashboard/customer', 'View Appointment')}
  `);

  await sendEmail({ to, subject: `Appointment Booked – ${businessName}`, html });
};

/**
 * Appointment status update email (confirmed / cancelled / completed)
 */
const sendAppointmentStatusEmail = async ({ to, recipientName, status, businessName, serviceName, date }) => {
  const statusConfig = {
    confirmed: {
      emoji: '✅',
      title: 'Appointment Confirmed',
      body: `Great news! Your appointment for <strong>${serviceName}</strong> at <strong>${businessName}</strong> on <strong>${date}</strong> has been confirmed.`,
      cta: 'View Appointment',
    },
    cancelled: {
      emoji: '❌',
      title: 'Appointment Cancelled',
      body: `Your appointment for <strong>${serviceName}</strong> at <strong>${businessName}</strong> on <strong>${date}</strong> has been cancelled.`,
      cta: 'Book Again',
    },
    completed: {
      emoji: '🌟',
      title: 'Appointment Completed',
      body: `Your appointment for <strong>${serviceName}</strong> at <strong>${businessName}</strong> has been marked as completed. We hope you had a great experience!`,
      cta: 'Leave a Review',
    },
  };

  const config = statusConfig[status] || statusConfig.confirmed;
  const html = emailLayout(`
    ${heading(`${config.emoji} ${config.title}`)}
    ${subtext(`Hi ${recipientName},`)}
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">${config.body}</p>
    ${ctaButton((process.env.CLIENT_URL || 'http://localhost:5173') + '/dashboard/customer', config.cta)}
  `);

  await sendEmail({ to, subject: `${config.title} – ${businessName}`, html });
};

/**
 * New appointment notification email (sent to the business owner)
 */
const sendNewAppointmentOwnerEmail = async ({ to, ownerName, customerName, serviceName, date, timeSlot }) => {
  const html = emailLayout(`
    ${heading('New Appointment Request 📅')}
    ${subtext(`Hi ${ownerName}, you have a new appointment request.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      ${infoRow('Customer', customerName)}
      ${infoRow('Service', serviceName)}
      ${infoRow('Date', date)}
      ${infoRow('Time', `${timeSlot.start} – ${timeSlot.end}`)}
    </table>
    ${subtext('Please review and confirm or reject this appointment from your dashboard.')}
    ${ctaButton((process.env.CLIENT_URL || 'http://localhost:5173') + '/dashboard/business', 'Manage Appointments')}
  `);

  await sendEmail({ to, subject: `New Appointment – ${customerName} booked ${serviceName}`, html });
};

module.exports = {
  sendWelcomeEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentStatusEmail,
  sendNewAppointmentOwnerEmail,
};
