export { bleScanner } from './scanner';
export { bleConnectionManager } from './connection';
export { blePacketParser } from './packetParser';
export { BLEService } from './service';

import { bleScanner } from './scanner';
import { bleConnectionManager } from './connection';
import { blePacketParser } from './packetParser';
import { BLEService } from './service';

export const bleService = new BLEService(bleScanner, bleConnectionManager, blePacketParser);
export default bleService;