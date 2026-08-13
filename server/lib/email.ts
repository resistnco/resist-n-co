import { prisma } from './prisma';
import { getSetting } from './services';
import nodemailer from 'nodemailer';

// ============================================================
// Email Service — supports Resend API or Gmail SMTP
// ============================================================

const resendApiKey = process.env.EMAIL_API_KEY || '';
const gmailUser = process.env.GMAIL_USER || '';
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || '';
const emailFrom = process.env.EMAIL_FROM || 'Resist N Co <onboarding@resend.dev>';

export function isEmailConfigured(): boolean {
  return !!resendApiKey || (!!gmailUser && !!gmailAppPassword);
}

export function getEmailMethod(): string {
  if (resendApiKey) return 'resend';
  if (gmailUser && gmailAppPassword) return 'gmail';
  return 'none';
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log(`[Email] Not configured. Would send to ${to}: ${subject}`);
    return false;
  }
  try {
    if (resendApiKey) {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: emailFrom,
        to,
        subject,
        html,
        reply_to: 'resistnco@protonmail.com',
      });
      console.log(`[Email] Sent via Resend to ${to}: ${subject}`);
      return true;
    } else {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailAppPassword },
      });
      await transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        html,
        replyTo: 'resistnco@protonmail.com',
      });
      console.log(`[Email] Sent via Gmail to ${to}: ${subject}`);
      return true;
    }
  } catch (err: any) {
    console.error(`[Email] Failed to send to ${to}: ${err.message}`);
    return false;
  }
}

// Fetch order items for inclusion in emails
async function getOrderItems(orderId: number): Promise<any[]> {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  return items.map(item => ({
    name: item.productName,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }));
}

