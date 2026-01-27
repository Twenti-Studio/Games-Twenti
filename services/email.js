import nodemailer from 'nodemailer';

// Create transporter - will be configured from settings or env
let transporter = null;

// Initialize transporter with settings
export const initEmailTransporter = (settings = {}) => {
  // Use settings from database or fallback to env
  const config = {
    host: settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(settings.smtp_port || process.env.SMTP_PORT || '587'),
    secure: (settings.smtp_port || process.env.SMTP_PORT) === '465',
    auth: {
      user: settings.smtp_user || process.env.SMTP_USER,
      pass: settings.smtp_pass || process.env.SMTP_PASS
    }
  };

  if (config.auth.user && config.auth.pass) {
    transporter = nodemailer.createTransport(config);
    console.log('✓ Email transporter initialized');
    return true;
  }
  
  console.log('⚠ Email not configured - missing SMTP credentials');
  return false;
};

// Send email notification to admin about new order
export const sendOrderNotificationToAdmin = async (order, settings = {}) => {
  const adminEmail = settings.admin_email || process.env.ADMIN_EMAIL || 'twentistudio@gmail.com';
  const siteName = settings.site_name || process.env.SITE_NAME || 'Twenti Studio';
  
  if (!transporter) {
    console.log('Email transporter not initialized, attempting to initialize...');
    initEmailTransporter(settings);
  }

  if (!transporter) {
    console.error('Cannot send email: transporter not configured');
    return { success: false, error: 'Email not configured' };
  }

  try {
    // Format user data for display
    const userData = typeof order.userData === 'string' 
      ? JSON.parse(order.userData) 
      : order.userData;
    
    const userDataHtml = Object.entries(userData || {})
      .map(([key, value]) => `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td><td style="padding: 8px; border: 1px solid #ddd;">${value}</td></tr>`)
      .join('');

    // Format prices
    const formatPrice = (price) => `Rp ${Number(price).toLocaleString('id-ID')}`;
    
    // Build discount info if applicable
    let discountInfo = '';
    if (order.promoCode) {
      discountInfo = `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Kode Promo</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${order.promoCode}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Harga Asli</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formatPrice(order.originalPrice)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Diskon</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: #22c55e;">-${formatPrice(order.discountAmount)}</td>
        </tr>
      `;
    }

    const paymentProofUrl = order.paymentProof 
      ? (order.paymentProof.startsWith('http') ? order.paymentProof : `${process.env.API_URL || 'http://localhost:3001'}${order.paymentProof}`)
      : null;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .order-info { background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .total-row { background: #6366f1; color: white; }
          .total-row td { padding: 12px 8px !important; font-size: 16px; }
          .payment-proof { margin-top: 15px; }
          .payment-proof img { max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🛒 Pesanan Baru!</h1>
            <p style="margin: 10px 0 0;">Order #${order.id}</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h3 style="margin-top: 0; color: #6366f1;">Detail Pesanan</h3>
              <table>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Order ID</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">#${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Produk</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${order.productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Kategori</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${order.categoryName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Paket</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${order.packageName}</td>
                </tr>
                ${discountInfo}
                <tr class="total-row">
                  <td style="padding: 12px 8px; font-weight: bold;">Total Bayar</td>
                  <td style="padding: 12px 8px; font-weight: bold;">${formatPrice(order.price)}</td>
                </tr>
              </table>
            </div>

            <div class="order-info">
              <h3 style="margin-top: 0; color: #6366f1;">Data Pelanggan</h3>
              <table>
                ${userDataHtml || '<tr><td style="padding: 8px; color: #6b7280;">Tidak ada data tambahan</td></tr>'}
              </table>
            </div>

            ${paymentProofUrl ? `
            <div class="order-info payment-proof">
              <h3 style="margin-top: 0; color: #6366f1;">Bukti Pembayaran</h3>
              <a href="${paymentProofUrl}" target="_blank">
                <img src="${paymentProofUrl}" alt="Bukti Pembayaran" />
              </a>
              <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                Klik gambar untuk melihat ukuran penuh
              </p>
            </div>
            ` : ''}

            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              Waktu Order: ${new Date(order.createdAt).toLocaleString('id-ID', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}
            </p>
          </div>

          <div class="footer">
            <p>Email ini dikirim secara otomatis dari ${siteName}</p>
            <p>Silakan proses pesanan ini di panel admin.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${siteName}" <${transporter.options.auth.user}>`,
      to: adminEmail,
      subject: `🛒 Pesanan Baru #${order.id} - ${order.productName}`,
      html: htmlContent
    });

    console.log('✓ Order notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send delivery email to customer (for digital products)
export const sendDeliveryEmailToCustomer = async (order, downloadUrl, settings = {}) => {
  const siteName = settings.site_name || process.env.SITE_NAME || 'Twenti Studio';
  
  if (!transporter) {
    initEmailTransporter(settings);
  }

  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  const userData = typeof order.userData === 'string' 
    ? JSON.parse(order.userData) 
    : order.userData;
  
  const customerEmail = userData?.email;
  if (!customerEmail) {
    return { success: false, error: 'Customer email not found' };
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .download-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .btn { display: inline-block; padding: 15px 30px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
          .btn:hover { background: #16a34a; }
          .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Pesanan Dikonfirmasi!</h1>
            <p style="margin: 10px 0 0;">Terima kasih atas pembelian Anda</p>
          </div>
          
          <div class="content">
            <p>Halo${userData?.name ? ` ${userData.name}` : ''},</p>
            <p>Pembayaran Anda untuk <strong>${order.productName} - ${order.packageName}</strong> telah dikonfirmasi!</p>
            
            <div class="download-box">
              <h3 style="margin-top: 0; color: #22c55e;">📥 Download Produk Anda</h3>
              <p style="color: #6b7280; margin-bottom: 20px;">Klik tombol di bawah untuk mengunduh produk digital Anda:</p>
              <a href="${downloadUrl}" class="btn" target="_blank">Download Sekarang</a>
              <p style="margin-top: 15px; font-size: 12px; color: #6b7280;">
                Jika tombol tidak berfungsi, salin link berikut:<br>
                <a href="${downloadUrl}" style="color: #6366f1; word-break: break-all;">${downloadUrl}</a>
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Order ID: #${order.id}<br>
              Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}
            </p>
          </div>

          <div class="footer">
            <p>Terima kasih telah berbelanja di ${siteName}</p>
            <p>Jika ada pertanyaan, silakan hubungi kami.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${siteName}" <${transporter.options.auth.user}>`,
      to: customerEmail,
      subject: `✅ Download Link - ${order.productName}`,
      html: htmlContent
    });

    console.log('✓ Delivery email sent to customer:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send delivery email:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  initEmailTransporter,
  sendOrderNotificationToAdmin,
  sendDeliveryEmailToCustomer
};
