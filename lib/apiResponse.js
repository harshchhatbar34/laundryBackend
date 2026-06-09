const { NextResponse } = require('next/server');

const sendSuccess = (status = 200, message = 'Success', data = null) => {
  return NextResponse.json(
    { success: true, message, ...(data && { data }) },
    { status }
  );
};

const sendError = (status = 500, message = 'Internal Server Error', errors = []) => {
  return NextResponse.json(
    { success: false, message, errors },
    { status }
  );
};

const sendPaginated = (message = 'Fetched successfully', data = [], pagination = {}) => {
  return NextResponse.json(
    { success: true, message, data, pagination },
    { status: 200 }
  );
};

module.exports = { sendSuccess, sendError, sendPaginated };
