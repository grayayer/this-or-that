/**
 * Test script for DataValidator
 * Tests validation with sample data and edge cases
 */

// Import the validator (works in Node.js environment)
const DataValidator = require('./data-validator.js');
const fs = require('fs');
const path = require('path');

/**
 * Runs all validation tests
 */
function runTests() {
	console.log('🧪 Running Data Validator Tests\n');

	const validator = new DataValidator();
	let passedTests = 0;
	let totalTests = 0;

	// Test 1: Validate sample designs data
	console.log('📋 Test 1: Validating sample-designs.json');
	try {
		const sampleDataPath = path.join(__dirname, '../data/sample-designs.json');
		const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

		const result = validator.validateDesignsData(sampleData);

		console.log(`   ✅ Valid: ${result.isValid}`);
		console.log(`   📊 Errors: ${result.errors.length}`);
		console.log(`   ⚠️  Warnings: ${result.warnings.length}`);

		if (result.errors.length > 0) {
			console.log('   🔴 Errors:');
			result.errors.forEach(error => console.log(`      - ${error}`));
		}

		if (result.warnings.length > 0) {
			console.log('   🟡 Warnings:');
			result.warnings.forEach(warning => console.log(`      - ${warning}`));
		}

		if (result.isValid) {
			passedTests++;
			console.log(`   ✅ Sample data validation passed`);
		} else {
			console.log(`   ❌ Sample data validation failed`);
		}
		totalTests++;

	} catch (error) {
		console.log(`   ❌ Error reading sample data: ${error.message}`);
		totalTests++;
	}

	console.log('\n📋 Test 2: Validating scraped designs.json');
	try {
		const scrapedDataPath = path.join(__dirname, '../data/designs.json');
		const scrapedData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf8'));

		const result = validator.validateDesignsData(scrapedData);

		console.log(`   ✅ Valid: ${result.isValid}`);
		console.log(`   📊 Errors: ${result.errors.length}`);
		console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
		console.log(`   🧹 Cleaned designs: ${result.cleanedData ? result.cleanedData.designs.length : 0}`);

		if (result.warnings.length > 0 && result.warnings.length <= 5) {
			console.log('   🟡 Sample warnings:');
			result.warnings.slice(0, 5).forEach(warning => console.log(`      - ${warning}`));
			if (result.warnings.length > 5) {
				console.log(`      ... and ${result.warnings.length - 5} more warnings`);
			}
		}

		// Save cleaned data if validation was successful
		if (result.isValid && result.cleanedData) {
			const cleanedPath = path.join(__dirname, '../data/designs-cleaned.json');
			fs.writeFileSync(cleanedPath, JSON.stringify(result.cleanedData, null, 2));
			console.log(`   💾 Cleaned data saved to designs-cleaned.json`);
		}

		totalTests++;
		if (result.cleanedData && result.cleanedData.designs.length > 0) {
			passedTests++;
			console.log(`   ✅ Scraped data cleaning passed`);
		} else {
			console.log(`   ❌ Scraped data cleaning failed`);
		}

	} catch (error) {
		console.log(`   ❌ Error reading scraped data: ${error.message}`);
		totalTests++;
	}

	// Test 3: Edge cases and malformed data
	console.log('\n📋 Test 3: Testing edge cases and malformed data');

	const testCases = validator.createTestCases();

	testCases.forEach((testCase, index) => {
		console.log(`\n   🧪 Test 3.${index + 1}: ${testCase.name}`);

		const result = validator.validateDesignsData(testCase.data);
		const passed = result.isValid === testCase.expectedValid;

		console.log(`      Expected valid: ${testCase.expectedValid}, Got: ${result.isValid}`);
		console.log(`      Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);

		if (result.errors.length > 0) {
			console.log(`      Sample errors: ${result.errors.slice(0, 2).join(', ')}`);
		}

		if (passed) {
			console.log(`      ✅ Test passed`);
			passedTests++;
		} else {
			console.log(`      ❌ Test failed`);
		}
		totalTests++;
	});

	// Test 4: JSON string validation
	console.log('\n📋 Test 4: JSON string validation');

	const validJsonString = JSON.stringify({
		metadata: { generatedAt: '2025-01-30T10:00:00.000Z', totalDesigns: 1 },
		designs: [{
			id: 'test_json',
			image: 'https://example.com/test.jpg',
			tags: { style: ['Modern'], colors: ['#FFFFFF'] }
		}]
	});

	const invalidJsonString = '{ invalid json }';

	const validResult = validator.validateJsonString(validJsonString);
	const invalidResult = validator.validateJsonString(invalidJsonString);

	console.log(`   Valid JSON string: ${validResult.isValid ? '✅' : '❌'}`);
	console.log(`   Invalid JSON string: ${!invalidResult.isValid ? '✅' : '❌'}`);

	totalTests += 2;
	if (validResult.isValid) passedTests++;
	if (!invalidResult.isValid) passedTests++;

	// Summary
	console.log('\n📊 Test Summary');
	console.log(`   Total tests: ${totalTests}`);
	console.log(`   Passed: ${passedTests}`);
	console.log(`   Failed: ${totalTests - passedTests}`);
	console.log(`   Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

	if (passedTests === totalTests) {
		console.log('\n🎉 All tests passed!');
	} else {
		console.log('\n⚠️  Some tests failed. Check the output above for details.');
	}
}

// Run tests if this script is executed directly
if (require.main === module) {
	runTests();
}

module.exports = { runTests };