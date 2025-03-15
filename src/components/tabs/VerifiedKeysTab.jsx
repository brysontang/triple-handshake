import React from 'react';

const VerifiedKeysTab = ({
  verifiedKeys,
  showDeleteConfirmation,
  setShowDeleteConfirmation,
  deleteAllVerifiedKeys,
  showNotification,
  setScannerActive,
  setActiveTab,
}) => {
  return (
    <div className="animate-fadeIn">
      <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-yellow-300">
          Verified Keys
        </h2>

        {verifiedKeys.length > 0 ? (
          <div className="mb-6">
            <ul className="space-y-3">
              {verifiedKeys.map((key, index) => (
                <li
                  key={index}
                  className="bg-gray-900 bg-opacity-70 p-4 rounded-lg border border-gray-700 hover:border-yellow-500 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <div className="bg-yellow-500 rounded-full p-2 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-900"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1 .257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 font-mono text-sm overflow-hidden">
                      <div className="truncate text-gray-300">
                        {key.publicKey}
                      </div>
                      <div className="truncate text-gray-400 text-xs">
                        Signed: {key.signedKey}
                      </div>
                      <div className="text-xs text-gray-500">
                        Verified Key #{index + 1}
                      </div>
                    </div>
                    <button
                      className="ml-2 text-gray-400 hover:text-gray-200"
                      onClick={() => {
                        navigator.clipboard.writeText(key.publicKey);
                        showNotification('Key copied to clipboard');
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {!showDeleteConfirmation ? (
              <button
                className="mt-6 w-full py-3 px-6 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
                <span>Delete All Verified Keys</span>
              </button>
            ) : (
              <div className="mt-6 bg-gray-900 bg-opacity-90 p-4 rounded-lg border border-red-500">
                <p className="text-white mb-3">
                  Are you sure you want to delete all verified keys? This action
                  cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                    onClick={deleteAllVerifiedKeys}
                  >
                    Yes, Delete All
                  </button>
                  <button
                    className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                    onClick={() => setShowDeleteConfirmation(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block p-3 rounded-full bg-gray-800 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-yellow-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1 .257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Verified Keys Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Scan a QR code to verify and store keys
            </p>
            <button
              className="py-3 px-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-medium rounded-lg shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
              onClick={() => {
                setScannerActive(true);
                setActiveTab('scanner');
              }}
            >
              Start Scanning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifiedKeysTab;
