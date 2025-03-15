import React, { useState, useEffect, useRef } from 'react';
import nacl from 'tweetnacl';
import dynamic from 'next/dynamic';
import naclUtil from 'tweetnacl-util';

import { QRCodeCanvas } from 'qrcode.react';

const QRKeyExchange = () => {
  const [myKeyPair, setMyKeyPair] = useState(null);
  const [currentQR, setCurrentQR] = useState(null);
  const [verifiedKeys, setVerifiedKeys] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const myQrRef = useRef(null);
  const responseQrRef = useRef(null);

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
          const verifiedKey = {
            publicKey: data.publicKey,
            signedKey: data.signedKey,
          };
          setVerifiedKeys((verified) => [...verified, verifiedKey]);
          localStorage.setItem(`verified-${data.publicKey}`, data.signedKey);

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

  useEffect(() => {
    if (!myKeyPair) return; // Don't initialize scanner until we have the keypair

    let scanner;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 });
      scanner.render(handleScan, handleError);
    });

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [myKeyPair]); // Add myKeyPair as a dependency

  const downloadQRCode = (ref, publicKey) => {
    if (!ref.current) return;

    const canvas = ref.current.querySelector('canvas');
    if (!canvas) return;

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-${publicKey.substring(0, 16)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div ref={myQrRef}>
            <QRCodeCanvas value={myKeyPair.publicKey} size={256} />
          </div>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => downloadQRCode(myQrRef, myKeyPair.publicKey)}
          >
            Download Your QR Code
          </button>
        </div>
      )}

      <div id="reader" className="my-4" />

      {currentQR && (
        <div className="my-4">
          <h2>Scan this QR code back</h2>
          <div ref={responseQrRef}>
            <QRCodeCanvas value={currentQR} size={256} />
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
