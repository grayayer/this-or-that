/**
 * Focused test for selection handling functionality
 * Tests the core handleSelection function requirements
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
 * Runs focused tests for selection handling
 */
async function runSelectionTests() {
	console.log('🧪 Running Selection Handling Core Tests\n');

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

	// Test 1: Selection recording with complete metadata
	console.log('📋 Test 1: Selection recording with complete metadata');
	try {
		// Set up a test pair manually
		appState.currentPair = [appState.designs[0], appState.designs[1]];
		const initialSelectionCount = appState.selections.length;
		const selectedId = appState.currentPair[0].id;
		const rejectedId = appState.currentPair[1].id;

		// Make selection
		const success = handleSelection(selectedId);

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

		// Check selection record structure
		const lastSelection = appState.selections[appState.selections.length - 1];

		if (lastSelection.selectedId === selectedId && lastSelection.rejectedId === rejectedId) {
			console.log('   ✅ Correct IDs recorded');
			passedTests++;
		} else {
			console.log('   ❌ Incorrect IDs recorded');
		}

		// Check timestamp
		if (lastSelection.timestamp && !isNaN(Date.parse(lastSelection.timestamp))) {
			console.log('   ✅ Valid timestamp recorded');
			passedTests++;
		} else {
			console.log('   ❌ Invalid timestamp');
		}

		// Check time to decision
		if (typeof lastSelection.timeToDecision === 'number' && lastSelection.timeToDecision > 0) {
			console.log(`   ✅ Time to decision recorded: ${lastSelection.timeToDecision}s`);
			passedTests++;
		} else {
			console.log('   ❌ Time to decision not properly recorded');
		}

		// Check tag metadata
		if (lastSelection.selectedTags && lastSelection.rejectedTags) {
			console.log('   ✅ Tag metadata included');
			passedTests++;
		} else {
			console.log('   ❌ Tag metadata missing');
		}

		totalTests += 6;
	} catch (error) {
		console.log(`   ❌ Error in selection recording test: ${error.message}`);
		totalTests += 6;
	}

	// Test 2: State updates and progress tracking
	console.log('\n📋 Test 2: State updates and progress tracking');
	try {
		const initialRound = appState.currentRound;
		const initialTotalRounds = appState.totalRounds;
		const initialUsedPairs = appState.usedPairs.size;

		// Set up another test pair
		appState.currentPair = [appState.designs[2], appState.designs[3]];
		const selectedId = appState.currentPair[0].id;

		// Make selection
		handleSelection(selectedId);

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
		if (appState.usedPairs.size > initialUsedPairs) {
			console.log('   ✅ Used pairs tracking updated');
			passedTests++;
		} else {
			console.log('   ❌ Used pairs tracking not updated');
		}

		totalTests += 3;
	} catch (error) {
		console.log(`   ❌ Error in state updates test: ${error.message}`);
		totalTests += 3;
	}

	// Test 3: Error handling
	console.log('\n📋 Test 3: Error handling');
	try {
		// Test invalid design ID
		const invalidResult = handleSelection('invalid-id');
		if (!invalidResult) {
			console.log('   ✅ Invalid selection rejected');
			passedTests++;
		} else {
			console.log('   ❌ Invalid selection accepted');
		}

		// Test no current pair
		const originalPair = appState.currentPair;
		appState.currentPair = [];
		const noPairResult = handleSelection('any-id');
		if (!noPairResult) {
			console.log('   ✅ Selection without pair rejected');
			passedTests++;
		} else {
			console.log('   ❌ Selection without pair accepted');
		}

		// Restore pair
		appState.currentPair = originalPair;

		totalTests += 2;
	} catch (error) {
		console.log(`   ❌ Error in error handling test: ${error.message}`);
		totalTests += 2;
	}

	// Test 4: Requirements compliance
	console.log('\n📋 Test 4: Requirements compliance check');
	try {
		// Requirement 2.4: Record selection and advance to next pair
		const initialSelections = appState.selections.length;
		appState.currentPair = [appState.designs[4], appState.designs[5]];

		handleSelection(appState.currentPair[0].id);

		if (appState.selections.length > initialSelections) {
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
		console.log(`   ❌ Error in requirements compliance test: ${error.message}`);
		totalTests += 2;
	}

	// Summary
	console.log('\n📊 Selection Handling Test Summary');
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
		console.log(`   Last selection time: ${lastSelection.timeToDecision}s`);
		console.log(`   Last selection tags: ${Object.keys(lastSelection.selectedTags || {}).length} categories`);
	}

	if (passedTests === totalTests) {
		console.log('\n🎉 All selection handling tests passed!');
		console.log('✅ Task 9 requirements fully implemented');
	} else {
		console.log('\n⚠️  Some tests failed. Check implementation.');
	}

	return { passed: passedTests, total: totalTests };
}

// Run tests if this script is executed directly
if (require.main === module) {
	runSelectionTests().catch(console.error);
}

module.exports = { runSelectionTests };