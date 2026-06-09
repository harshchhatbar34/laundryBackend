const { NextResponse } = require('next/server');

const sendSuccess = (status = 200, message = 'Success', data = null) => {
  console.log(`[RES ${status} SUCCESS]`, message);
  return NextResponse.json(
    { success: true, message, ...(data && { data }) },
    { status }
  );
};

const sendError = (status = 500, message = 'Internal Server Error', errors = []) => {
  // Automatically log to console so Vercel's Runtime Logs captures it
  console.error(`[API Error ${status}]:`, message, errors.length ? errors : '');
  
  return NextResponse.json(
    { success: false, message, errors },
    { status }
  );
};

const sendPaginated = (message = 'Fetched successfully', data = [], pagination = {}) => {
  console.log(`[RES 200 SUCCESS]`, message);
  return NextResponse.json(
    { success: true, message, data, pagination },
    { status: 200 }
  );
};

module.exports = { sendSuccess, sendError, sendPaginated };
