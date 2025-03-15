import React, { useState, useEffect, useRef } from 'react';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { QRCodeCanvas } from 'qrcode.react';
import NavigationTabs from './NavigationTabs';
import MyKeyTab from './tabs/MyKeyTab';
import ScannerTab from './tabs/ScannerTab';
import ResponseTab from './tabs/ResponseTab';
import VerifiedKeysTab from './tabs/VerifiedKeysTab';
import Notification from './Notification';

const QRKeyExchange = () => {
  const [myKeyPair, setMyKeyPair] = useState(null);
  const [currentQR, setCurrentQR] = useState(null);
  const [verifiedKeys, setVerifiedKeys] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('myKey');
  const [scannerActive, setScannerActive] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const myQrRef = useRef(null);
  const responseQrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        const createdAt = localStorage.getItem(`${publicKey}-createdAt`);
        storedVerifiedKeys.push({
          publicKey,
          signedKey,
          createdAt,
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

      // Check if the scanned QR is a URL with public_key parameter
      if (
        decodedText.startsWith(
          'https://triple-handshake.vercel.app?public_key='
        )
      ) {
        const publicKeyParam = decodedText.split('public_key=')[1];
        if (publicKeyParam) {
          // Process the public key from the URL
          const theirPublicKey = naclUtil.decodeBase64(publicKeyParam);
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
          showNotification('QR code with public key scanned successfully!');
          setScannerActive(false);
          return;
        }
      }

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
              createdAt: new Date().toISOString(),
            };
            setVerifiedKeys((verified) => [...verified, verifiedKey]);
            localStorage.setItem(
              `verified-${data.publicKey}`,
              JSON.stringify(data.signedKey)
            );

            localStorage.setItem(
              `${data.publicKey}-createdAt`,
              new Date().toISOString()
            );
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

      // Configure scanner based on device type
      const qrboxSize = isMobile
        ? { width: 200, height: 200 }
        : { width: 250, height: 250 };
      const fps = isMobile ? 5 : 10; // Lower FPS on mobile for better performance

      html5QrCode
        .start(
          { facingMode: 'environment' }, // rear camera preferred
          { fps: fps, qrbox: qrboxSize },
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
  }, [myKeyPair, scannerActive, isMobile]);

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

        // Resize large images for better performance on mobile
        let width = img.width;
        let height = img.height;

        if (isMobile && (width > 1000 || height > 1000)) {
          const maxDimension = 1000;
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

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
      localStorage.removeItem(`${key.publicKey}-createdAt`);
    });

    // Clear the state
    setVerifiedKeys([]);
    setShowDeleteConfirmation(false);
    showNotification('All verified keys deleted');
  };

  const truncateKey = (key) => {
    if (!key) return '';
    // Shorter truncation on mobile
    if (isMobile) {
      return `${key.substring(0, 6)}...${key.substring(key.length - 6)}`;
    }
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white p-2 sm:p-6">
      <div className="max-w-4xl mx-auto bg-black bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="p-3 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4 sm:mb-6">
            Triple Handshake
          </h1>

          <Notification notification={notification} />

          <NavigationTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentQR={currentQR}
            isMobile={isMobile}
          />

          <div className="transition-all duration-300">
            {activeTab === 'myKey' && (
              <MyKeyTab
                myKeyPair={myKeyPair}
                myQrRef={myQrRef}
                downloadQRCode={downloadQRCode}
                isMobile={isMobile}
                truncateKey={truncateKey}
              />
            )}

            {activeTab === 'scanner' && (
              <ScannerTab
                scannerActive={scannerActive}
                toggleScanner={toggleScanner}
                scanAnimation={scanAnimation}
                fileInputRef={fileInputRef}
                handleFileUpload={handleFileUpload}
                isMobile={isMobile}
              />
            )}

            {activeTab === 'response' && currentQR && (
              <ResponseTab
                currentQR={currentQR}
                responseQrRef={responseQrRef}
                downloadQRCode={downloadQRCode}
                isMobile={isMobile}
              />
            )}

            {activeTab === 'verified' && (
              <VerifiedKeysTab
                verifiedKeys={verifiedKeys}
                showDeleteConfirmation={showDeleteConfirmation}
                setShowDeleteConfirmation={setShowDeleteConfirmation}
                deleteAllVerifiedKeys={deleteAllVerifiedKeys}
                showNotification={showNotification}
                setScannerActive={setScannerActive}
                setActiveTab={setActiveTab}
                isMobile={isMobile}
                truncateKey={truncateKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRKeyExchange;
