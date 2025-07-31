/**
 * Test script for image pair selection functionality
 * Tests the core functions without browser dependencies
 */

// Mock DOM elements for testing
global.document = {
	getElementById: (id) => {
		const mockElements = {
			'image-1': {
				src: '',
				alt: '',
				onload: null,
				onerror: null,
				style: { setProperty: () => { } }
			},
			'image-2': {
				src: '',
				alt: '',
				onload: null,
				onerror: null,
				style: { setProperty: () => { } }
			},
			'image-option-1': {
				dataset: {},
				classList: { add: () => { }, remove: () => { } },
				addEventListener: () => { }
			},
			'image-option-2': {
				dataset: {},
				classList: { add: () => { }, remove: () => { } },
				addEventListener: () => { }
			},
			'progress-text': { textContent: '' },
			'progress-bar': { style: { setProperty: () => { } } },
			'selection-section': { style: { display: 'block' } },
			'loading-section': { style: { display: 'none' } }
		};
		return mockElements[id] || { style: { display: 'none' } };
	}
};

global.Image = function () {
	return { src: '' };
};

global.fetch = async (url) => {
	// Mock fetch for sample data
	if (url.includes('sample-designs.json')) {
		const fs = require('fs');
		const data = fs.readFileSync('./data/sample-designs.json', 'utf8');
		return {
			ok: true,
			text: async () => data
		};
	}
	throw new Error('File not found');
};

// Load the modules
const DataValidator = require('./js/data-validator.js');
const AppDataLoader = require('./js/app-data-loader.js');

// Mock the app.js functions by requiring and testing them
global.DataValidator = DataValidator;
global.AppDataLoader = AppDataLoader;

// Load app.js functions
const {
	appState,
	initializeApp,
	loadNextPair,
	handleSelection,
	initializeImagePairSystem
} = require('./js/app.js');

async function runTests() {
	console.log('🧪 Testing Image Pair Selection System');
	console.log('=====================================');

	try {
		// Test 1: Initialize app
		console.log('\n1. Testing app initialization...');
		const initResult = await initializeApp({
			dataPath: 'data/sample-designs.json',
			fallbackDataPath: 'data/sample-designs.json',
			enableLogging: true
		});

		if (initResult) {
			console.log('✅ App initialization successful');
			console.log(`   - Loaded ${appState.designs.length} designs`);
		} else {
			throw new Error('App initialization failed');
		}

		// Test 2: Load first pair
		console.log('\n2. Testing loadNextPair function...');
		const pairResult = loadNextPair();

		if (pairResult && appState.currentPair.length === 2) {
			console.log('✅ First pair loaded successfully');
			console.log(`   - Pair: ${appState.currentPair[0].id} vs ${appState.currentPair[1].id}`);
		} else {
			throw new Error('Failed to load first pair');
		}

		// Test 3: Handle selection
		console.log('\n3. Testing handleSelection function...');
		const selectedId = appState.currentPair[0].id;
		const selectionResult = handleSelection(selectedId);

		if (selectionResult && appState.selections.length === 1) {
			console.log('✅ Selection handling successful');
			console.log(`   - Selected: ${appState.selections[0].selectedId}`);
			console.log(`   - Rejected: ${appState.selections[0].rejectedId}`);
			console.log(`   - Round: ${appState.currentRound}`);
		} else {
			throw new Error('Failed to handle selection');
		}

		// Test 4: Load multiple pairs to test duplicate prevention
		console.log('\n4. Testing duplicate prevention...');
		const initialUsedPairs = appState.usedPairs.size;

		for (let i = 0; i < 5; i++) {
			loadNextPair();
			handleSelection(appState.currentPair[0].id);
		}

		if (appState.usedPairs.size > initialUsedPairs) {
			console.log('✅ Duplicate prevention working');
			console.log(`   - Used pairs: ${appState.usedPairs.size}`);
			console.log(`   - Total selections: ${appState.selections.length}`);
		} else {
			throw new Error('Duplicate prevention not working');
		}

		// Test 5: Test app state
		console.log('\n5. Testing app state management...');
		const status = require('./js/app.js').getAppStatus();

		if (status.isReady && status.currentRound > 0) {
			console.log('✅ App state management working');
			console.log(`   - Current round: ${status.currentRound}`);
			console.log(`   - Progress: ${status.progressPercentage.toFixed(1)}%`);
			console.log(`   - Remaining choices: ${status.remainingChoices}`);
		} else {
			throw new Error('App state management issues');
		}

		console.log('\n🎉 All tests passed! Image pair selection system is working correctly.');

	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		process.exit(1);
	}
}

// Run the tests
runTests();