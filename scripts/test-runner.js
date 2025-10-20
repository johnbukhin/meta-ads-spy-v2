#!/usr/bin/env node

/**
 * Simple test runner that validates core functionality
 * Use this for quick deployment validation
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Meta Ads Spy Test Suite...\n');

const tests = [
  {
    name: 'Unit Tests - AdAnalytics Service',
    command: 'npm test tests/adAnalytics.test.js',
    critical: true
  },
  {
    name: 'Unit Tests - MetaAdsClient',
    command: 'npm test tests/metaAdsClient.test.js',
    critical: true
  },
  {
    name: 'Basic Server Tests',
    command: 'npm test tests/server-simple.test.js',
    critical: true
  }
];

let passedTests = 0;
let totalTests = tests.length;
let criticalFailures = [];

for (const test of tests) {
  try {
    console.log(`▶️  ${test.name}`);
    execSync(test.command, { stdio: 'pipe', cwd: process.cwd() });
    console.log(`✅ ${test.name} - PASSED\n`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${test.name} - FAILED`);
    console.log(`   Error: ${error.message.split('\n')[0]}\n`);
    
    if (test.critical) {
      criticalFailures.push(test.name);
    }
  }
}

console.log('📊 Test Results Summary:');
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Failed: ${totalTests - passedTests}/${totalTests}`);

if (criticalFailures.length > 0) {
  console.log('\n🚨 Critical Failures:');
  criticalFailures.forEach(test => console.log(`   - ${test}`));
  console.log('\n❌ DEPLOYMENT NOT RECOMMENDED - Fix critical issues first');
  process.exit(1);
} else if (passedTests === totalTests) {
  console.log('\n✅ ALL TESTS PASSED - Ready for deployment!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed, but no critical failures detected');
  console.log('   Consider fixing non-critical issues before deployment');
  process.exit(0);
}