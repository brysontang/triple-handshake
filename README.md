# QR Key Exchange

A secure key exchange mechanism using QR codes for peer-to-peer cryptographic key verification.

## Overview

This component implements a secure key exchange protocol using QR codes. It allows users to:

1. Generate and display their public key as a QR code
2. Scan another user's public key QR code
3. Sign the scanned public key and display a response QR code
4. Verify and store trusted public keys

## How It Works

1. On first load, the component generates a cryptographic key pair using TweetNaCl.js
2. The public key is displayed as a QR code that can be shared with others
3. When a user scans another person's QR code, the component:
   - Verifies the received data
   - Signs the received public key with the user's private key
   - Generates a response QR code containing the signature
4. Verified keys are stored in the browser's localStorage for future use

## Features

- **Secure Key Generation**: Uses TweetNaCl.js for cryptographic operations
- **QR Code Scanning**: Built-in QR code scanner using html5-qrcode
- **Persistent Storage**: Saves verified keys in localStorage
- **Key Management**: Ability to delete all verified keys
- **Downloadable QR Codes**: Users can download their QR codes as PNG images

## Technical Implementation

The component uses:

- React hooks for state management
- TweetNaCl.js for cryptographic operations
- QRCode.react for QR code generation
- HTML5-QRCode for QR code scanning
- LocalStorage for persistent key storage

## Security Considerations

- Private keys never leave the user's device
- The exchange protocol uses cryptographic signatures for verification
- Users should verify the identity of the person they're exchanging keys with through an out-of-band method
