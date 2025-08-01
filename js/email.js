/**
 * Email Functionality for Results Sharing
 * Implements client-side email sending using EmailJS
 * Implements requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a free EmailJS account at https://www.emailjs.com/
 * 2. Connect an email service (Gmail, Outlook, Yahoo, etc.) in your EmailJS dashboard
 * 3. Create an email template with these required variables:
 *    - {{to_email}}, {{cc_email}}, {{user_name}}, {{total_choices}}, {{completed_date}}
 *    - {{message_html}}, {{message_text}} (for the actual results content)
 * 4. Update EMAIL_CONFIG below with your actual service ID, template ID, and public key
 * 5. Set DEVELOPMENT_MODE to false to enable real email sending
 * 6. Test with testEmailJSConfiguration() in browser console
 *
 * See EMAILJS-SETUP-GUIDE.md for detailed step-by-step instructions.
 */

// EmailJS configuration - UPDATE THESE WITH YOUR ACTUAL EMAILJS ACCOUNT DETAILS
const EMAIL_CONFIG = {
	serviceId: 'service_this_or_that', // Replace with your EmailJS Service ID (e.g., 'service_abc123')
	templateId: 'template_results',    // Replace with your EmailJS Template ID (e.g., 'template_xyz789')
	publicKey: 'your_public_key_here'  // Replace with your EmailJS Public Key (e.g., 'user_abc123xyz')
};

// Development mode flag - set to false when using real EmailJS account
// When true: uses mock email service for testing
// When false: sends real emails via EmailJS
const DEVELOPMENT_MODE = true;

// Email service state
let emailServiceInitialized = false;
let emailServiceAvailable = false;

/**
 * Initialize EmailJS service
 * Implements requirement 5.1: Set up email service integration
 */
function initializeEmailService() {
	try {
		console.log('📧 Initializing email service...');

		// Check if EmailJS is available (would be loaded from CDN in production)
		if (typeof emailjs !== 'undefined' && !DEVELOPMENT_MODE) {
			emailjs.init(EMAIL_CONFIG.publicKey);
			emailServiceInitialized = true;
			emailServiceAvailable = true;
			console.log('✅ EmailJS service initialized successfully');
		} else {
			// For development/testing, simulate email service
			console.log('⚠️ Running in development mode - using mock email service');
			emailServiceInitialized = true;
			emailServiceAvailable = false; // Will use mock sending
		}

		// Set up email form handlers
		setupEmailFormHandlers();

	} catch (error) {
		console.error('❌ Failed to initialize email service:', error.message);
		emailServiceInitialized = false;
		emailServiceAvailable = false;
	}
}

/**
 * Set up email form event handlers
 * Implements requirement 5.2, 5.3: Allow entry of user and designer email addresses
 */
function setupEmailFormHandlers() {
	try {
		// Email results button handler
		const emailResultsBtn = document.getElementById('email-results-btn');
		if (emailResultsBtn) {
			emailResultsBtn.addEventListener('click', showEmailForm);
		}

		// Email form submission handler
		const emailForm = document.getElementById('email-form');
		if (emailForm) {
			emailForm.addEventListener('submit', handleEmailFormSubmission);
		}

		// Cancel email button handler
		const cancelEmailBtn = document.getElementById('cancel-email-btn');
		if (cancelEmailBtn) {
			cancelEmailBtn.addEventListener('click', hideEmailForm);
		}

		// Email input validation
		const userEmailInput = document.getElementById('user-email');
		const designerEmailInput = document.getElementById('designer-email');

		if (userEmailInput) {
			userEmailInput.addEventListener('blur', validateEmailInput);
			userEmailInput.addEventListener('input', clearEmailError);
		}

		if (designerEmailInput) {
			designerEmailInput.addEventListener('blur', validateEmailInput);
			designerEmailInput.addEventListener('input', clearEmailError);
		}

		console.log('✅ Email form handlers set up successfully');

	} catch (error) {
		console.error('❌ Failed to set up email form handlers:', error.message);
	}
}

