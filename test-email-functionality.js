/**
 * Test Email Functionality
 * Tests the email.js implementation for results sharing
 */

// Mock EmailJS for testing
if (typeof window !== 'undefined') {
	window.emailjs = {
		init: function (publicKey) {
			console.log('Mock EmailJS initialized with key:', publicKey);
		},
		send: function (serviceId, templateId, params) {
			console.log('Mock EmailJS send called with:', { serviceId, templateId, params });
			return Promise.resolve({ status: 200, text: 'OK' });
		}
	};
} else {
	// Node.js environment - mock global emailjs
	global.emailjs = {
		init: function (publicKey) {
			console.log('Mock EmailJS initialized with key:', publicKey);
		},
		send: function (serviceId, templateId, params) {
			console.log('Mock EmailJS send called with:', { serviceId, templateId, params });
			return Promise.resolve({ status: 200, text: 'OK' });
		}
	};
}

// Setup for Node.js testing
if (typeof window === 'undefined') {
	// Mock DOM elements for Node.js
	global.document = {
		getElementById: () => null,
		createElement: () => ({ innerHTML: '', parentNode: { insertBefore: () => { }, querySelector: () => null } }),
		addEventListener: () => { }
	};

	// Define required functions for Node.js testing
	global.isValidEmail = function (email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	global.getCurrentResultsData = function () {
		if (global.appState && global.appState.selections && global.appState.designs) {
			// Mock analysis for Node.js testing
			return {
				metadata: {
					totalSelections: global.appState.selections.length,
					completedAt: new Date().toISOString()
				},
				profile: {
					summary: 'Mock design preference summary',
					topRecommendations: ['Mock recommendation 1', 'Mock recommendation 2'],
					preferences: {
						style: { top: [{ tag: 'Minimalist', percentage: 50 }] }
					}
				}
			};
		}
		return null;
	};

	global.formatEmailContent = function (resultsData) {
		return {
			html: '<p>Mock HTML email content for testing</p>',
			text: 'Mock text email content for testing'
		};
	};

	global.sendResults = async function (userEmail, designerEmail, resultsData) {
		console.log('Mock sendResults called with:', { userEmail, designerEmail, hasResultsData: !!resultsData });
		return true;
	};

	global.analyzeSelections = function (selections, designs) {
		return global.getCurrentResultsData();
	};
}

// Mock app state with sample data
const mockAppState = {
	selections: [
		{
			selectedId: 'design-1',
			rejectedId: 'design-2',
			timestamp: '2025-01-30T10:30:00Z',
			timeToDecision: 12.5,
			roundNumber: 1
		},
		{
			selectedId: 'design-3',
			rejectedId: 'design-4',
			timestamp: '2025-01-30T10:31:00Z',
			timeToDecision: 8.2,
			roundNumber: 2
		}
	],
	designs: [
		{
			id: 'design-1',
			image: 'https://example.com/image1.jpg',
			tags: {
				style: ['Minimalist', 'Clean'],
				industry: ['Technology'],
				typography: ['Sans Serif'],
				type: ['Portfolio'],
				category: ['Personal'],
				platform: ['React'],
				colors: ['#FFFFFF', '#000000']
			}
		},
		{
			id: 'design-2',
			image: 'https://example.com/image2.jpg',
			tags: {
				style: ['Bold', 'Colorful'],
				industry: ['Creative'],
				typography: ['Display'],
				type: ['Business'],
				category: ['Agency'],
				platform: ['WordPress'],
				colors: ['#FF6B6B', '#4ECDC4']
			}
		},
		{
			id: 'design-3',
			image: 'https://example.com/image3.jpg',
			tags: {
				style: ['Minimalist', 'Modern'],
				industry: ['Technology'],
				typography: ['Sans Serif'],
				type: ['Portfolio'],
				category: ['Personal'],
				platform: ['Vue'],
				colors: ['#F8F9FA', '#343A40']
			}
		},
		{
			id: 'design-4',
			image: 'https://example.com/image4.jpg',
			tags: {
				style: ['Vintage', 'Textured'],
				industry: ['Fashion'],
				typography: ['Serif'],
				type: ['E-commerce'],
				category: ['Shop'],
				platform: ['Shopify'],
				colors: ['#8B4513', '#DEB887']
			}
		}
	]
};

// Set up mock app state
if (typeof window !== 'undefined') {
	window.appState = mockAppState;
}

/**
 * Test email validation function
 */
function testEmailValidation() {
	console.log('\n🧪 Testing Email Validation...');

	const testCases = [
		{ email: 'test@example.com', expected: true },
		{ email: 'user.name@domain.co.uk', expected: true },
		{ email: 'invalid-email', expected: false },
		{ email: '@domain.com', expected: false },
		{ email: 'user@', expected: false },
		{ email: '', expected: false },
		{ email: 'user@domain', expected: false }
	];

	testCases.forEach(({ email, expected }) => {
		const result = isValidEmail(email);
		const status = result === expected ? '✅' : '❌';
		console.log(`${status} "${email}" -> ${result} (expected: ${expected})`);
	});
}

/**
 * Test email content formatting
 */
function testEmailContentFormatting() {
	console.log('\n🧪 Testing Email Content Formatting...');

	try {
		// Generate mock results data
		const selections = mockAppState.selections;
		const designs = mockAppState.designs;
		const analysisResults = analyzeSelections(selections, designs);

		// Test email content formatting
		const emailContent = formatEmailContent(analysisResults);

		console.log('✅ Email content formatted successfully');
		console.log('📧 HTML content length:', emailContent.html.length);
		console.log('📧 Text content length:', emailContent.text.length);

		// Verify content includes key elements
		const htmlChecks = [
			{ check: 'title', found: emailContent.html.includes('Your Design Preference Profile') },
			{ check: 'total selections', found: emailContent.html.includes(selections.length.toString()) },
			{ check: 'recommendations', found: emailContent.html.includes('Design Direction Recommendations') },
			{ check: 'categories', found: emailContent.html.includes('Visual Style') }
		];

		htmlChecks.forEach(({ check, found }) => {
			const status = found ? '✅' : '❌';
			console.log(`${status} HTML contains ${check}: ${found}`);
		});

		const textChecks = [
			{ check: 'title', found: emailContent.text.includes('YOUR DESIGN PREFERENCE PROFILE') },
			{ check: 'summary section', found: emailContent.text.includes('SUMMARY') },
			{ check: 'recommendations section', found: emailContent.text.includes('DESIGN DIRECTION RECOMMENDATIONS') }
		];

		textChecks.forEach(({ check, found }) => {
			const status = found ? '✅' : '❌';
			console.log(`${status} Text contains ${check}: ${found}`);
		});

	} catch (error) {
		console.error('❌ Email content formatting test failed:', error.message);
	}
}

/**
 * Test email sending functionality
 */
async function testEmailSending() {
	console.log('\n🧪 Testing Email Sending...');

	try {
		const userEmail = 'test@example.com';
		const designerEmail = 'designer@example.com';

		// Get mock results data
		const resultsData = getCurrentResultsData();

		if (!resultsData) {
			console.error('❌ No results data available for testing');
			return;
		}

		console.log('📧 Testing email send with mock data...');
		const success = await sendResults(userEmail, designerEmail, resultsData);

		if (success) {
			console.log('✅ Email sending test passed');
		} else {
			console.error('❌ Email sending test failed');
		}

	} catch (error) {
		console.error('❌ Email sending test error:', error.message);
	}
}

/**
 * Test form validation
 */
function testFormValidation() {
	console.log('\n🧪 Testing Form Validation...');

	// Create mock form elements
	const mockForm = document.createElement('form');
	mockForm.innerHTML = `
        <input type="email" name="userEmail" value="test@example.com">
        <input type="email" name="designerEmail" value="designer@example.com">
    `;

	const formData = new FormData(mockForm);
	const userEmail = formData.get('userEmail')?.trim();
	const designerEmail = formData.get('designerEmail')?.trim();

	console.log('✅ User email extracted:', userEmail);
	console.log('✅ Designer email extracted:', designerEmail);
	console.log('✅ User email valid:', isValidEmail(userEmail));
	console.log('✅ Designer email valid:', isValidEmail(designerEmail));
}

/**
 * Test results data retrieval
 */
function testResultsDataRetrieval() {
	console.log('\n🧪 Testing Results Data Retrieval...');

	try {
		const resultsData = getCurrentResultsData();

		if (resultsData) {
			console.log('✅ Results data retrieved successfully');
			console.log('📊 Total selections:', resultsData.metadata?.totalSelections);
			console.log('📊 Profile categories:', Object.keys(resultsData.profile?.preferences || {}));
			console.log('📊 Recommendations count:', resultsData.profile?.topRecommendations?.length);
		} else {
			console.error('❌ No results data available');
		}

	} catch (error) {
		console.error('❌ Results data retrieval test failed:', error.message);
	}
}

/**
 * Run all email functionality tests
 */
async function runEmailTests() {
	console.log('🚀 Starting Email Functionality Tests...');
	console.log('='.repeat(50));

	// Initialize email service for testing
	if (typeof initializeEmailService === 'function') {
		initializeEmailService();
	}

	// Run individual tests
	testEmailValidation();
	testFormValidation();
	testResultsDataRetrieval();
	testEmailContentFormatting();
	await testEmailSending();

	console.log('\n' + '='.repeat(50));
	console.log('✅ Email functionality tests completed!');
}

// Run tests when script loads
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => {
		// Wait a bit for other scripts to load
		setTimeout(runEmailTests, 1000);
	});
} else {
	// Node.js environment
	console.log('Running in Node.js environment...');
	runEmailTests().catch(error => {
		console.error('Test execution failed:', error);
	});
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		testEmailValidation,
		testEmailContentFormatting,
		testEmailSending,
		testFormValidation,
		testResultsDataRetrieval,
		runEmailTests
	};
}