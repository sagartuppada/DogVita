/**
 * BLE Packet Parser - Parses raw BLE data into structured format
 */

import { BLEParsedData, BLEDataPacket, HeartRatePacket, GPSPacket, TemperaturePacket, BatteryPacket, ActivityPacket } from '../../types';

class BLEPacketParser {
  private static instance: BLEPacketParser;

  private constructor() {}

  public static getInstance(): BLEPacketParser {
    if (!BLEPacketParser.instance) {
      BLEPacketParser.instance = new BLEPacketParser();
    }
    return BLEPacketParser.instance;
  }

  parse(data: string, deviceId: string): BLEParsedData | null {
    try {
      const bytes = this.base64ToBytes(data);
      const packetType = bytes[0];

      switch (packetType) {
        case 0x01:
          return this.parseHeartRatePacket(bytes, deviceId);
        case 0x02:
          return this.parseGPSPacket(bytes, deviceId);
        case 0x03:
          return this.parseTemperaturePacket(bytes, deviceId);
        case 0x04:
          return this.parseBatteryPacket(bytes, deviceId);
        case 0x05:
          return this.parseActivityPacket(bytes, deviceId);
        default:
          console.warn(`Unknown packet type: ${packetType}`);
          return null;
      }
    } catch (error) {
      console.error('Error parsing BLE packet:', error);
      return null;
    }
  }

  private parseHeartRatePacket(bytes: Uint8Array, deviceId: string): BLEParsedData {
    const flags = bytes[1];
    const is16Bit = (flags & 0x01) !== 0;
    let bpm: number;

    if (is16Bit) {
      bpm = (bytes[3] << 8) | bytes[2];
    } else {
      bpm = bytes[2];
    }

    return {
      deviceId,
      timestamp: Date.now(),
      metrics: {
        heartRate: bpm,
      },
    };
  }

  private parseGPSPacket(bytes: Uint8Array, deviceId: string): BLEParsedData {
    const latitude = this.bytesToFloat(bytes.slice(1, 5));
    const longitude = this.bytesToFloat(bytes.slice(5, 9));
    const altitude = this.bytesToFloat(bytes.slice(9, 13));

    return {
      deviceId,
      timestamp: Date.now(),
      metrics: {
        gps: {
          latitude,
          longitude,
          altitude,
        },
      },
    };
  }

  private parseTemperaturePacket(bytes: Uint8Array, deviceId: string): BLEParsedData {
    const tempRaw = (bytes[2] << 8) | bytes[1];
    const celsius = tempRaw / 100.0;
    const humidity = bytes[3];

    return {
      deviceId,
      timestamp: Date.now(),
      metrics: {
        temperature: celsius,
        humidity,
      },
    };
  }

  private parseBatteryPacket(bytes: Uint8Array, deviceId: string): BLEParsedData {
    const level = bytes[1];
    const voltage = ((bytes[3] << 8) | bytes[2]) / 1000.0;
    const isCharging = (bytes[4] & 0x01) !== 0;

    return {
      deviceId,
      timestamp: Date.now(),
      metrics: {
        battery: level,
      },
    };
  }

  private parseActivityPacket(bytes: Uint8Array, deviceId: string): BLEParsedData {
    const steps = (bytes[4] << 24) | (bytes[3] << 16) | (bytes[2] << 8) | bytes[1];
    const activeMinutes = bytes[5];
    const distance = this.bytesToFloat(bytes.slice(6, 10));

    return {
      deviceId,
      timestamp: Date.now(),
      metrics: {
        activity: {
          steps,
          activeMinutes,
          distance,
        },
      },
    };
  }

  private base64ToBytes(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }

    let len = base64.length;
    if (base64[len - 1] === '=') len--;
    if (base64[len - 1] === '=') len--;

    const bytes = new Uint8Array((len * 6) >> 3);

    let i: number, j: number, t: number;
    let p = 0;

    for (i = 0, j = 0; i < len; i += 4, j += 3) {
      t = (lookup[base64.charCodeAt(i)] << 18) | (lookup[base64.charCodeAt(i + 1)] << 12);
      bytes[j] = t >> 16;
      if (i + 2 < len) {
        t |= lookup[base64.charCodeAt(i + 2)] << 6;
        bytes[j + 1] = (t >> 8) & 0xff;
      }
      if (i + 3 < len) {
        bytes[j + 2] = t & 0xff;
      }
    }

    return bytes;
  }

  private bytesToFloat(bytes: Uint8Array): number {
    let value = 0;
    for (let i = 0; i < bytes.length; i++) {
      value = value * 256 + bytes[i];
    }
    return value / 1000000.0;
  }
}

export const blePacketParser = BLEPacketParser.getInstance();
export default blePacketParser;