/**
 * Show the email form section
 * Implements requirement 5.1: Provide option to email results
 */
function showEmailForm() {
	try {
		const emailSection = document.getElementById('email-section');
		const resultsSection = document.getElementById('results-section');

		if (emailSection && resultsSection) {
			// Hide results section and show email form
			resultsSection.style.display = 'none';
			emailSection.style.display = 'block';

			// Focus on the user email input
			const userEmailInput = document.getElementById('user-email');
			if (userEmailInput) {
				setTimeout(() => userEmailInput.focus(), 100);
			}

			// Clear any previous status messages
			clearEmailStatus();

			console.log('📧 Email form displayed');
		}

	} catch (error) {
		console.error('❌ Failed to show email form:', error.message);
		showEmailError('Unable to display email form. Please try again.');
	}
}

/**
 * Hide the email form and return to results
 */
function hideEmailForm() {
	try {
		const emailSection = document.getElementById('email-section');
		const resultsSection = document.getElementById('results-section');

		if (emailSection && resultsSection) {
			emailSection.style.display = 'none';
			resultsSection.style.display = 'block';

			// Clear form data
			const emailForm = document.getElementById('email-form');
			if (emailForm) {
				emailForm.reset();
			}

			clearEmailStatus();
			console.log('📧 Email form hidden');
		}

	} catch (error) {
		console.error('❌ Failed to hide email form:', error.message);
	}
}

/**
 * Handle email form submission
 * Implements requirement 5.4: Include complete design preference profile in email
 * @param {Event} event - Form submission event
 */
async function handleEmailFormSubmission(event) {
	event.preventDefault();

	try {
		console.log('📧 Processing email form submission...');

		// Get form data
		const formData = new FormData(event.target);
		const userEmail = formData.get('userEmail')?.trim();
		const designerEmail = formData.get('designerEmail')?.trim();

		// Validate required fields
		if (!userEmail) {
			showEmailError('Please enter your email address.');
			return;
		}

		if (!isValidEmail(userEmail)) {
			showEmailError('Please enter a valid email address.');
			return;
		}

		if (designerEmail && !isValidEmail(designerEmail)) {
			showEmailError('Please enter a valid designer email address.');
			return;
		}

		// Get current results data
		const resultsData = getCurrentResultsData();
		if (!resultsData) {
			showEmailError('No results data available to send. Please complete the assessment first.');
			return;
		}

		// Show sending status
		showEmailStatus('Sending your results...', 'sending');

		// Send the email
		const success = await sendResults(userEmail, designerEmail, resultsData);

		if (success) {
			// Implements requirement 5.7: Confirm delivery to user
			showEmailStatus('Results sent successfully! Check your email.', 'success');

			// Clear form after successful send
			setTimeout(() => {
				const emailForm = document.getElementById('email-form');
				if (emailForm) {
					emailForm.reset();
				}
			}, 2000);

		} else {
			// Implements requirement 5.6: Display error message when email fails
			showEmailError('Failed to send email. Please try again or check your email addresses.');
		}

	} catch (error) {
		console.error('❌ Email form submission failed:', error.message);
		showEmailError('An error occurred while sending your results. Please try again.');
	}
}

/**
 * Send results via email
 * Implements requirement 5.4: Send complete design preference profile
 * @param {string} userEmail - User's email address
 * @param {string} designerEmail - Designer's email address (optional)
 * @param {Object} resultsData - Complete results data
 * @returns {Promise<boolean>} - Success status
 */
