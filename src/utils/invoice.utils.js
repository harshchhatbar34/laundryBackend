const PDFDocument = require('pdfkit');

const generateInvoicePDF = (order, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Header
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('LAUNDRY SERVICE', 110, 57)
    .fontSize(10)
    .text('123 Clean St, Bubble City', 200, 65, { align: 'right' })
    .text('Contact: +91 9876543210', 200, 80, { align: 'right' })
    .moveDown();

  // Divider
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 105).lineTo(550, 105).stroke();

  // Order Info
  doc
    .fontSize(12)
    .fillColor('#000000')
    .text(`Invoice Number: ${order.orderNumber}`, 50, 125)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 140)
    .text(`Customer Mobile: ${order.user.mobileNumber}`, 50, 155)
    .moveDown();

  // Table Header
  const tableTop = 200;
  doc
    .fontSize(10)
    .text('Material', 50, tableTop)
    .text('Item', 150, tableTop)
    .text('Service', 250, tableTop)
    .text('Qty', 350, tableTop, { width: 50, align: 'right' })
    .text('Price', 400, tableTop, { width: 70, align: 'right' })
    .text('Total', 480, tableTop, { width: 70, align: 'right' });

  doc.strokeColor('#eeeeee').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Table Body
  let position = tableTop + 30;
  order.items.forEach((item) => {
    doc
      .fontSize(10)
      .text(item.material.name, 50, position)
      .text(item.item.name, 150, position)
      .text(item.service.name, 250, position)
      .text(item.quantity.toString(), 350, position, { width: 50, align: 'right' })
      .text(`₹${item.price}`, 400, position, { width: 70, align: 'right' })
      .text(`₹${item.price * item.quantity}`, 480, position, { width: 70, align: 'right' });

    position += 20;
  });

  // Footer
  const footerTop = position + 30;
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, footerTop).lineTo(550, footerTop).stroke();

  doc
    .fontSize(10)
    .text('Subtotal:', 400, footerTop + 15, { width: 70, align: 'right' })
    .text(`₹${order.pricing.subtotal}`, 480, footerTop + 15, { width: 70, align: 'right' })
    .text('Discount:', 400, footerTop + 30, { width: 70, align: 'right' })
    .text(`-₹${order.pricing.discount}`, 480, footerTop + 30, { width: 70, align: 'right' })
    .fontSize(12)
    .fillColor('#2e7d32')
    .text('Total Payable:', 400, footerTop + 50, { width: 70, align: 'right' })
    .text(`₹${order.pricing.total}`, 480, footerTop + 50, { width: 70, align: 'right' });

  doc.end();
};

module.exports = { generateInvoicePDF };
