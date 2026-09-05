import { runOverlayRenderStressSuite } from './overlayRenderStressTest';

console.log('===================================================================');
console.log(' RUNNING SKELETON OVERLAY RENDER & PROJECTION STRESS TEST');
console.log('===================================================================\n');

const suite = runOverlayRenderStressSuite();

let currentCategory = '';

suite.results.forEach((res) => {
  if (res.category !== currentCategory) {
    currentCategory = res.category;
    console.log(`\n--- ${currentCategory.toUpperCase()} ---`);
  }
  const status = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${status}] ${res.testCase}`);
  console.log(`         Details: ${res.details}`);
});

console.log('\n-------------------------------------------------------------------');
console.log(`OVERLAY RENDER RESULT: ${suite.totalPassed}/${suite.totalTests} Passed (${suite.successRate.toFixed(1)}%)`);
console.log('-------------------------------------------------------------------');

if (suite.successRate === 100) {
  console.log('🎉 SKELETON OVERLAY PROJECTION PERFECTED (0px Alignment Error)');
  process.exit(0);
} else {
  console.error('❌ OVERLAY RENDER TEST FAILED');
  process.exit(1);
}
