// This file must be in JavaScript, not TypeScript, for broadest compatibility.

// Polyfill for Buffer, which is required by many Web3 libraries.
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill for crypto.getRandomValues, required by Phantom SDK.
import 'react-native-get-random-values';

console.log('[POLYFILL] Buffer and crypto have been loaded globally.');

// After polyfills are loaded, load the original app entry point.
import 'expo-router/entry';