// Build HTML table for order items recap
function orderItemsHtml(items: any[]): string {
  if (!items || items.length === 0) return '';
  let rows = items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#f5f5f5;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;text-align:center;">${item.size}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;text-align:center;">${item.color}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#D32F2F;text-align:right;font-weight:bold;">${item.totalPrice.toFixed(2)} $</td>
    </tr>
  `).join('');

  return `
    <div style="margin:20px 0;">
      <p style="font-weight:bold;margin:0 0 10px;color:#f5f5f5;">Récapitulatif de la commande:</p>
      <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="border-bottom:2px solid #D32F2F;">
            <th style="padding:10px 12px;text-align:left;color:#D32F2F;font-size:13px;text-transform:uppercase;">Produit</th>
            <th style="padding:10px 12px;text-align:center;color:#D32F2F;font-size:13px;text-transform:uppercase;">Taille</th>
            <th style="padding:10px 12px;text-align:center;color:#D32F2F;font-size:13px;text-transform:uppercase;">Couleur</th>
            <th style="padding:10px 12px;text-align:center;color:#D32F2F;font-size:13px;text-transform:uppercase;">Qté</th>
            <th style="padding:10px 12px;text-align:right;color:#D32F2F;font-size:13px;text-transform:uppercase;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// Build shipping address HTML
function shippingAddressHtml(order: any): string {
  return `
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0;">
      <p style="margin:0 0 10px;font-weight:bold;color:#D32F2F;">Adresse de livraison:</p>
      <p style="margin:3px 0;color:#ccc;">${order.customerName}</p>
      <p style="margin:3px 0;color:#ccc;">${order.shippingAddress}</p>
      <p style="margin:3px 0;color:#ccc;">${order.city}, ${order.province} ${order.postalCode}</p>
      <p style="margin:3px 0;color:#ccc;">${order.country || 'Canada'}</p>
    </div>
  `;
}

// Build order summary box
function orderSummaryHtml(order: any, items: any[]): string {
  const itemsHtml = orderItemsHtml(items);
  const shippingHtml = shippingAddressHtml(order);
  const subtotal = order.subtotal || (order.total - (order.shipping || 0) - (order.taxes || 0));

  return `
    ${itemsHtml}
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0;">
      <p style="margin:5px 0;color:#ccc;display:flex;justify-content:space-between;"><span>Sous-total:</span> <span>${subtotal.toFixed(2)} $</span></p>
      <p style="margin:5px 0;color:#ccc;display:flex;justify-content:space-between;"><span>Livraison:</span> <span>${(order.shipping || 0).toFixed(2)} $</span></p>
      <p style="margin:5px 0;color:#ccc;display:flex;justify-content:space-between;"><span>Taxes (TPS+TVQ):</span> <span>${(order.taxes || 0).toFixed(2)} $</span></p>
      <p style="margin:10px 0 0;padding-top:10px;border-top:1px solid #333;display:flex;justify-content:space-between;font-size:18px;font-weight:bold;color:#D32F2F;"><span>Total:</span> <span>${order.total.toFixed(2)} $ CAD</span></p>
    </div>
    ${shippingHtml}
  `;
}

function emailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #D32F2F;padding-bottom:20px;">
      <h1 style="color:#D32F2F;font-size:28px;font-weight:900;letter-spacing:2px;text-transform:uppercase;margin:0;">Resist N Co</h1>
      <p style="color:#888;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:5px 0 0;">Résistez. Habillez vos convictions.</p>
    </div>
    ${content}
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #333;text-align:center;color:#666;font-size:12px;">
      <p>© ${new Date().getFullYear()} Resist N Co. Pas de planète B.</p>
      <p>resistnco@protonmail.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOrderCreatedEmail(order: any) {
  const items = await getOrderItems(order.id);
  const summary = orderSummaryHtml(order, items);
  const html = emailTemplate(`
    <h2 style="color:#D32F2F;">Commande confirmée</h2>
    <p style="font-size:16px;">Merci pour votre commande, ${order.customerName}!</p>
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0;">
      <p style="margin:5px 0;"><strong>Numéro:</strong> ${order.orderNumber}</p>
      <p style="margin:5px 0;"><strong>Méthode:</strong> ${order.paymentMethod === 'stripe' ? 'Carte de crédit (Stripe)' : 'Virement Interac'}</p>
    </div>
    ${summary}
    <p>Vous recevrez un courriel de confirmation dès que le paiement sera traité.</p>
  `, `Commande ${order.orderNumber}`);
  await sendEmail(order.customerEmail, `Commande ${order.orderNumber} — Resist N Co`, html);
}

export async function sendInteracInstructionsEmail(order: any) {
  const interacEmail = await getSetting('interac_email');
  const instructions = await getSetting('interac_instructions');
  const items = await getOrderItems(order.id);
  const summary = orderSummaryHtml(order, items);
  const html = emailTemplate(`
    <h2 style="color:#D32F2F;">Instructions de paiement Interac</h2>
    <p>Bonjour ${order.customerName},</p>
    <p>Votre commande <strong>${order.orderNumber}</strong> a été créée. Pour la finaliser, veuillez envoyer un virement Interac.</p>
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0;border:2px solid #D32F2F;">
      <p style="margin:5px 0;font-size:22px;color:#D32F2F;font-weight:bold;text-align:center;">Montant à payer: ${order.total.toFixed(2)} $ CAD</p>
      <p style="margin:10px 0;text-align:center;font-size:16px;"><strong>Envoyer à:</strong> ${interacEmail}</p>
      <p style="margin:5px 0;text-align:center;"><strong>Message/référence:</strong> ${order.orderNumber}</p>
    </div>
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0;">
      <p style="margin:0 0 10px;font-weight:bold;">Instructions:</p>
      <p style="margin:0;color:#ccc;">${instructions}</p>
    </div>
    ${summary}
    <p style="font-weight:bold;color:#D32F2F;">Votre commande sera traitée dès réception du paiement.</p>
  `, `Instructions de paiement — ${order.orderNumber}`);
  await sendEmail(order.customerEmail, `Instructions de paiement — ${order.orderNumber}`, html);
}

export async function sendPaymentConfirmedEmail(order: any) {
  const items = await getOrderItems(order.id);
  const summary = orderSummaryHtml(order, items);
  const html = emailTemplate(`
    <h2 style="color:#4CAF50;">Paiement confirmé</h2>
    <p>Bonjour ${order.customerName},</p>
    <p>Votre paiement a été reçu pour la commande <strong>${order.orderNumber}</strong>. Merci!</p>
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0;">
      <p style="margin:5px 0;"><strong>Montant payé:</strong> ${order.total.toFixed(2)} $ CAD</p>
      <p style="margin:5px 0;"><strong>Statut:</strong> <span style="color:#4CAF50;font-weight:bold;">Payé</span></p>
    </div>
    ${summary}
    <p>Vos articles sont maintenant en préparation. Vous recevrez un courriel avec le suivi de livraison sous peu.</p>
  `, `Paiement confirmé — ${order.orderNumber}`);
  await sendEmail(order.customerEmail, `Paiement confirmé — ${order.orderNumber}`, html);
}

export async function sendPaymentFailedEmail(order: any) {
  const items = await getOrderItems(order.id);
  const summary = orderSummaryHtml(order, items);
  const html = emailTemplate(`
    <h2 style="color:#f44336;">Paiement échoué</h2>
    <p>Bonjour ${order.customerName},</p>
    <p>Le paiement pour la commande <strong>${order.orderNumber}</strong> a échoué.</p>
    ${summary}
    <p>Vous pouvez réessayer le paiement à tout moment depuis la page de commande.</p>
  `, `Paiement échoué — ${order.orderNumber}`);
  await sendEmail(order.customerEmail, `Paiement échoué — ${order.orderNumber}`, html);
}

export async function sendOrderShippedEmail(order: any) {
  const items = await getOrderItems(order.id);
  const summary = orderSummaryHtml(order, items);
  const html = emailTemplate(`
    <h2 style="color:#4CAF50;">Commande expédiée</h2>
    <p>Bonjour ${order.customerName},</p>
    <p>Votre commande <strong>${order.orderNumber}</strong> a été expédiée !</p>
    ${order.trackingNumber ? `
    <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0;">
      <p style="margin:5px 0;"><strong>Transporteur:</strong> ${order.carrier || 'N/A'}</p>
      <p style="margin:5px 0;"><strong>Numéro de suivi:</strong> ${order.trackingNumber}</p>
      ${order.trackingUrl ? `<p style="margin:10px 0;"><a href="${order.trackingUrl}" style="color:#D32F2F;">Suivre mon colis</a></p>` : ''}
    </div>` : ''}
    ${summary}
  `, `Commande expédiée — ${order.orderNumber}`);
  await sendEmail(order.customerEmail, `Commande expédiée — ${order.orderNumber}`, html);
}

export async function sendOrderDeliveredEmail(order: any) {
  const items = await getOrderItems(order.id);
  const summary = orderSummaryHtml(order, items);
  const html = emailTemplate(`
    <h2 style="color:#4CAF50;">Commande livrée</h2>
    <p>Bonjour ${order.customerName},</p>
    <p>Votre commande <strong>${order.orderNumber}</strong> a été livrée. Merci de soutenir Resist N Co !</p>
    ${summary}
    <p>Résistez. Organisez-vous. Habillez vos convictions.</p>
  `, `Commande livrée — ${order.orderNumber}`);
  await sendEmail(order.customerEmail, `Commande livrée — ${order.orderNumber}`, html);
}

export async function sendRefundEmail(order: any) {
  const items = await getOrderItems(order.id);
  const summary = orderSummaryHtml(order, items);
  const html = emailTemplate(`
    <h2 style="color:#f44336;">Remboursement</h2>
    <p>Bonjour ${order.customerName},</p>
    <p>Un remboursement de <strong>${order.total.toFixed(2)} $ CAD</strong> a été traité pour la commande <strong>${order.orderNumber}</strong>.</p>
    ${summary}
    <p>Le montant sera crédité sur votre moyen de paiement original sous 5-10 jours ouvrables.</p>
  `, `Remboursement — ${order.orderNumber}`);
  await sendEmail(order.customerEmail, `Remboursement — ${order.orderNumber}`, html);
}
