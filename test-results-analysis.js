/**
 * Test file for results analysis engine
 * Tests the core functionality of results.js
 */

// Mock data for testing
const mockDesigns = [
	{
		id: "design_001",
		image: "https://example.com/image1.jpg",
		title: "Modern Portfolio",
		tags: {
			style: ["Minimalist", "Clean", "Modern"],
			industry: ["Design", "Portfolio"],
			typography: ["Sans Serif"],
			type: ["Personal", "Portfolio"],
			category: ["Portfolio"],
			platform: ["Webflow"],
			colors: ["#FFFFFF", "#000000", "#F5F5F5"]
		}
	},
	{
		id: "design_002",
		image: "https://example.com/image2.jpg",
		title: "Health Tech Startup",
		tags: {
			style: ["Gradient", "Modern", "Clean"],
			industry: ["Health & Fitness", "Tech"],
			typography: ["Sans Serif"],
			type: ["Software", "Web App"],
			category: ["Landing"],
			platform: ["React"],
			colors: ["#4A90E2", "#FFFFFF", "#F8F9FA"]
		}
	},
	{
		id: "design_003",
		image: "https://example.com/image3.jpg",
		title: "Creative Agency",
		tags: {
			style: ["Bold", "Colorful", "Animation"],
			industry: ["Design", "Marketing"],
			typography: ["Serif", "Sans Serif"],
			type: ["Agency", "Service"],
			category: ["Agency"],
			platform: ["Framer"],
			colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"]
		}
	}
];

const mockSelections = [
	{
		timestamp: "2025-01-30T10:30:00Z",
		selectedId: "design_001",
		rejectedId: "design_002",
		timeToDecision: 12.5,
		roundNumber: 1
	},
	{
		timestamp: "2025-01-30T10:31:00Z",
		selectedId: "design_001",
		rejectedId: "design_003",
		timeToDecision: 8.2,
		roundNumber: 2
	},
	{
		timestamp: "2025-01-30T10:32:00Z",
		selectedId: "design_002",
		rejectedId: "design_003",
		timeToDecision: 15.1,
		roundNumber: 3
	}
];

/**
 * Test the calculateTagFrequencies function
 */
function testCalculateTagFrequencies() {
	console.log('🧪 Testing calculateTagFrequencies...');

	try {
		const frequencies = calculateTagFrequencies(mockSelections, mockDesigns);

		// Verify structure
		const expectedCategories = ['style', 'industry', 'typography', 'type', 'category', 'platform', 'colors'];
		expectedCategories.forEach(category => {
			if (!frequencies[category]) {
				throw new Error(`Missing category: ${category}`);
			}
			if (!Array.isArray(frequencies[category])) {
				throw new Error(`Category ${category} is not an array`);
			}
		});

		// Verify style frequencies (design_001 selected twice, design_002 once)
		const styleFreqs = frequencies.style;
		const modernTag = styleFreqs.find(item => item.tag === 'Modern');
		const cleanTag = styleFreqs.find(item => item.tag === 'Clean');
		const minimalistTag = styleFreqs.find(item => item.tag === 'Minimalist');

		if (!modernTag || modernTag.frequency !== 3) {
			throw new Error(`Expected Modern frequency 3, got ${modernTag?.frequency}`);
		}

		if (!cleanTag || cleanTag.frequency !== 3) {
			throw new Error(`Expected Clean frequency 3, got ${cleanTag?.frequency}`);
		}

		if (!minimalistTag || minimalistTag.frequency !== 2) {
			throw new Error(`Expected Minimalist frequency 2, got ${minimalistTag?.frequency}`);
		}

		console.log('✅ calculateTagFrequencies test passed');
		return true;

	} catch (error) {
		console.error('❌ calculateTagFrequencies test failed:', error.message);
		return false;
	}
}

/**
 * Test the generateProfile function
 */
function testGenerateProfile() {
	console.log('🧪 Testing generateProfile...');

	try {
		const frequencies = calculateTagFrequencies(mockSelections, mockDesigns);
		const profile = generateProfile(frequencies, mockSelections);

		// Verify structure
		if (!profile.preferences || !profile.topRecommendations || !profile.strengthScores) {
			throw new Error('Missing required profile sections');
		}

		// Verify preferences structure
		Object.keys(frequencies).forEach(category => {
			if (!profile.preferences[category]) {
				throw new Error(`Missing preference category: ${category}`);
			}

			const categoryPref = profile.preferences[category];
			if (!categoryPref.top || !categoryPref.all || categoryPref.totalUnique === undefined) {
				throw new Error(`Invalid structure for category: ${category}`);
			}
		});

		// Verify recommendations are strings
		if (!Array.isArray(profile.topRecommendations)) {
			throw new Error('topRecommendations should be an array');
		}

		profile.topRecommendations.forEach((rec, index) => {
			if (typeof rec !== 'string') {
				throw new Error(`Recommendation ${index} should be a string`);
			}
		});

		console.log('✅ generateProfile test passed');
		return true;

	} catch (error) {
		console.error('❌ generateProfile test failed:', error.message);
		return false;
	}
}

