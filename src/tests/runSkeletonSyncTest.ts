import { run20LevelSkeletonSyncTest } from './skeletonSyncStressTest';

console.log('=======================================================');
console.log(' RUNNING 20-LEVEL SKELETON SYNC STRESS TEST ENGINE');
console.log('=======================================================\n');

const suite = run20LevelSkeletonSyncTest();

suite.results.forEach((res) => {
  const status = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`Level ${res.level.toString().padStart(2, '0')}: [${status}] ${res.name} (${res.category})`);
  console.log(`          Details: ${res.details}\n`);
});

console.log('-------------------------------------------------------');
console.log(`SUMMARY: ${suite.totalPassed}/${suite.totalLevels} Levels Passed (${suite.overallSuccessRate.toFixed(1)}%)`);
console.log('-------------------------------------------------------');

if (suite.overallSuccessRate === 100) {
  console.log('🎉 SKELETON SYNCHRONIZATION PERFECTED (0ms - 8ms Sub-Frame Accuracy)');
  process.exit(0);
} else {
  console.error('❌ STRESS TEST FAILED - DRIFT OR GEOMETRY ISSUES DETECTED');
  process.exit(1);
}
