import React, { useState, useEffect, useRef } from 'react';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { QRCodeCanvas } from 'qrcode.react';

const QRKeyExchange = () => {
  const [myKeyPair, setMyKeyPair] = useState(null);
  const [currentQR, setCurrentQR] = useState(null);
  const [verifiedKeys, setVerifiedKeys] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('myKey');
  const [scannerActive, setScannerActive] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(false);
  const [notification, setNotification] = useState(null);
  const myQrRef = useRef(null);
  const responseQrRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('myKeyPair');
    if (storedKey) {
      setMyKeyPair(JSON.parse(storedKey));
    } else {
      const newKeyPair = nacl.sign.keyPair();
      const keyPair = {
        publicKey: naclUtil.encodeBase64(newKeyPair.publicKey),
        secretKey: naclUtil.encodeBase64(newKeyPair.secretKey),
      };
      localStorage.setItem('myKeyPair', JSON.stringify(keyPair));
      setMyKeyPair(keyPair);
    }

    // Load verified keys from localStorage
    const storedVerifiedKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('verified-')) {
        const publicKey = key.replace('verified-', '');
        const signedKey = localStorage.getItem(key);
        storedVerifiedKeys.push({
          publicKey,
          signedKey,
        });
      }
    }
    if (storedVerifiedKeys.length > 0) {
      setVerifiedKeys(storedVerifiedKeys);
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleScan = (message) => {
    const decodedText = decodeURIComponent(message);
    try {
      setScanAnimation(true);
      setTimeout(() => setScanAnimation(false), 1000);

      // Try to parse as JSON first
      try {
        const data = JSON.parse(decodedText);

        if (data?.signedKey && data?.publicKey) {
          // Check if this key already exists
          const keyExists = verifiedKeys.some(
            (key) => key.publicKey === data.publicKey
          );
          if (!keyExists) {
            const verifiedKey = {
              publicKey: data.publicKey,
              signedKey: data.signedKey,
            };
            setVerifiedKeys((verified) => [...verified, verifiedKey]);
            localStorage.setItem(`verified-${data.publicKey}`, data.signedKey);
            showNotification('New key verified successfully!');
          } else {
            showNotification('Key already verified', 'info');
          }

          const theirPublicKey = naclUtil.decodeBase64(data.publicKey);
          const signature = nacl.sign.detached(
            theirPublicKey,
            naclUtil.decodeBase64(myKeyPair.secretKey)
          );
          const signedPayload = {
            publicKey: myKeyPair.publicKey,
            signedKey: naclUtil.encodeBase64(signature),
          };

          const payload = JSON.stringify(signedPayload);
          setCurrentQR(encodeURIComponent(payload));
          setActiveTab('response');
        }
      } catch {
        // If not JSON, treat as plain public key
        const theirPublicKey = naclUtil.decodeBase64(decodedText);
        const signature = nacl.sign.detached(
          theirPublicKey,
          naclUtil.decodeBase64(myKeyPair.secretKey)
        );
        const signedPayload = {
          publicKey: myKeyPair.publicKey,
          signedKey: naclUtil.encodeBase64(signature),
        };
        const payload = JSON.stringify(signedPayload);
        setCurrentQR(encodeURIComponent(payload));
        setActiveTab('response');
        showNotification('QR code scanned successfully!');
      }
      setScannerActive(false);
    } catch (error) {
      console.error('Error processing QR data:', error);
      showNotification('Error processing QR code', 'error');
    }
  };

  const handleError = (err) => {
    console.error(err);
    showNotification('Scanner error', 'error');
  };

  useEffect(() => {
    if (!myKeyPair || !scannerActive) return;

    let html5QrCode;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCode
        .start(
          { facingMode: 'environment' }, // rear camera preferred
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          handleError
        )
        .catch(handleError);
    });

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(handleError);
      }
    };
  }, [myKeyPair, scannerActive]);

  const toggleScanner = () => {
    setScannerActive((prev) => !prev);
    if (!scannerActive) {
      setActiveTab('scanner');
    }
  };

  const downloadQRCode = (ref, publicKey) => {
    const canvas = ref.current.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas element not found.');
      return;
    }

    const dataURL = canvas.toDataURL('image/png');
    const fileName = `qr-${publicKey.substring(0, 16)}.png`;

    // Check for iOS/Safari
    if (
      navigator.userAgent.match(/iPad|iPhone|iPod|Safari/) &&
      !navigator.userAgent.includes('Chrome')
    ) {
      fetch(dataURL)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const newTab = window.open(url, '_blank');
          if (!newTab) {
            showNotification('Please allow popups for this website', 'warning');
          }
        })
        .catch((err) => console.error('Error opening image in new tab:', err));
    } else {
      // For other browsers
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showNotification('QR code downloaded successfully!');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    showNotification('Processing image...', 'info');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Use a QR code library to decode the image
        import('jsqr')
          .then((jsQR) => {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const code = jsQR.default(
              imageData.data,
              imageData.width,
              imageData.height
            );

            if (code) {
              handleScan(code.data);
            } else {
              console.error('No QR code found in the image');
              showNotification('No QR code found in the image', 'error');
            }
          })
          .catch((error) => {
            console.error('Error loading jsQR:', error);
            showNotification('Error processing image', 'error');
          });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const deleteAllVerifiedKeys = () => {
    // Remove all verified keys from localStorage
    verifiedKeys.forEach((key) => {
      localStorage.removeItem(`verified-${key.publicKey}`);
    });

    // Clear the state
    setVerifiedKeys([]);
    setShowDeleteConfirmation(false);
    showNotification('All verified keys deleted');
  };

  const truncateKey = (key) => {
    if (!key) return '';
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white p-6">
      <div className="max-w-4xl mx-auto bg-black bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-6">
            Secure QR Key Exchange
          </h1>

          {/* Notification */}
          {notification && (
            <div
              className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all transform translate-y-0 z-50 ${
                notification.type === 'error'
                  ? 'bg-red-600'
                  : notification.type === 'warning'
                  ? 'bg-yellow-600'
                  : notification.type === 'info'
                  ? 'bg-blue-600'
                  : 'bg-green-600'
              }`}
            >
              <p className="text-white">{notification.message}</p>
            </div>
          )}

          {/* Navigation Tabs */}
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

          {/* Content based on active tab */}
          <div className="transition-all duration-300">
            {/* My Key Tab */}
            {activeTab === 'myKey' && myKeyPair && (
              <div className="animate-fadeIn">
                <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-3 text-cyan-300">
                    Your Public Key
                  </h2>
                  <div className="bg-gray-900 p-3 rounded-lg mb-4 overflow-x-auto">
                    <p className="text-sm font-mono text-gray-300 break-all">
                      {myKeyPair.publicKey}
                    </p>
                  </div>
                  <div className="flex justify-center mb-4">
                    <div
                      ref={myQrRef}
                      className="bg-white p-4 rounded-lg shadow-lg transform transition-all hover:scale-105"
                    >
                      <QRCodeCanvas
                        value={myKeyPair.publicKey}
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
            )}

            {/* Scanner Tab */}
            {activeTab === 'scanner' && (
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
            )}

            {/* Response Tab */}
            {activeTab === 'response' && currentQR && (
              <div className="animate-fadeIn">
                <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 text-green-300">
                    Your Response QR Code
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Have the other person scan this QR code to complete the key
                    exchange
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
            )}

            {/* Verified Keys Tab */}
            {activeTab === 'verified' && (
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
                            Are you sure you want to delete all verified keys?
                            This action cannot be undone.
                          </p>
                          <div className="flex space-x-3">
                            <button
                              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                              onClick={() => {
                                // Clear all verified keys from localStorage
                                verifiedKeys.forEach((key) => {
                                  localStorage.removeItem(
                                    `verified-${key.publicKey}`
                                  );
                                });
                                setVerifiedKeys([]);
                                setShowDeleteConfirmation(false);
                                showNotification('All verified keys deleted');
                              }}
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
                          setActiveTab('scan');
                        }}
                      >
                        Start Scanning
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg animate-fadeIn ${
            notification.type === 'error'
              ? 'bg-red-600 text-white'
              : notification.type === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default QRKeyExchange;
