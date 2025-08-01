/**
 * Core test for selection handling functionality without DOM dependencies
 * Tests the essential handleSelection function requirements
 */

// For Node.js testing, we need to simulate fetch and load dependencies
const fs = require('fs');
const path = require('path');

// Mock fetch for Node.js environment
global.fetch = async function (url) {
	const filePath = path.join(__dirname, url);
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

// Mock DOM functions to avoid errors
global.document = {
	getElementById: () => null
};

// Import required modules
const DataValidator = require('./js/data-validator.js');
global.DataValidator = DataValidator;

const AppDataLoader = require('./js/app-data-loader.js');
global.AppDataLoader = AppDataLoader;

const {
	appState,
	initializeApp,
	handleSelection
} = require('./js/app.js');

// Mock timer functions for testing
global.getTimerState = () => ({
	duration: 15,
	currentTime: 8.5,
	isActive: true,
	isPaused: false
});

global.stopTimer = () => {
	console.log('🛑 Timer stopped (mock)');
};

global.startTimer = () => {
	console.log('▶️ Timer started (mock)');
};

/**
 * Runs core tests for selection handling without DOM dependencies
 */
async function runCoreSelectionTests() {
	console.log('🧪 Running Core Selection Handling Tests (No DOM)\n');

	let passedTests = 0;
	let totalTests = 0;

	// Initialize app first
	try {
		await initializeApp({
			dataPath: 'data/sample-designs.json',
			enableLogging: false
		});
		console.log('✅ App initialized for testing');
	} catch (error) {
		console.error('❌ Failed to initialize app for testing:', error.message);
		return;
	}

	// Test 1: Core selection handling functionality
	console.log('📋 Test 1: Core selection handling functionality');
	try {
		// Set up a test pair manually
		appState.currentPair = [appState.designs[0], appState.designs[1]];
		const initialSelectionCount = appState.selections.length;
		const initialRound = appState.currentRound;
		const initialTotalRounds = appState.totalRounds;
		const initialUsedPairs = appState.usedPairs.size;

		const selectedId = appState.currentPair[0].id;
		const rejectedId = appState.currentPair[1].id;

		console.log(`   Selecting: ${selectedId} over ${rejectedId}`);

		// Make selection
		const success = handleSelection(selectedId);

		// Check return value
		if (success) {
			console.log('   ✅ handleSelection returned true');
			passedTests++;
		} else {
			console.log('   ❌ handleSelection returned false');
		}

		// Check selection was recorded
		if (appState.selections.length === initialSelectionCount + 1) {
			console.log('   ✅ Selection was recorded');
			passedTests++;
		} else {
			console.log('   ❌ Selection was not recorded');
		}

		// Check round counters
		if (appState.currentRound === initialRound + 1) {
			console.log('   ✅ Current round incremented');
			passedTests++;
		} else {
			console.log('   ❌ Current round not incremented');
		}

		if (appState.totalRounds === initialTotalRounds + 1) {
			console.log('   ✅ Total rounds incremented');
			passedTests++;
		} else {
			console.log('   ❌ Total rounds not incremented');
		}

		// Check used pairs tracking
		if (appState.usedPairs.size === initialUsedPairs + 1) {
			console.log('   ✅ Used pairs tracking updated');
			passedTests++;
		} else {
			console.log('   ❌ Used pairs tracking not updated');
		}

		totalTests += 5;
	} catch (error) {
		console.log(`   ❌ Error in core selection test: ${error.message}`);
		totalTests += 5;
	}

	// Test 2: Selection record structure
	console.log('\n📋 Test 2: Selection record structure and metadata');
	try {
		if (appState.selections.length > 0) {
			const lastSelection = appState.selections[appState.selections.length - 1];

			// Check required fields
			const requiredFields = ['timestamp', 'selectedId', 'rejectedId', 'roundNumber', 'timeToDecision', 'selectedTags', 'rejectedTags'];
			let missingFields = [];

			requiredFields.forEach(field => {
				if (!lastSelection.hasOwnProperty(field)) {
					missingFields.push(field);
				}
			});

			if (missingFields.length === 0) {
				console.log('   ✅ Selection record has all required fields');
				passedTests++;
			} else {
				console.log(`   ❌ Selection record missing fields: ${missingFields.join(', ')}`);
			}

			// Check timestamp format
			const timestampValid = !isNaN(Date.parse(lastSelection.timestamp));
			if (timestampValid) {
				console.log('   ✅ Timestamp is valid ISO format');
				passedTests++;
			} else {
				console.log('   ❌ Timestamp is not valid');
			}

			// Check time to decision
			if (typeof lastSelection.timeToDecision === 'number' && lastSelection.timeToDecision > 0) {
				console.log(`   ✅ Time to decision recorded: ${lastSelection.timeToDecision}s`);
				passedTests++;
			} else {
				console.log('   ❌ Time to decision not properly recorded');
			}

			// Check IDs match
			if (lastSelection.selectedId === appState.currentPair[0].id &&
				lastSelection.rejectedId === appState.currentPair[1].id) {
				console.log('   ✅ Correct IDs recorded');
				passedTests++;
			} else {
				console.log('   ❌ Incorrect IDs recorded');
			}

			// Check tag metadata
			if (lastSelection.selectedTags && lastSelection.rejectedTags &&
				typeof lastSelection.selectedTags === 'object' &&
				typeof lastSelection.rejectedTags === 'object') {
				console.log('   ✅ Tag metadata included');
				passedTests++;
			} else {
				console.log('   ❌ Tag metadata missing or invalid');
			}

			totalTests += 5;
		} else {
			console.log('   ❌ No selections available to test');
			totalTests += 5;
		}
	} catch (error) {
		console.log(`   ❌ Error in selection record test: ${error.message}`);
		totalTests += 5;
	}

	// Test 3: Error handling
	console.log('\n📋 Test 3: Error handling');
	try {
		// Test with invalid design ID
		const invalidResult = handleSelection('non-existent-id');

		if (!invalidResult) {
			console.log('   ✅ Invalid selection correctly rejected');
			passedTests++;
		} else {
			console.log('   ❌ Invalid selection was accepted');
		}

		// Test with no current pair
		const originalPair = appState.currentPair;
		appState.currentPair = [];

		const noPairResult = handleSelection('any-id');

		if (!noPairResult) {
			console.log('   ✅ Selection without current pair correctly rejected');
			passedTests++;
		} else {
			console.log('   ❌ Selection without current pair was accepted');
		}

		// Restore original pair
		appState.currentPair = originalPair;

		totalTests += 2;
	} catch (error) {
		console.log(`   ❌ Error in error handling test: ${error.message}`);
		totalTests += 2;
	}

	// Test 4: Requirements verification
	console.log('\n📋 Test 4: Requirements verification');
	try {
		// Requirement 2.4: Record selection and advance to next pair
		if (appState.selections.length > 0) {
			console.log('   ✅ Requirement 2.4: Selection recorded ✓');
			passedTests++;
		} else {
			console.log('   ❌ Requirement 2.4: Selection not recorded');
		}

		// Requirement 3.1: Progress tracking
		if (appState.totalRounds > 0 && appState.currentRound > 0) {
			console.log('   ✅ Requirement 3.1: Progress tracking active ✓');
			passedTests++;
		} else {
			console.log('   ❌ Requirement 3.1: Progress tracking not working');
		}

		totalTests += 2;
	} catch (error) {
		console.log(`   ❌ Error in requirements verification test: ${error.message}`);
		totalTests += 2;
	}

	// Summary
	console.log('\n📊 Core Selection Handling Test Summary');
	console.log(`   Total tests: ${totalTests}`);
	console.log(`   Passed: ${passedTests}`);
	console.log(`   Failed: ${totalTests - passedTests}`);
	console.log(`   Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

	// Show final state
	console.log('\n📋 Final State Summary:');
	console.log(`   Total selections: ${appState.selections.length}`);
	console.log(`   Current round: ${appState.currentRound}`);
	console.log(`   Total rounds: ${appState.totalRounds}`);
	console.log(`   Used pairs tracked: ${appState.usedPairs.size}`);

	if (appState.selections.length > 0) {
		const lastSelection = appState.selections[appState.selections.length - 1];
		console.log(`   Last selection: ${lastSelection.selectedId} over ${lastSelection.rejectedId}`);
		console.log(`   Last selection time: ${lastSelection.timeToDecision}s`);
		console.log(`   Last selection round: ${lastSelection.roundNumber}`);
	}

	if (passedTests === totalTests) {
		console.log('\n🎉 All core selection handling tests passed!');
		console.log('✅ Task 9 requirements fully implemented');
		return true;
	} else {
		console.log('\n⚠️  Some core tests failed. Check implementation.');
		return false;
	}
}

// Run tests if this script is executed directly
if (require.main === module) {
	runCoreSelectionTests().catch(console.error);
}

module.exports = { runCoreSelectionTests };