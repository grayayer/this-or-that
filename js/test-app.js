/**
 * Test script for app.js core application state management
 * Tests initialization, state management, and error handling
 */

// For Node.js testing, we need to simulate fetch and load dependencies
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
global.DataValidator = DataValidator;

const AppDataLoader = require('./app-data-loader.js');
global.AppDataLoader = AppDataLoader;

const {
	appState,
	initializeApp,
	resetApplicationState,
	getAppState,
	isAppReady,
	getAppStatus,
	validateDependencies,
	handleAppError,
	clearAppError
} = require('./app.js');

/**
 * Runs comprehensive tests for app.js
 */
async function runAppTests() {
	console.log('🧪 Running App.js Core State Management Tests\n');

	let passedTests = 0;
	let totalTests = 0;

	// Test 1: Dependency validation
	console.log('📋 Test 1: Dependency validation');
	try {
		const validation = validateDependencies();

		if (validation.isValid) {
			console.log('   ✅ All required dependencies available');
			passedTests++;
		} else {
			console.log('   ❌ Missing dependencies:', validation.missing);
		}

		if (validation.warnings.length > 0) {
			console.log('   ⚠️ Warnings:', validation.warnings);
		}

		totalTests++;
	} catch (error) {
		console.log(`   ❌ Error in dependency validation: ${error.message}`);
		totalTests++;
	}

	// Test 2: Initial state verification
	console.log('\n📋 Test 2: Initial application state');
	try {
		const initialReady = isAppReady();
		const initialStatus = getAppStatus();

		if (!initialReady && !appState.isInitialized) {
			console.log('   ✅ Application correctly starts in uninitialized state');
			passedTests++;
		} else {
			console.log('   ❌ Application should start uninitialized');
		}

		if (initialStatus.designCount === 0 && initialStatus.currentRound === 0) {
			console.log('   ✅ Initial status values are correct');
			passedTests++;
		} else {
			console.log('   ❌ Initial status values incorrect');
		}

		totalTests += 2;
	} catch (error) {
		console.log(`   ❌ Error checking initial state: ${error.message}`);
		totalTests += 2;
	}

	// Test 3: Successful initialization with sample data
	console.log('\n📋 Test 3: Initialize with sample data');
	try {
		const success = await initializeApp({
			dataPath: 'data/sample-designs.json',
			enableLogging: false  // Reduce noise in tests
		});

		if (success && appState.isInitialized) {
			console.log('   ✅ Application initialized successfully');
			passedTests++;
		} else {
			console.log('   ❌ Application initialization failed');
		}

		if (isAppReady() && appState.designs.length === 15) {
			console.log(`   ✅ Loaded correct number of designs: ${appState.designs.length}`);
			passedTests++;
		} else {
			console.log(`   ❌ Incorrect design count: ${appState.designs.length}`);
		}

		const status = getAppStatus();
		if (status.isReady && !status.isLoading && !status.error) {
			console.log('   ✅ Application status is correct after initialization');
			passedTests++;
		} else {
			console.log('   ❌ Application status incorrect after initialization');
		}

		totalTests += 3;
	} catch (error) {
		console.log(`   ❌ Error during initialization: ${error.message}`);
		totalTests += 3;
	}

	// Test 4: State management functions
	console.log('\n📋 Test 4: State management functions');
	try {
		// Test getAppState returns a copy
		const stateCopy = getAppState();
		const originalDesignCount = appState.designs.length;

		// Modify the copy
		stateCopy.designs.push({ id: 'test' });

		if (appState.designs.length === originalDesignCount) {
			console.log('   ✅ getAppState() returns a safe copy');
			passedTests++;
		} else {
			console.log('   ❌ getAppState() allows state mutation');
		}

		// Test status information
		const status = getAppStatus();
		const expectedProgress = Math.min(100, (status.totalRounds / status.minChoicesRequired) * 100);

		if (status.progressPercentage === expectedProgress) {
			console.log('   ✅ Progress calculation is correct');
			passedTests++;
		} else {
			console.log('   ❌ Progress calculation is incorrect');
		}

		totalTests += 2;
	} catch (error) {
		console.log(`   ❌ Error testing state management: ${error.message}`);
		totalTests += 2;
	}

	// Test 5: Error handling
	console.log('\n📋 Test 5: Error handling');
	try {
		// Test initialization with invalid data path
		try {
			await initializeApp({
				dataPath: 'data/non-existent.json',
				fallbackDataPath: 'data/also-non-existent.json',
				enableLogging: false
			});
			console.log('   ❌ Should have thrown error for non-existent files');
		} catch (error) {
			console.log('   ✅ Correctly handled missing data files');
			passedTests++;
		}

		// Test error state management
		handleAppError('Test error', 'Test context');

		if (appState.error === 'Test error') {
			console.log('   ✅ Error state correctly set');
			passedTests++;
		} else {
			console.log('   ❌ Error state not set correctly');
		}

		clearAppError();

		if (appState.error === null) {
			console.log('   ✅ Error state correctly cleared');
			passedTests++;
		} else {
			console.log('   ❌ Error state not cleared');
		}

		totalTests += 3;
	} catch (error) {
		console.log(`   ❌ Error in error handling test: ${error.message}`);
		totalTests += 3;
	}

	// Test 6: State reset functionality
	console.log('\n📋 Test 6: State reset functionality');
	try {
		// First ensure we have initialized state
		await initializeApp({
			dataPath: 'data/sample-designs.json',
			enableLogging: false
		});

		// Simulate some user progress
		appState.currentRound = 5;
		appState.totalRounds = 5;
		appState.selections.push({ test: 'selection' });
		appState.usedPairs.add('test|pair');

		const designCountBeforeReset = appState.designs.length;

		// Reset state
		resetApplicationState();

		const resetChecks = [
			appState.currentRound === 0,
			appState.totalRounds === 0,
			appState.selections.length === 0,
			appState.usedPairs.size === 0,
			appState.currentSession === 1,
			appState.designs.length === designCountBeforeReset  // Should preserve designs
		];

		if (resetChecks.every(check => check)) {
			console.log('   ✅ State reset correctly preserves data and clears progress');
			passedTests++;
		} else {
			console.log('   ❌ State reset did not work correctly');
		}

		totalTests++;
	} catch (error) {
		console.log(`   ❌ Error testing state reset: ${error.message}`);
		totalTests++;
	}

	// Test 7: Fallback data loading
	console.log('\n📋 Test 7: Fallback data loading');
	try {
		// Reset state first
		appState.isInitialized = false;
		appState.designs = [];

		const success = await initializeApp({
			dataPath: 'data/non-existent-primary.json',  // This will fail
			fallbackDataPath: 'data/sample-designs.json',  // This should work
			enableLogging: false
		});

		if (success && appState.designs.length === 15) {
			console.log('   ✅ Fallback data loading works correctly');
			passedTests++;
		} else {
			console.log('   ❌ Fallback data loading failed');
		}

		totalTests++;
	} catch (error) {
		console.log(`   ❌ Error testing fallback loading: ${error.message}`);
		totalTests++;
	}

	// Test 8: Configuration options
	console.log('\n📋 Test 8: Configuration options');
	try {
		const customConfig = {
			dataPath: 'data/sample-designs.json',
			timerDuration: 45,
			enableLogging: false
		};

		await initializeApp(customConfig);

		if (appState.config.timerDuration === 45) {
			console.log('   ✅ Custom configuration applied correctly');
			passedTests++;
		} else {
			console.log('   ❌ Custom configuration not applied');
		}

		// Test that default values are preserved for unspecified options
		if (appState.minChoicesRequired === 20) {  // Default value in appState, not config
			console.log('   ✅ Default configuration values preserved');
			passedTests++;
		} else {
			console.log('   ❌ Default configuration values not preserved');
		}

		totalTests += 2;
	} catch (error) {
		console.log(`   ❌ Error testing configuration: ${error.message}`);
		totalTests += 2;
	}

	// Summary
	console.log('\n📊 Test Summary');
	console.log(`   Total tests: ${totalTests}`);
	console.log(`   Passed: ${passedTests}`);
	console.log(`   Failed: ${totalTests - passedTests}`);
	console.log(`   Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

	if (passedTests === totalTests) {
		console.log('\n🎉 All app.js tests passed!');
	} else {
		console.log('\n⚠️  Some app.js tests failed. Check the output above for details.');
	}

	return { passed: passedTests, total: totalTests };
}

// Run tests if this script is executed directly
if (require.main === module) {
	runAppTests().catch(console.error);
}

module.exports = { runAppTests };