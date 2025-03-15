import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const ResponseTab = ({ currentQR, responseQrRef, downloadQRCode }) => {
  return (
    <div className="animate-fadeIn">
      <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-green-300">
          Your Response QR Code
        </h2>
        <p className="text-gray-300 mb-4">
          Have the other person scan this QR code to complete the key exchange
        </p>

        <div className="flex justify-center mb-4">
          <div
            ref={responseQrRef}
            className="bg-white p-4 rounded-lg shadow-lg transform transition-all hover:scale-105"
          >
            <QRCodeCanvas
              value={currentQR}
              size={256}
              level="H"
              imageSettings={{
                src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBCOTgxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1jaGVjay1jaXJjbGUiPjxwYXRoIGQ9Ik0yMiAxMS4wOFYxMmE5IDkgMCAxIDEtNS45My04LjQ5Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iMjIgNCAxMiAxNCAxMCAxMiI+PC9wb2x5bGluZT48L3N2Zz4=',
                excavate: true,
                width: 40,
                height: 40,
              }}
            />
          </div>
        </div>

        <button
          className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2"
          onClick={() => downloadQRCode(responseQrRef, 'response')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>Download Response QR Code</span>
        </button>
      </div>
    </div>
  );
};

export default ResponseTab;
