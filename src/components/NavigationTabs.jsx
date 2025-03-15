import React from 'react';

const NavigationTabs = ({ activeTab, setActiveTab, currentQR }) => {
  return (
    <div className="flex mb-6 bg-gray-800 bg-opacity-50 rounded-lg p-1">
      <button
        onClick={() => setActiveTab('myKey')}
        className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 ${
          activeTab === 'myKey'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        My Key
      </button>
      <button
        onClick={() => setActiveTab('scanner')}
        className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 ${
          activeTab === 'scanner'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        Scan
      </button>
      {currentQR && (
        <button
          onClick={() => setActiveTab('response')}
          className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 ${
            activeTab === 'response'
              ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Response
        </button>
      )}
      <button
        onClick={() => setActiveTab('verified')}
        className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 ${
          activeTab === 'verified'
            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
            : 'text-gray-300 hover:text-white'
        }`}
      >
        Verified Keys
      </button>
    </div>
  );
};

export default NavigationTabs;
