import React from 'react';

const ScannerTab = ({
  scannerActive,
  toggleScanner,
  scanAnimation,
  fileInputRef,
  handleFileUpload,
}) => {
  return (
    <div className="animate-fadeIn">
      <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">
          Scan a QR Code
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            className={`flex-1 py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              scannerActive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            }`}
            onClick={toggleScanner}
          >
            {scannerActive ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Stop Scanner</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Start Camera Scanner</span>
              </>
            )}
          </button>

          <button
            className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
            onClick={() => fileInputRef.current.click()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            <span>Upload QR Image</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div
          id="qr-reader"
          className={`relative overflow-hidden rounded-lg ${
            scanAnimation ? 'animate-pulse' : ''
          }`}
        >
          {scannerActive && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scanline"></div>
            </div>
          )}
          {!scannerActive && !scanAnimation && (
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="text-gray-400">
                Start the scanner or upload an image to scan a QR code
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerTab;
