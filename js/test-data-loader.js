/**
 * Test script for AppDataLoader
 * Tests data loading, validation, and utility functions
 */

// For Node.js testing, we need to simulate fetch
const fs = require('fs');
const path = require('path');

// Mock fetch for Node.js environment
global.fetch = async function (url) {
	const filePath = path.join(__dirname, '..', url);
	try {
		const data = fs.readFileSync(filePath, 'utf8');
		return {
			ok: true,
			status: 200,
			statusText: 'OK',
			text: async () => data
		};
	} catch (error) {
		return {
			ok: false,
			status: 404,
			statusText: 'Not Found'
		};
	}
};

// Import required modules
const DataValidator = require('./data-validator.js');
// Make DataValidator globally available for AppDataLoader
global.DataValidator = DataValidator;
const AppDataLoader = require('./app-data-loader.js');

/**
 * Runs comprehensive tests for AppDataLoader
 */
async function runDataLoaderTests() {
	console.log('🧪 Running AppDataLoader Tests\n');

	let passedTests = 0;
	let totalTests = 0;

	// Test 1: Load sample data
	console.log('📋 Test 1: Loading sample-designs.json');
	try {
		const loader = new AppDataLoader();
		const data = await loader.loadDesigns('data/sample-designs.json');

		if (data && data.designs && data.designs.length === 15) {
			console.log('   ✅ Successfully loaded 15 sample designs');
			passedTests++;
		} else {
			console.log('   ❌ Failed to load expected number of designs');
		}
		totalTests++;

		// Test data access methods
		console.log('\n📋 Test 1.1: Testing data access methods');

		const allDesigns = loader.getDesigns();
		const firstDesign = loader.getDesignById('design_001');
		const stats = loader.getDataStats();

		if (allDesigns && allDesigns.designs.length === 15) {
			console.log('   ✅ getDesigns() works correctly');
			passedTests++;
		} else {
			console.log('   ❌ getDesigns() failed');
		}
		totalTests++;

		if (firstDesign && firstDesign.id === 'design_001') {
			console.log('   ✅ getDesignById() works correctly');
			passedTests++;
		} else {
			console.log('   ❌ getDesignById() failed');
		}
		totalTests++;

		if (stats && stats.totalDesigns === 15) {
			console.log('   ✅ getDataStats() works correctly');
			console.log(`      - Total designs: ${stats.totalDesigns}`);
			console.log(`      - Unique authors: ${stats.uniqueAuthors}`);
			console.log(`      - Style tags: ${stats.tagStats.style.unique} unique`);
			passedTests++;
		} else {
			console.log('   ❌ getDataStats() failed');
		}
		totalTests++;

	} catch (error) {
		console.log(`   ❌ Error loading sample data: ${error.message}`);
		totalTests += 4;
	}

	// Test 2: Generate random pairs
	console.log('\n📋 Test 2: Testing random pair generation');
	try {
		const loader = new AppDataLoader();
		await loader.loadDesigns('data/sample-designs.json');

		const usedPairs = new Set();
		const pairs1 = loader.getRandomPairs(3, usedPairs);
		const pairs2 = loader.getRandomPairs(2, usedPairs);

		if (pairs1.length === 3 && pairs2.length === 2) {
			console.log('   ✅ Generated correct number of pairs');
			console.log(`      - First batch: ${pairs1.length} pairs`);
			console.log(`      - Second batch: ${pairs2.length} pairs`);
			console.log(`      - Total unique pairs tracked: ${usedPairs.size}`);
			passedTests++;
		} else {
			console.log('   ❌ Failed to generate correct number of pairs');
		}
		totalTests++;

		// Verify pairs are unique
		const allPairs = [...pairs1, ...pairs2];
		const pairIds = allPairs.map(pair => [pair[0].id, pair[1].id].sort().join('|'));
		const uniquePairIds = new Set(pairIds);

		if (pairIds.length === uniquePairIds.size) {
			console.log('   ✅ All generated pairs are unique');
			passedTests++;
		} else {
			console.log('   ❌ Duplicate pairs detected');
		}
		totalTests++;

	} catch (error) {
		console.log(`   ❌ Error testing pair generation: ${error.message}`);
		totalTests += 2;
	}

	// Test 3: Filter designs by tags
	console.log('\n📋 Test 3: Testing tag-based filtering');
	try {
		const loader = new AppDataLoader();
		await loader.loadDesigns('data/sample-designs.json');

		// Filter by industry
		const techDesigns = loader.getDesignsByTags({ industry: ['Tech'] });
		const healthDesigns = loader.getDesignsByTags({ industry: ['Health'] });

		console.log(`   📊 Tech designs found: ${techDesigns.length}`);
		console.log(`   📊 Health designs found: ${healthDesigns.length}`);

		// Filter by multiple criteria
		const techMinimalDesigns = loader.getDesignsByTags({
			industry: ['Tech'],
			style: ['Modern', 'Clean', 'Minimal']
		});

		console.log(`   📊 Tech + Modern/Clean/Minimal designs: ${techMinimalDesigns.length}`);

		if (techDesigns.length > 0 && healthDesigns.length > 0) {
			console.log('   ✅ Tag filtering works correctly');
			passedTests++;
		} else {
			console.log('   ❌ Tag filtering failed');
		}
		totalTests++;

	} catch (error) {
		console.log(`   ❌ Error testing tag filtering: ${error.message}`);
		totalTests++;
	}

	// Test 4: Load scraped data
	console.log('\n📋 Test 4: Loading scraped designs.json');
	try {
		const loader = new AppDataLoader();
		const data = await loader.loadDesigns('data/designs.json');

		if (data && data.designs && data.designs.length > 0) {
			console.log(`   ✅ Successfully loaded ${data.designs.length} scraped designs`);

			// Test with cleaned data
			const stats = loader.getDataStats();
			console.log(`   📊 Statistics:`);
			console.log(`      - Total designs: ${stats.totalDesigns}`);
			console.log(`      - Average colors per design: ${stats.averageColorsPerDesign.toFixed(1)}`);
			console.log(`      - Most common styles: ${stats.tagStats.style.mostCommon.slice(0, 3).map(t => t.tag).join(', ')}`);

			passedTests++;
		} else {
			console.log('   ❌ Failed to load scraped designs');
		}
		totalTests++;

	} catch (error) {
		console.log(`   ❌ Error loading scraped data: ${error.message}`);
		totalTests++;
	}

	// Test 5: Error handling
	console.log('\n📋 Test 5: Testing error handling');
	try {
		const loader = new AppDataLoader();

		// Test loading non-existent file
		try {
			await loader.loadDesigns('data/non-existent.json');
			console.log('   ❌ Should have thrown error for non-existent file');
		} catch (error) {
			console.log('   ✅ Correctly handled non-existent file error');
			passedTests++;
		}
		totalTests++;

		// Test methods before loading data
		const designsBeforeLoad = loader.getDesigns();
		const isReadyBeforeLoad = loader.isReady();

		if (designsBeforeLoad === null && !isReadyBeforeLoad) {
			console.log('   ✅ Correctly handled unloaded state');
			passedTests++;
		} else {
			console.log('   ❌ Failed to handle unloaded state');
		}
		totalTests++;

	} catch (error) {
		console.log(`   ❌ Error in error handling test: ${error.message}`);
		totalTests += 2;
	}

	// Test 6: Edge cases
	console.log('\n📋 Test 6: Testing edge cases');
	try {
		const loader = new AppDataLoader();
		await loader.loadDesigns('data/sample-designs.json');

		// Test getting more pairs than possible
		const usedPairs = new Set();
		const maxPossiblePairs = (15 * 14) / 2; // 15 designs = 105 possible pairs
		const tooManyPairs = loader.getRandomPairs(maxPossiblePairs + 10, usedPairs);

		console.log(`   📊 Requested ${maxPossiblePairs + 10} pairs, got ${tooManyPairs.length}`);

		if (tooManyPairs.length <= maxPossiblePairs) {
			console.log('   ✅ Correctly limited pair generation');
			passedTests++;
		} else {
			console.log('   ❌ Failed to limit pair generation');
		}
		totalTests++;

		// Test invalid design ID
		const invalidDesign = loader.getDesignById('non_existent_id');
		if (invalidDesign === null) {
			console.log('   ✅ Correctly handled invalid design ID');
			passedTests++;
		} else {
			console.log('   ❌ Failed to handle invalid design ID');
		}
		totalTests++;

	} catch (error) {
		console.log(`   ❌ Error in edge case testing: ${error.message}`);
		totalTests += 2;
	}

	// Summary
	console.log('\n📊 Test Summary');
	console.log(`   Total tests: ${totalTests}`);
	console.log(`   Passed: ${passedTests}`);
	console.log(`   Failed: ${totalTests - passedTests}`);
	console.log(`   Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

	if (passedTests === totalTests) {
		console.log('\n🎉 All AppDataLoader tests passed!');
	} else {
		console.log('\n⚠️  Some AppDataLoader tests failed. Check the output above for details.');
	}
}

// Run tests if this script is executed directly
if (require.main === module) {
	runDataLoaderTests().catch(console.error);
}

module.exports = { runDataLoaderTests };