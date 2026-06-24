import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { type, to, data } = req.body;
  // type can be 'welcome' or 'order_confirmation'

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error("Gmail credentials missing");
    return res.status(500).json({ message: "Email credentials not configured" });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  const STORE_NAME = "NENATH AFFORDABLES";
  const STORE_URL = process.env.REACT_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  let subject = "";
  let html = "";

  const email_header = () => `
    <div style="background:#0A0A0A;padding:24px 32px;text-align:center;">
        <h1 style="color:#FFFFFF;font-family:'Georgia',serif;font-size:24px;margin:0;letter-spacing:2px;">${STORE_NAME}</h1>
        <p style="color:#C6A85B;font-size:11px;letter-spacing:3px;margin:4px 0 0;text-transform:uppercase;">Luxury Within Reach, Style Without Limits</p>
    </div>`;

  const email_footer = () => `
    <div style="background:#F5F1EB;padding:20px 32px;text-align:center;font-family:Arial,sans-serif;">
        <p style="font-size:12px;color:#555;margin:0;">Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria</p>
        <p style="font-size:12px;color:#555;margin:4px 0 0;">Phone: 09133487799 | WhatsApp: <a href="https://wa.me/2349133487799" style="color:#25D366;">Chat with us</a></p>
        <p style="font-size:11px;color:#999;margin:8px 0 0;">&copy; 2026 ${STORE_NAME}. All rights reserved.</p>
    </div>`;

  if (type === 'welcome') {
    subject = `Welcome to ${STORE_NAME}!`;
    html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;">
        ${email_header()}
        <div style="padding:32px;">
            <h2 style="font-family:'Georgia',serif;font-size:22px;color:#0A0A0A;">Welcome, ${data.name}!</h2>
            <p style="color:#555;font-size:14px;line-height:1.6;">Thank you for joining NENATH AFFORDABLES. We're thrilled to have you as part of our fashion community.</p>
            <p style="color:#555;font-size:14px;line-height:1.6;">Explore our premium collections — from Ready-to-Wear Traditional outfits to elegant Suits, Bags, Shoes, and Accessories.</p>
            <div style="text-align:center;margin:24px 0;">
                <a href="${STORE_URL}/shop" style="background:#0A0A0A;color:#fff;padding:14px 32px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;">SHOP NOW</a>
            </div>
            <p style="color:#C6A85B;font-size:13px;font-style:italic;text-align:center;">"Quality you can trust. Style you deserve."</p>
        </div>
        ${email_footer()}
    </div>`;
  } else if (type === 'order_confirmation') {
    const order = data;
    subject = `Order Confirmed - #${(order.order_id || '').substring(0,8).toUpperCase()}`;
    let items_html = "";
    (order.items || []).forEach(item => {
      const size_str = item.size ? `(${item.size})` : "";
      items_html += `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">${item.name} ${size_str} x${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">&#8358;${Number(item.item_total).toLocaleString('en-NG')}</td></tr>`;
    });

    html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;">
        ${email_header()}
        <div style="padding:32px;">
            <h2 style="font-family:'Georgia',serif;font-size:22px;color:#0A0A0A;">Order Confirmed!</h2>
            <p style="color:#555;font-size:14px;">Thank you for your order. Here are your details:</p>
            <div style="background:#F5F1EB;padding:16px;margin:16px 0;">
                <p style="margin:0;font-size:13px;"><strong>Order ID:</strong> #${(order.order_id || '').substring(0,8).toUpperCase()}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr><th style="padding:8px;border-bottom:2px solid #0A0A0A;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Item</th><th style="padding:8px;border-bottom:2px solid #0A0A0A;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Amount</th></tr></thead>
                <tbody>${items_html}</tbody>
                <tfoot><tr><td style="padding:12px 8px;font-weight:bold;font-size:15px;">Total</td><td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:15px;">&#8358;${Number(order.total).toLocaleString('en-NG')}</td></tr></tfoot>
            </table>
            <div style="background:#FFF8E7;border-left:4px solid #C6A85B;padding:16px;margin:20px 0;">
                <p style="margin:0;font-size:13px;font-weight:bold;color:#0A0A0A;">Payment Instructions</p>
                <p style="margin:8px 0 0;font-size:13px;color:#555;">Please transfer &#8358;${Number(order.total).toLocaleString('en-NG')} to complete your order. Bank details are available on your order page.</p>
                <div style="text-align:center;margin-top:12px;">
                    <a href="${STORE_URL}/order-confirmation/${order.order_id}" style="background:#0A0A0A;color:#fff;padding:10px 24px;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;">VIEW ORDER & PAY</a>
                </div>
            </div>
            <div style="margin-top:16px;">
                <p style="font-size:13px;color:#555;"><strong>Shipping to:</strong> ${order.customer_name || ""}</p>
                <p style="font-size:13px;color:#555;">${order.shipping_address || ""}${order.city ? `, ${order.city}` : ""}${order.state ? `, ${order.state}` : ""}</p>
            </div>
        </div>
        ${email_footer()}
    </div>`;
  } else {
    return res.status(400).json({ message: "Invalid email type" });
  }

  try {
    await transporter.sendMail({
      from: `"${STORE_NAME}" <${user}>`,
      to,
      subject,
      html
    });
    return res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email sending failed", error);
    return res.status(500).json({ success: false, message: "Email sending failed", error: String(error) });
  }
}
