// Minimal URL polyfill for Hermes (RN 0.76) — hostname/host/origin not implemented
const _safeGetHostname = function() {
  try {
    const h = this.toString();
    const match = h.match(/^https?:\/\/([^:/]+)/);
    return match ? match[1] : '';
  } catch(e) { return ''; }
};
const _safeGetHost = function() {
  try {
    const h = this.toString();
    const match = h.match(/^https?:\/\/([^/]+)/);
    return match ? match[1] : '';
  } catch(e) { return ''; }
};
const _safeGetOrigin = function() {
  try {
    const h = this.toString();
    const match = h.match(/^(https?:\/\/[^/]+)/);
    return match ? match[1] : '';
  } catch(e) { return ''; }
};
try { Object.defineProperty(URL.prototype, 'hostname', { get: _safeGetHostname, configurable: true }); } catch(e) {}
try { Object.defineProperty(URL.prototype, 'host', { get: _safeGetHost, configurable: true }); } catch(e) {}
try { Object.defineProperty(URL.prototype, 'origin', { get: _safeGetOrigin, configurable: true }); } catch(e) {}

// URLSearchParams polyfill for Hermes — set/append/delete not implemented
if (typeof URLSearchParams !== 'undefined') {
  if (!URLSearchParams.prototype.set) {
    URLSearchParams.prototype.set = function(key, value) {
      let found = false;
      for (let i = 0; i < this._pairs.length; i++) {
        if (this._pairs[i][0] === key) {
          this._pairs[i][1] = String(value);
          found = true;
          break;
        }
      }
      if (!found) this._pairs.push([key, String(value)]);
    };
  }
  if (!URLSearchParams.prototype.append) {
    URLSearchParams.prototype.append = function(key, value) {
      this._pairs.push([key, String(value)]);
    };
  }
  if (!URLSearchParams.prototype.delete) {
    URLSearchParams.prototype.delete = function(key) {
      this._pairs = this._pairs.filter(function(pair) { return pair[0] !== key; });
    };
  }
}

import { AppRegistry } from 'react-native';
import App from './app/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
