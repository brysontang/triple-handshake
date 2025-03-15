import React, { useState, useEffect, useRef } from 'react';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

import { QRCodeCanvas } from 'qrcode.react';

const QRKeyExchange = () => {
  const [myKeyPair, setMyKeyPair] = useState(null);
  const [currentQR, setCurrentQR] = useState(null);
  const [verifiedKeys, setVerifiedKeys] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
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

  const handleScan = (message) => {
    const decodedText = decodeURIComponent(message);
    try {
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
      }
    } catch (error) {
      console.error('Error processing QR data:', error);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const [scannerActive, setScannerActive] = useState(false);

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
            alert('Please allow popups for this website');
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
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

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
            }
          })
          .catch((error) => {
            console.error('Error loading jsQR:', error);
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
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">QR Key Exchange Prototype</h1>

      {myKeyPair && (
        <div className="my-4">
          <h2>Your Public Key</h2>
          <p className="text-sm text-gray-500">{myKeyPair.publicKey}</p>
          <div ref={myQrRef}>
            <QRCodeCanvas
              value={myKeyPair.publicKey}
              size={256}
              style={{
                padding: '10px',
                background: 'white',
                border: '2px solid white',
              }}
            />
          </div>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => downloadQRCode(myQrRef, myKeyPair.publicKey)}
          >
            Download Your QR Code
          </button>
        </div>
      )}

      <div className="my-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          onClick={toggleScanner}
        >
          {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
        </button>

        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => fileInputRef.current.click()}
        >
          Upload QR Image
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
      <div id="qr-reader" className="my-4" />

      {currentQR && (
        <div className="my-4">
          <h2>Scan this QR code back</h2>
          <div ref={responseQrRef}>
            <QRCodeCanvas
              value={currentQR}
              size={256}
              style={{
                padding: '10px',
                background: 'white',
                border: '2px solid white',
              }}
            />
          </div>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              downloadQRCode(responseQrRef, currentQR);
            }}
          >
            Download Response QR Code
          </button>
        </div>
      )}

      <div>
        <h2>Verified Keys:</h2>
        <ul>
          {verifiedKeys.map((key, index) => (
            <li key={index}>{key.publicKey}</li>
          ))}
        </ul>

        {verifiedKeys.length > 0 && (
          <div className="mt-4">
            {!showDeleteConfirmation ? (
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                Delete All Verified Keys
              </button>
            ) : (
              <div className="bg-gray-100 p-4 rounded">
                <p className="mb-2 text-black">
                  Are you sure you want to delete all verified keys?
                </p>
                <div className="flex space-x-2">
                  <button
                    className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-600"
                    onClick={deleteAllVerifiedKeys}
                  >
                    Yes, Delete All
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-500 text-black rounded hover:bg-gray-600"
                    onClick={() => setShowDeleteConfirmation(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRKeyExchange;
