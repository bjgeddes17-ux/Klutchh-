import { runPlaybackStateStressSuite } from './playbackStateStressTest';

console.log('===================================================================');
console.log(' RUNNING NATIVE VIDEO PLAYBACK, FULLSCREEN & CONTROL STRESS TEST');
console.log('===================================================================\n');

const suite = runPlaybackStateStressSuite();

suite.results.forEach((res) => {
  const status = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${status}] Test #${res.testId}: ${res.title} (${res.category})`);
  console.log(`         Metrics: ${res.metrics}\n`);
});

console.log('-------------------------------------------------------------------');
console.log(`PLAYBACK STRESS RESULT: ${suite.passed}/${suite.total} Passed (${suite.rate.toFixed(1)}%)`);
console.log('-------------------------------------------------------------------');

if (suite.rate === 100) {
  console.log('🎉 PLAYBACK & FULLSCREEN STATE CONTROL STRESS TEST PERFECTED (0 State Errors)');
  process.exit(0);
} else {
  console.error('❌ PLAYBACK STRESS TEST FAILED');
  process.exit(1);
}