/**
 * Test the analyzeSelections function
 */
function testAnalyzeSelections() {
	console.log('🧪 Testing analyzeSelections...');

	try {
		const results = analyzeSelections(mockSelections, mockDesigns);

		// Verify structure
		if (!results.metadata || !results.tagFrequencies || !results.profile) {
			throw new Error('Missing required result sections');
		}

		// Verify metadata
		if (results.metadata.totalSelections !== mockSelections.length) {
			throw new Error(`Expected ${mockSelections.length} selections, got ${results.metadata.totalSelections}`);
		}

		if (!results.metadata.completedAt || !results.metadata.analysisVersion) {
			throw new Error('Missing metadata fields');
		}

		console.log('✅ analyzeSelections test passed');
		return true;

	} catch (error) {
		console.error('❌ analyzeSelections test failed:', error.message);
		return false;
	}
}

/**
 * Test the formatResults function
 */
function testFormatResults() {
	console.log('🧪 Testing formatResults...');

	try {
		const analysisResults = analyzeSelections(mockSelections, mockDesigns);
		const formatted = formatResults(analysisResults);

		// Verify structure
		if (!formatted.header || !formatted.categories || !formatted.recommendations) {
			throw new Error('Missing required formatted sections');
		}

		// Verify header
		if (!formatted.header.title || !formatted.header.subtitle) {
			throw new Error('Missing header fields');
		}

		// Verify categories
		if (!Array.isArray(formatted.categories)) {
			throw new Error('Categories should be an array');
		}

		formatted.categories.forEach((category, index) => {
			if (!category.name || !category.displayName || !category.topItems) {
				throw new Error(`Invalid category structure at index ${index}`);
			}

			if (!Array.isArray(category.topItems)) {
				throw new Error(`Category ${category.name} topItems should be an array`);
			}
		});

		// Verify recommendations
		if (!formatted.recommendations.title || !Array.isArray(formatted.recommendations.items)) {
			throw new Error('Invalid recommendations structure');
		}

		console.log('✅ formatResults test passed');
		return true;

	} catch (error) {
		console.error('❌ formatResults test failed:', error.message);
		return false;
	}
}

/**
 * Test error handling
 */
function testErrorHandling() {
	console.log('🧪 Testing error handling...');

	try {
		// Test with empty selections
		try {
			analyzeSelections([], mockDesigns);
			throw new Error('Should have thrown error for empty selections');
		} catch (error) {
			if (!error.message.includes('No selections provided')) {
				throw new Error('Wrong error message for empty selections');
			}
		}

		// Test with empty designs
		try {
			analyzeSelections(mockSelections, []);
			throw new Error('Should have thrown error for empty designs');
		} catch (error) {
			if (!error.message.includes('No designs provided')) {
				throw new Error('Wrong error message for empty designs');
			}
		}

		// Test with null inputs
		try {
			calculateTagFrequencies(null, mockDesigns);
			throw new Error('Should have thrown error for null selections');
		} catch (error) {
			// Expected to throw
		}

		console.log('✅ Error handling test passed');
		return true;

	} catch (error) {
		console.error('❌ Error handling test failed:', error.message);
		return false;
	}
}

/**
 * Run all tests
 */
function runAllTests() {
	console.log('🚀 Starting results analysis tests...\n');

	const tests = [
		testCalculateTagFrequencies,
		testGenerateProfile,
		testAnalyzeSelections,
		testFormatResults,
		testErrorHandling
	];

	let passed = 0;
	let failed = 0;

	tests.forEach(test => {
		try {
			if (test()) {
				passed++;
			} else {
				failed++;
			}
		} catch (error) {
			console.error(`❌ Test ${test.name} threw unexpected error:`, error.message);
			failed++;
		}
		console.log(''); // Add spacing between tests
	});

	console.log('📊 Test Results:');
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

	if (failed === 0) {
		console.log('🎉 All tests passed! Results analysis engine is working correctly.');
	} else {
		console.log('⚠️ Some tests failed. Please review the implementation.');
	}

	return failed === 0;
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
	// Browser environment - run tests when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', runAllTests);
	} else {
		runAllTests();
	}
} else if (typeof module !== 'undefined' && require.main === module) {
	// Node.js environment - run tests immediately
	runAllTests();
}