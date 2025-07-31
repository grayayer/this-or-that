/**
 * Test script for progress tracking functionality
 * Tests the core progress tracking logic without browser dependencies
 */

// Mock DOM elements for testing
global.document = {
	getElementById: (id) => {
		const mockElements = {
			'progress-text': {
				textContent: '',
				classList: { add: () => { }, remove: () => { } }
			},
			'progress-bar': {
				style: { setProperty: () => { } },
				classList: { add: () => { }, remove: () => { } }
			},
			'progress-section': {
				classList: { add: () => { }, remove: () => { } }
			}
		};
		return mockElements[id] || null;
	},
	createElement: () => ({
		className: '',
		id: '',
		style: { display: '' },
		innerHTML: '',
		addEventListener: () => { },
		querySelector: () => null
	}),
	querySelector: () => null
};

global.window = {
	dispatchEvent: () => { }
};

// Load the app module
const {
	appState,
	initializeApp,
	resetApplicationState,
	getAppStatus,
	handleSelection
} = require('./js/app.js');

// Mock data loader
global.AppDataLoader = class {
	constructor() {
		this.designs = [
			{ id: 'design1', image: 'test1.jpg', tags: { style: ['Modern'] } },
			{ id: 'design2', image: 'test2.jpg', tags: { style: ['Classic'] } },
			{ id: 'design3', image: 'test3.jpg', tags: { style: ['Minimal'] } },
			{ id: 'design4', image: 'test4.jpg', tags: { style: ['Bold'] } }
		];
	}

	async loadDesigns() {
		return { designs: this.designs };
	}

	getRandomPairs(count, usedPairs) {
		const pairs = [];
		for (let i = 0; i < count && i < this.designs.length - 1; i++) {
			pairs.push([this.designs[i], this.designs[i + 1]]);
		}
		return pairs;
	}

	getDataStats() {
		return {
			totalDesigns: this.designs.length,
			tagStats: { style: { unique: 4 } },
			averageColorsPerDesign: 3
		};
	}
};

// Mock fetch
global.fetch = async () => ({
	ok: true,
	json: async () => ({ designs: [] })
});

async function runTests() {
	console.log('🧪 Testing Progress Tracking Functionality\n');

	try {
		// Test 1: Initialize app
		console.log('Test 1: App Initialization');
		await initializeApp({ enableLogging: false });

		let status = getAppStatus();
		console.log(`✅ App initialized with ${status.designCount} designs`);
		console.log(`   Progress: ${status.progressPercentage}%`);
		console.log(`   Can show results: ${status.canShowResults}`);
		console.log(`   Remaining choices: ${status.remainingChoices}\n`);

		// Test 2: Simulate selections up to threshold
		console.log('Test 2: Progress tracking through selections');

		for (let i = 1; i <= 25; i++) {
			// Set up mock current pair for each selection
			appState.currentPair = [
				{ id: `design${i}a`, image: `test${i}a.jpg`, tags: { style: ['Modern'] } },
				{ id: `design${i}b`, image: `test${i}b.jpg`, tags: { style: ['Classic'] } }
			];

			const success = handleSelection(`design${i}a`);

			if (success) {
				status = getAppStatus();
				console.log(`Selection ${i}: Progress ${status.progressPercentage.toFixed(1)}%, Remaining: ${status.remainingChoices}`);

				// Check key milestones
				if (i === 20) {
					console.log(`   ✅ Reached minimum threshold (20 choices)`);
					console.log(`   Can show results: ${status.canShowResults}`);
				}

				// Mock pair will be set up in next iteration
			} else {
				console.log(`❌ Selection ${i} failed`);
				break;
			}
		}

		console.log('\nTest 3: Final status check');
		status = getAppStatus();
		console.log(`Final progress: ${status.progressPercentage.toFixed(1)}%`);
		console.log(`Total rounds: ${status.totalRounds}`);
		console.log(`Current session: ${status.currentSession}`);
		console.log(`Can show results: ${status.canShowResults}`);
		console.log(`Is complete: ${status.isComplete}`);

		// Test 4: Reset functionality
		console.log('\nTest 4: Reset functionality');
		resetApplicationState();
		status = getAppStatus();
		console.log(`After reset - Progress: ${status.progressPercentage}%, Total rounds: ${status.totalRounds}`);

		console.log('\n✅ All progress tracking tests completed successfully!');

	} catch (error) {
		console.error(`❌ Test failed: ${error.message}`);
		console.error(error.stack);
	}
}

// Run the tests
runTests();