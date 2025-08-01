/**
 * Test file for results display functionality
 * Tests the HTML generation and display functions
 */

// Load the results.js file for testing
if (typeof require !== 'undefined') {
	const { analyzeSelections, formatResults, generateResultsHTML } = require('./js/results.js');
}

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

// Mock selections
const mockSelections = [
	{ selectedId: "design_001", rejectedId: "design_002", timestamp: "2025-01-30T10:00:00Z", timeToDecision: 5.2, roundNumber: 1 },
	{ selectedId: "design_002", rejectedId: "design_003", timestamp: "2025-01-30T10:00:30Z", timeToDecision: 3.8, roundNumber: 2 },
	{ selectedId: "design_001", rejectedId: "design_003", timestamp: "2025-01-30T10:01:00Z", timeToDecision: 2.1, roundNumber: 3 },
	{ selectedId: "design_001", rejectedId: "design_002", timestamp: "2025-01-30T10:01:30Z", timeToDecision: 4.5, roundNumber: 4 },
	{ selectedId: "design_002", rejectedId: "design_003", timestamp: "2025-01-30T10:02:00Z", timeToDecision: 6.2, roundNumber: 5 }
];

/**
 * Test the results analysis and formatting
 */
function testResultsAnalysis() {
	console.log('🧪 Testing results analysis...');

	try {
		// Test analysis
		const analysisResults = analyzeSelections(mockSelections, mockDesigns);
		console.log('✅ Analysis completed:', analysisResults);

		// Test formatting
		const formattedResults = formatResults(analysisResults);
		console.log('✅ Formatting completed:', formattedResults);

		return formattedResults;
	} catch (error) {
		console.error('❌ Analysis test failed:', error);
		throw error;
	}
}

/**
 * Test HTML generation
 */
function testHTMLGeneration() {
	console.log('🧪 Testing HTML generation...');

	try {
		const formattedResults = testResultsAnalysis();

		// Test HTML generation (if available in browser environment)
		if (typeof generateResultsHTML === 'function') {
			const html = generateResultsHTML(formattedResults);
			console.log('✅ HTML generation completed');
			console.log('Generated HTML length:', html.length);

			// Basic validation
			if (html.includes('results-summary') &&
				html.includes('preference-category') &&
				html.includes('recommendations-section')) {
				console.log('✅ HTML contains expected sections');
			} else {
				console.warn('⚠️ HTML may be missing expected sections');
			}

			return html;
		} else {
			console.log('ℹ️ HTML generation function not available in this environment');
		}
	} catch (error) {
		console.error('❌ HTML generation test failed:', error);
		throw error;
	}
}

/**
 * Run all tests
 */
function runTests() {
	console.log('🚀 Starting results display tests...');

	try {
		testResultsAnalysis();
		testHTMLGeneration();

		console.log('✅ All tests passed!');
	} catch (error) {
		console.error('❌ Tests failed:', error);
	}
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
	// Browser environment
	document.addEventListener('DOMContentLoaded', runTests);
} else if (typeof module !== 'undefined' && require.main === module) {
	// Node.js environment
	runTests();
}

// Export for use in other test files
if (typeof module !== 'undefined') {
	module.exports = {
		testResultsAnalysis,
		testHTMLGeneration,
		runTests,
		mockDesigns,
		mockSelections
	};
}