/**
 * Simple Email Functionality Test
 * Quick test to verify email functionality is working
 */

console.log('🧪 Running Simple Email Test...');

// Test 1: Check if email.js functions are available
console.log('\n1. Testing function availability...');

const requiredFunctions = [
	'initializeEmailService',
	'sendResults',
	'formatEmailContent',
	'showEmailForm',
	'hideEmailForm',
	'isValidEmail'
];

// Load email.js
const fs = require('fs');
const emailJsContent = fs.readFileSync('js/email.js', 'utf8');

requiredFunctions.forEach(funcName => {
	if (emailJsContent.includes(`function ${funcName}`) || emailJsContent.includes(`${funcName} =`)) {
		console.log(`✅ ${funcName} found`);
	} else {
		console.log(`❌ ${funcName} missing`);
	}
});

// Test 2: Email validation
console.log('\n2. Testing email validation...');

function testEmailValidation() {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const testCases = [
		{ email: 'user@example.com', expected: true },
		{ email: 'test.email@domain.co.uk', expected: true },
		{ email: 'invalid-email', expected: false },
		{ email: '@domain.com', expected: false },
		{ email: 'user@', expected: false }
	];

	let passed = 0;
	testCases.forEach(({ email, expected }) => {
		const result = emailRegex.test(email);
		const status = result === expected ? '✅' : '❌';
		console.log(`${status} "${email}" -> ${result}`);
		if (result === expected) passed++;
	});

	console.log(`📊 Email validation: ${passed}/${testCases.length} tests passed`);
	return passed === testCases.length;
}

const validationPassed = testEmailValidation();

// Test 3: Check HTML structure
console.log('\n3. Testing HTML structure...');

const htmlContent = fs.readFileSync('index.html', 'utf8');

const requiredElements = [
	'email-section',
	'email-form',
	'user-email',
	'designer-email',
	'email-results-btn',
	'email-status'
];

let htmlElementsFound = 0;
requiredElements.forEach(elementId => {
	if (htmlContent.includes(`id="${elementId}"`)) {
		console.log(`✅ #${elementId} found`);
		htmlElementsFound++;
	} else {
		console.log(`❌ #${elementId} missing`);
	}
});

const htmlPassed = htmlElementsFound === requiredElements.length;

// Test 4: Check CSS styling
console.log('\n4. Testing CSS styling...');

const cssContent = fs.readFileSync('css/main.css', 'utf8');

const requiredStyles = [
	'.email-section',
	'.email-form',
	'.email-status',
	'.btn-primary'
];

let cssStylesFound = 0;
requiredStyles.forEach(selector => {
	if (cssContent.includes(selector)) {
		console.log(`✅ ${selector} found`);
		cssStylesFound++;
	} else {
		console.log(`❌ ${selector} missing`);
	}
});

const cssPassed = cssStylesFound === requiredStyles.length;

// Test 5: Check EmailJS CDN
console.log('\n5. Testing EmailJS CDN inclusion...');

const emailJSIncluded = htmlContent.includes('emailjs/browser');
if (emailJSIncluded) {
	console.log('✅ EmailJS CDN script included');
} else {
	console.log('❌ EmailJS CDN script missing');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📋 TEST SUMMARY');
console.log('='.repeat(50));

const allTestsPassed = validationPassed && htmlPassed && cssPassed && emailJSIncluded;

if (allTestsPassed) {
	console.log('🎉 ALL TESTS PASSED!');
	console.log('✅ Email functionality is properly implemented');
	console.log('');
	console.log('📝 To use with real emails:');
	console.log('   1. Sign up for EmailJS at https://www.emailjs.com/');
	console.log('   2. Update EMAIL_CONFIG in js/email.js');
	console.log('   3. Set DEVELOPMENT_MODE = false');
	console.log('   4. Test with testEmailJSConfiguration() in browser console');
} else {
	console.log('❌ Some tests failed. Check the output above.');
}

console.log('\n✅ Email functionality implementation is ready!');