/**
 * Test script for URL cleaning functionality
 */

const { cleanWebsiteUrl } = require('./clean-existing-urls.js');

console.log('🧪 Testing URL cleaning functionality...\n');

const testCases = [
	{
		input: 'https://everon.net/?ref=land-book.com',
		expected: 'https://everon.net/',
		description: 'Basic ref parameter removal'
	},
	{
		input: 'https://seriant.org/?ref=land-book.com',
		expected: 'https://seriant.org/',
		description: 'Another basic ref parameter removal'
	},
	{
		input: 'https://example.com/?utm_source=test&ref=land-book.com&utm_medium=web',
		expected: 'https://example.com/?utm_source=test&utm_medium=web',
		description: 'Remove ref but keep other parameters'
	},
	{
		input: 'https://example.com/?ref=land-book.com&other=param',
		expected: 'https://example.com/?other=param',
		description: 'Remove ref from beginning of query string'
	},
	{
		input: 'https://example.com/',
		expected: 'https://example.com/',
		description: 'URL without parameters (no change)'
	},
	{
		input: 'https://example.com/?other=param',
		expected: 'https://example.com/?other=param',
		description: 'URL with other parameters (no change)'
	},
	{
		input: null,
		expected: null,
		description: 'Null URL handling'
	},
	{
		input: '',
		expected: '',
		description: 'Empty URL handling'
	}
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
	const result = cleanWebsiteUrl(testCase.input);
	const success = result === testCase.expected;

	console.log(`Test ${index + 1}: ${testCase.description}`);
	console.log(`  Input:    ${testCase.input}`);
	console.log(`  Expected: ${testCase.expected}`);
	console.log(`  Result:   ${result}`);
	console.log(`  Status:   ${success ? '✅ PASS' : '❌ FAIL'}\n`);

	if (success) {
		passed++;
	} else {
		failed++;
	}
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
	console.log('🎉 All tests passed!');
	process.exit(0);
} else {
	console.log('❌ Some tests failed');
	process.exit(1);
}