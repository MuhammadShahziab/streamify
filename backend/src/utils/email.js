import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: '"Streamify App" <no-reply@streamapp.com>',
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);
};
