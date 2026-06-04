import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Inicializa el cliente SES con las credenciales del entorno
const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY_ID || "",
    },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { to, summary } = req.body ?? {};

    if (!to || !summary) {
        return res
            .status(400)
            .json({ error: "Missing required fields: to, summary" });
    }

    const from = process.env.SES_FROM_EMAIL;
    if (!from) {
        return res
            .status(500)
            .json({ error: "Server misconfigured: SES_FROM_EMAIL missing" });
    }

    try {
        const command = new SendEmailCommand({
            Source: from,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: "Tu resumen de TODOs" },
                Body: { Text: { Data: summary } },
            },
        });

        const result = await ses.send(command);

        return res.status(200).json({
            ok: true,
            messageId: result.MessageId,
        });
    } catch (err: any) {
        console.error("SES send error:", err?.name, err?.message);

        return res.status(500).json({
            ok: false,
            error: err?.name ?? "UnknownError",
            message: err?.message ?? "Failed to send email",
        });
    }
}