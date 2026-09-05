import { run100LevelSyncMatrix } from './skeletonSync100LevelMatrix';

console.log('===============================================================');
console.log(' RUNNING 100-LEVEL EXTREME SKELETON SYNC & GEOMETRY MATRIX TEST');
console.log('===============================================================\n');

const suite = run100LevelSyncMatrix();

let currentGroup = '';

suite.results.forEach((res) => {
  if (res.group !== currentGroup) {
    currentGroup = res.group;
    console.log(`\n--- ${currentGroup.toUpperCase()} ---`);
  }
  const status = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`Level ${res.level.toString().padStart(3, '0')}: [${status}] ${res.name} -> ${res.metric}`);
});

console.log('\n---------------------------------------------------------------');
console.log(`FINAL MATRIX RESULT: ${suite.totalPassed}/${suite.totalLevels} Levels Passed (${suite.overallSuccessRate.toFixed(1)}%)`);
console.log('---------------------------------------------------------------');

if (suite.overallSuccessRate === 100) {
  console.log('🎉 100% PERFECT PASS ACROSS ALL 100 STRESS LEVELS!');
  process.exit(0);
} else {
  console.error('❌ STRESS TEST MATRIX FAILED');
  process.exit(1);
}
