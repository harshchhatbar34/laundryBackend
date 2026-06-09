const { NextResponse } = require('next/server');
const { PassThrough } = require('stream');
const { connectDB } = require('../../../../../lib/db');
const { sendError } = require('../../../../../lib/apiResponse');
const { withAuth } = require('../../../../../lib/auth');
const { getOrderById } = require('../../../../../src/modules/order/order.service');
const { generateInvoicePDF } = require('../../../../../src/utils/invoice.utils');

const GET = withAuth(async (req, { params, user }) => {
  try {
    await connectDB();
    const order = await getOrderById(params.id, user.role === 'admin' ? null : user._id);

    const stream = new PassThrough();
    generateInvoicePDF(order, stream);

    // Convert node stream to web readable stream for Next.js 13+
    // Note: If you face issues in older Next.js versions, stream.Readable.toWeb(stream) could be used
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${order.orderNumber}.pdf`,
      },
    });
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

module.exports = { GET };
