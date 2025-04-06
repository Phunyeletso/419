// Import react-native-get-random-values first to ensure crypto.getRandomValues is available
import 'react-native-get-random-values';

// Initialize crypto.getRandomValues if not available
if (typeof global.crypto === 'undefined') {
    global.crypto = {
        getRandomValues: (array) => {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        }
    };
}

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import process from 'process';
global.process = process;

// Polyfill TextEncoder/TextDecoder if not defined.
if (typeof TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// Polyfill structuredClone if not defined.
if (typeof structuredClone !== 'function') {
    global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);





