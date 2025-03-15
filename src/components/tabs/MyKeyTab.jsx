import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const MyKeyTab = ({
  myKeyPair,
  myQrRef,
  downloadQRCode,
  isMobile,
  truncateKey,
}) => {
  if (!myKeyPair) return null;

  // Create a URL with the public key as a parameter
  const qrValue = `https://triple-handshake.vercel.app?public_key=${myKeyPair.publicKey}`;

  return (
    <div className="animate-fadeIn">
      <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 text-cyan-300">
          Your Public Key
        </h2>
        <div className="bg-gray-900 p-3 rounded-lg mb-4 overflow-x-auto">
          <p className="text-sm font-mono text-gray-300 break-all">
            {isMobile ? truncateKey(myKeyPair.publicKey) : myKeyPair.publicKey}
          </p>
        </div>
        <div className="flex justify-center mb-4">
          <div
            ref={myQrRef}
            className="bg-white p-4 rounded-lg shadow-lg transform transition-all hover:scale-105"
          >
            <QRCodeCanvas
              value={qrValue}
              size={256}
              level="H"
              imageSettings={{
                src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjM2NkYxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1sb2NrIj48cmVjdCB4PSIzIiB5PSIxMSIgd2lkdGg9IjE4IiBoZWlnaHQ9IjExIiByeD0iMiIgcnk9IjIiPjwvcmVjdD48cGF0aCBkPSJNNyAxMVY3YTUgNSAwIDAgMSAxMCAwdjQiPjwvcGF0aD48L3N2Zz4=',
                excavate: true,
                width: 40,
                height: 40,
              }}
            />
          </div>
        </div>
        <button
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
          onClick={() => downloadQRCode(myQrRef, myKeyPair.publicKey)}
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
          <span>Download Your QR Code</span>
        </button>
      </div>
    </div>
  );
};

export default MyKeyTab;
