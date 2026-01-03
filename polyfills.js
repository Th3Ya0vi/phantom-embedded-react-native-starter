// This file must be in JavaScript, not TypeScript, for broadest compatibility.

// Polyfill for Array.prototype.toReversed which is missing in Hermes/older Node
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

// Polyfill for Buffer, which is required by many Web3 libraries.
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill for crypto.getRandomValues, required by Phantom SDK.
import 'react-native-get-random-values';

console.log('[POLYFILL] Buffer, crypto, and Array.toReversed have been loaded globally.');

// After polyfills are loaded, load the original app entry point.
import 'expo-router/entry';