async function sendResults(userEmail, designerEmail, resultsData) {
	try {
		console.log('📧 Sending results email...');

		// Format email content
		const emailContent = formatEmailContent(resultsData);

		// Prepare email parameters
		const emailParams = {
			to_email: userEmail,
			cc_email: designerEmail || '',
			subject: 'Your Design Preference Profile - This or That Results',
			message_html: emailContent.html,
			message_text: emailContent.text,
			user_name: 'Design Preference User',
			total_choices: resultsData.metadata?.totalSelections || 0,
			completed_date: new Date().toLocaleDateString()
		};

		// Send email based on service availability
		if (emailServiceAvailable && typeof emailjs !== 'undefined') {
			// Use actual EmailJS service
			const response = await emailjs.send(
				EMAIL_CONFIG.serviceId,
				EMAIL_CONFIG.templateId,
				emailParams
			);

			console.log('✅ Email sent successfully via EmailJS:', response);
			return true;

		} else {
			// Use mock email service for development
			console.log('📧 Mock email service - would send email with params:');
			console.log('   To:', emailParams.to_email);
			console.log('   CC:', emailParams.cc_email || 'None');
			console.log('   Subject:', emailParams.subject);
			console.log('   Total Choices:', emailParams.total_choices);
			console.log('   HTML Length:', emailParams.message_html.length, 'characters');
			console.log('   Text Length:', emailParams.message_text.length, 'characters');

			// Simulate network delay
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Simulate success (in production, this would be actual email sending)
			console.log('✅ Mock email sent successfully - check console for email content');

			// In development, also log the email content for verification
			if (DEVELOPMENT_MODE) {
				console.log('\n📧 EMAIL CONTENT PREVIEW:');
				console.log('HTML Content:', emailParams.message_html.substring(0, 200) + '...');
				console.log('Text Content:', emailParams.message_text.substring(0, 200) + '...');
			}

			return true;
		}

	} catch (error) {
		console.error('❌ Failed to send email:', error.message);
		return false;
	}
}

/**
 * Format email content for professional presentation
 * Implements requirement 5.5: Format results in professional, readable format
 * @param {Object} resultsData - Complete results data
 * @returns {Object} - Formatted email content with HTML and text versions
 */
function formatEmailContent(resultsData) {
	try {
		const { metadata, profile } = resultsData;

		// Generate HTML version
		const htmlContent = generateEmailHTML(resultsData);

		// Generate plain text version
		const textContent = generateEmailText(resultsData);

		return {
			html: htmlContent,
			text: textContent
		};

	} catch (error) {
		console.error('❌ Failed to format email content:', error.message);

		// Fallback content
		return {
			html: '<p>Your design preference results are ready, but there was an error formatting the content.</p>',
			text: 'Your design preference results are ready, but there was an error formatting the content.'
		};
	}
}

/**
 * Generate HTML email content
 * @param {Object} resultsData - Complete results data
 * @returns {string} - HTML email content
 */
