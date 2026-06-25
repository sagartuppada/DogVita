// Minimal URL polyfill for Hermes (RN 0.76)
const _safeGetHostname = function() {
  try {
    var h = this.toString();
    var m = h.match(/^https?:\/\/([^:/]+)/);
    return m ? m[1] : '';
  } catch(e) { return ''; }
};
const _safeGetHost = function() {
  try {
    var h = this.toString();
    var m = h.match(/^https?:\/\/([^/]+)/);
    return m ? m[1] : '';
  } catch(e) { return ''; }
};
const _safeGetOrigin = function() {
  try {
    var h = this.toString();
    var m = h.match(/^(https?:\/\/[^/]+)/);
    return m ? m[1] : '';
  } catch(e) { return ''; }
};
try { Object.defineProperty(URL.prototype, 'hostname', { get: _safeGetHostname, configurable: true }); } catch(e) {}
try { Object.defineProperty(URL.prototype, 'host', { get: _safeGetHost, configurable: true }); } catch(e) {}
try { Object.defineProperty(URL.prototype, 'origin', { get: _safeGetOrigin, configurable: true }); } catch(e) {}

// URLSearchParams full replacement for Hermes — prototype patching fails because
// Hermes internal methods throw before checking the prototype chain.
// We must replace the entire class with a working JS implementation.
(function() {
  function _URLSearchParams(init) {
    this._pairs = [];
    if (init instanceof _URLSearchParams) {
      for (var i = 0; i < init._pairs.length; i++) {
        this._pairs.push([init._pairs[i][0], init._pairs[i][1]]);
      }
    } else if (typeof init === 'string' && init.length > 0) {
      var parts = init.split('&');
      for (var j = 0; j < parts.length; j++) {
        var idx = parts[j].indexOf('=');
        if (idx >= 0) {
          this._pairs.push([
            decodeURIComponent(parts[j].substring(0, idx)),
            decodeURIComponent(parts[j].substring(idx + 1))
          ]);
        } else if (parts[j]) {
          this._pairs.push([decodeURIComponent(parts[j]), '']);
        }
      }
    }
  }
  _URLSearchParams.prototype.set = function(key, value) {
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === key) {
        this._pairs[i][1] = String(value);
        return;
      }
    }
    this._pairs.push([key, String(value)]);
  };
  _URLSearchParams.prototype.append = function(key, value) {
    this._pairs.push([key, String(value)]);
  };
  _URLSearchParams.prototype.delete = function(key) {
    this._pairs = this._pairs.filter(function(p) { return p[0] !== key; });
  };
  _URLSearchParams.prototype.get = function(key) {
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === key) return this._pairs[i][1];
    }
    return null;
  };
  _URLSearchParams.prototype.getAll = function(key) {
    var results = [];
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === key) results.push(this._pairs[i][1]);
    }
    return results;
  };
  _URLSearchParams.prototype.has = function(key) {
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === key) return true;
    }
    return false;
  };
  _URLSearchParams.prototype.keys = function() {
    return this._pairs.map(function(p) { return p[0]; });
  };
  _URLSearchParams.prototype.values = function() {
    return this._pairs.map(function(p) { return p[1]; });
  };
  _URLSearchParams.prototype.entries = function() {
    return this._pairs.slice();
  };
  _URLSearchParams.prototype.forEach = function(callback) {
    for (var i = 0; i < this._pairs.length; i++) {
      callback(this._pairs[i][1], this._pairs[i][0], this);
    }
  };
  _URLSearchParams.prototype.toString = function() {
    return this._pairs.map(function(p) {
      return encodeURIComponent(p[0]) + '=' + encodeURIComponent(p[1]);
    }).join('&');
  };
  // Force-replace — Hermes stubs throw even though the method "exists"
  global.URLSearchParams = _URLSearchParams;
})();

import { AppRegistry } from 'react-native';
import App from './app/App';
import { name as appName } from './app.json';

// Fix: postgrest-js adds trailing slash due to Hermes URL polyfill breaking new URL()
const _origFetch = global.fetch;
global.fetch = function() {
  if (arguments.length > 0 && typeof arguments[0] === 'string') {
    var urlStr = arguments[0];
    if (urlStr.indexOf('/rest/v1/') !== -1) {
      var fixed = urlStr.replace(/(\/rest\/v1\/.+?)\/\?/, '$1?');
      if (fixed !== urlStr) { arguments[0] = fixed; }
    }
  }
  return _origFetch.apply(this, arguments);
};

AppRegistry.registerComponent(appName, () => App);
