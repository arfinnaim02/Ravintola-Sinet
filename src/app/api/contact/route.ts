export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "../../../lib/prisma";

function isRealSmtpConfigured() {
  const host = process.env.MAIL_HOST || "";

  return Boolean(
    host &&
      host !== "smtp.example.com" &&
      process.env.MAIL_USER &&
      process.env.MAIL_PASS
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Name, email and message are required." },
        { status: 400 }
      );
    }

    const savedMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
      },
    });

    let emailStatus = "skipped";

    if (isRealSmtpConfigured()) {
      try {
        const siteEmail = process.env.SITE_EMAIL || process.env.MAIL_USER || "";

        const transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT || 587),
          secure: process.env.MAIL_SECURE === "true",
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: siteEmail,
          to: siteEmail,
          replyTo: email,
          subject: `New Contact Message — ${name}`,
          html: `
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br/>")}</p>
          `,
        });

        emailStatus = "sent";
      } catch (error) {
        console.error("Contact email failed:", error);
        emailStatus = "failed";
      }
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully.",
      emailStatus,
      contactMessage: savedMessage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to send message." },
      { status: 500 }
    );
  }
}