function generateEmailHTML(resultsData) {
	const { metadata, profile } = resultsData;

	// Generate preference categories HTML
	const categoriesHTML = Object.keys(profile.preferences).map(category => {
		const categoryData = profile.preferences[category];
		const strengthData = profile.strengthScores[category];

		if (categoryData.top.length === 0) return '';

		const categoryName = formatCategoryName(category);
		const topItems = categoryData.top.slice(0, 3); // Top 3 for email

		return `
            <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
                    ${getCategoryIcon(category)} ${categoryName}
                </h3>
                <p style="color: #666; margin: 0 0 15px 0; font-size: 14px;">
                    ${strengthData.description}
                </p>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${topItems.map(item => `
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                            <span style="color: #333; font-weight: 500;">${formatTagForDisplay(item.tag)}</span>
                            <span style="color: #666; font-size: 14px;">${item.percentage}%</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
	}).filter(html => html !== '').join('');

	// Generate recommendations HTML
	const recommendationsHTML = profile.topRecommendations.map(rec =>
		`<li style="margin-bottom: 8px; color: #333;">${rec}</li>`
	).join('');

	return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Design Preference Profile</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

            <header style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e9ecef;">
                <h1 style="color: #333; margin: 0 0 10px 0; font-size: 28px;">Your Design Preference Profile</h1>
                <p style="color: #666; margin: 0; font-size: 16px;">
                    Based on ${metadata.totalSelections} choices • Completed ${new Date(metadata.completedAt).toLocaleDateString()}
                </p>
            </header>

            <section style="margin-bottom: 40px;">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 22px;">Summary</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 0;">
                    ${profile.summary}
                </p>
            </section>

            <section style="margin-bottom: 40px;">
                <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Design Direction Recommendations</h2>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${recommendationsHTML}
                </ul>
            </section>

            <section style="margin-bottom: 40px;">
                <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Your Preferences by Category</h2>
                ${categoriesHTML}
            </section>

            <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 14px;">
                <p>Generated by <strong>This or That?</strong> - Design Preference Discovery Tool</p>
                <p>Design images courtesy of <a href="https://land-book.com" style="color: #007bff;">Land-book.com</a></p>
            </footer>

        </body>
        </html>
    `;
}

/**
 * Generate plain text email content
 * @param {Object} resultsData - Complete results data
 * @returns {string} - Plain text email content
 */
function generateEmailText(resultsData) {
	const { metadata, profile } = resultsData;

	let textContent = `YOUR DESIGN PREFERENCE PROFILE\n`;
	textContent += `${'='.repeat(35)}\n\n`;
	textContent += `Based on ${metadata.totalSelections} choices\n`;
	textContent += `Completed: ${new Date(metadata.completedAt).toLocaleDateString()}\n\n`;

	textContent += `SUMMARY\n`;
	textContent += `${'-'.repeat(10)}\n`;
	textContent += `${profile.summary}\n\n`;

	textContent += `DESIGN DIRECTION RECOMMENDATIONS\n`;
	textContent += `${'-'.repeat(35)}\n`;
	profile.topRecommendations.forEach((rec, index) => {
		textContent += `${index + 1}. ${rec}\n`;
	});
	textContent += `\n`;

	textContent += `YOUR PREFERENCES BY CATEGORY\n`;
	textContent += `${'-'.repeat(30)}\n\n`;

	Object.keys(profile.preferences).forEach(category => {
		const categoryData = profile.preferences[category];
		const strengthData = profile.strengthScores[category];

		if (categoryData.top.length === 0) return;

		const categoryName = formatCategoryName(category);
		textContent += `${categoryName.toUpperCase()}\n`;
		textContent += `${strengthData.description}\n`;

		categoryData.top.slice(0, 3).forEach(item => {
			textContent += `  • ${formatTagForDisplay(item.tag)} (${item.percentage}%)\n`;
		});
		textContent += `\n`;
	});

	textContent += `Generated by This or That? - Design Preference Discovery Tool\n`;
	textContent += `Design images courtesy of Land-book.com\n`;

	return textContent;
}

/**
 * Get current results data from the application state
 * @returns {Object|null} - Current results data or null if not available
 */
function getCurrentResultsData() {
	try {
		// Check if app state is available
		if (typeof window !== 'undefined' && window.appState) {
			const { selections, designs } = window.appState;

			if (selections && selections.length > 0 && designs && designs.length > 0) {
				// Generate fresh results
				const analysisResults = analyzeSelections(selections, designs);
				return analysisResults;
			}
		}

		console.warn('⚠️ No results data available in app state');
		return null;

	} catch (error) {
		console.error('❌ Failed to get current results data:', error.message);
		return null;
	}
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate email input field
 * @param {Event} event - Input blur event
 */
function validateEmailInput(event) {
	const input = event.target;
	const email = input.value.trim();

	if (email && !isValidEmail(email)) {
		input.classList.add('error');
		showFieldError(input, 'Please enter a valid email address');
	} else {
		input.classList.remove('error');
		clearFieldError(input);
	}
}

/**
 * Clear email input error on typing
 * @param {Event} event - Input event
 */
function clearEmailError(event) {
	const input = event.target;
	input.classList.remove('error');
	clearFieldError(input);
}

/**
 * Show field-specific error message
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message
 */
function showFieldError(input, message) {
	// Remove existing error message
	clearFieldError(input);

	// Create error message element
	const errorElement = document.createElement('div');
	errorElement.className = 'field-error';
	errorElement.textContent = message;
	errorElement.style.color = '#dc3545';
	errorElement.style.fontSize = '14px';
	errorElement.style.marginTop = '5px';

	// Insert after input
	input.parentNode.insertBefore(errorElement, input.nextSibling);
}

/**
 * Clear field-specific error message
 * @param {HTMLElement} input - Input element
 */
function clearFieldError(input) {
	const errorElement = input.parentNode.querySelector('.field-error');
	if (errorElement) {
		errorElement.remove();
	}
}

/**
 * Show email status message
 * @param {string} message - Status message
 * @param {string} type - Status type ('sending', 'success', 'error')
 */
function showEmailStatus(message, type = 'info') {
	const statusElement = document.getElementById('email-status');
	if (statusElement) {
		statusElement.textContent = message;
		statusElement.className = `email-status ${type}`;
		statusElement.style.display = 'block';
	}
}

/**
 * Show email error message
 * @param {string} message - Error message
 */
function showEmailError(message) {
	showEmailStatus(message, 'error');
}

/**
 * Clear email status message
 */
function clearEmailStatus() {
	const statusElement = document.getElementById('email-status');
	if (statusElement) {
		statusElement.textContent = '';
		statusElement.className = 'email-status';
		statusElement.style.display = 'none';
	}
}

// Helper functions from results.js (duplicated here for email formatting)
function formatCategoryName(category) {
	const categoryNames = {
		style: 'Visual Style',
		industry: 'Industry Focus',
		typography: 'Typography',
		type: 'Project Type',
		category: 'Site Category',
		platform: 'Technology Platform',
		colors: 'Color Preferences'
	};
	return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function getCategoryIcon(category) {
	const icons = {
		style: '🎨',
		industry: '🏢',
		typography: '📝',
		type: '🔧',
		category: '📂',
		platform: '💻',
		colors: '🌈'
	};
	return icons[category] || '📊';
}

function formatTagForDisplay(tag) {
	if (tag.startsWith('#')) {
		return tag.toUpperCase();
	}
	return tag.split(/[\s&]+/).map(word =>
		word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
	).join(' ');
}

// Initialize email service when DOM is loaded
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', initializeEmailService);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		initializeEmailService,
		setupEmailFormHandlers,
		sendResults,
		formatEmailContent,
		showEmailForm,
		hideEmailForm,
		isValidEmail,
		getCurrentResultsData
	};
}

/**
 * Test EmailJS configuration with a simple test email
 * Call this function from browser console to test your EmailJS setup
 */
function testEmailJSConfiguration() {
	if (DEVELOPMENT_MODE) {
		console.log('⚠️ Cannot test EmailJS in development mode. Set DEVELOPMENT_MODE to false first.');
		return;
	}

	if (typeof emailjs === 'undefined') {
		console.error('❌ EmailJS not loaded. Make sure the CDN script is included.');
		return;
	}

	const testParams = {
		to_email: 'test@example.com',
		cc_email: '',
		subject: 'EmailJS Configuration Test',
		message_html: '<p>This is a test email to verify EmailJS configuration.</p>',
		message_text: 'This is a test email to verify EmailJS configuration.',
		user_name: 'Test User',
		total_choices: 0,
		completed_date: new Date().toLocaleDateString()
	};

	console.log('🧪 Testing EmailJS configuration...');

	emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, testParams)
		.then(response => {
			console.log('✅ EmailJS test successful!', response);
		})
		.catch(error => {
			console.error('❌ EmailJS test failed:', error);
			console.log('💡 Check your service ID, template ID, and public key in EMAIL_CONFIG');
		});
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.initializeEmailService = initializeEmailService;
	window.sendResults = sendResults;
	window.formatEmailContent = formatEmailContent;
	window.showEmailForm = showEmailForm;
	window.hideEmailForm = hideEmailForm;
	window.testEmailJSConfiguration = testEmailJSConfiguration;
}