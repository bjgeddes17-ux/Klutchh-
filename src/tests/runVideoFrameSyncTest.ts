// src/tests/runVideoFrameSyncTest.ts
import { runVideoFrameSyncStressTest } from './videoFrameSyncStressTest';

const result = runVideoFrameSyncStressTest();
if (!result.allPassed) {
  process.exit(1);
} else {
  console.log('🎉 HIGH-PRECISION SYNCHRONIZATION SERVICE VALIDATED SUCCESSFULLY');
  process.exit(0);
}
