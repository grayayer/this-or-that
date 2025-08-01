/**
 * Print Functionality for This or That Results
 * Creates beautiful printed results for design preferences
 * Implements requirement 5.1 alternative: Print results instead of email
 */

/**
 * Initialize print functionality
 * Sets up event handlers and prepares print elements
 */
function initializePrintFunctionality() {
	try {
		console.log('🖨️ Initializing print functionality...');

		// Set up print button handler
		const printButton = document.getElementById('print-results-btn');
		if (printButton) {
			printButton.addEventListener('click', handlePrintResults);
			console.log('✅ Print button handler set up');
		} else {
			console.warn('⚠️ Print button not found');
		}

		// Set up keyboard shortcut (Ctrl+P / Cmd+P)
		document.addEventListener('keydown', handlePrintKeyboard);

		console.log('✅ Print functionality initialized');

	} catch (error) {
		console.error('❌ Failed to initialize print functionality:', error.message);
	}
}

/**
 * Handle print results button click
 * Prepares the page for printing and triggers print dialog
 */
function handlePrintResults() {
	try {
		console.log('🖨️ Preparing results for printing...');

		// Check if results are available
		if (!isResultsAvailable()) {
			console.warn('⚠️ No results available to print');
			alert('Please complete at least 20 choices to generate results for printing.');
			return;
		}

		// Prepare print content
		preparePrintContent();

		// Add print-specific styling
		document.body.classList.add('printing');

		// Show print tip before opening dialog
		showPrintTip();

		// Trigger print dialog
		setTimeout(() => {
			window.print();
		}, 100);

		console.log('✅ Print dialog opened');

	} catch (error) {
		console.error('❌ Failed to print results:', error.message);
		alert('Sorry, there was an error preparing your results for printing. Please try again.');
	}
}

/**
 * Handle keyboard shortcut for printing
 * @param {KeyboardEvent} event - Keyboard event
 */
function handlePrintKeyboard(event) {
	// Check for Ctrl+P (Windows/Linux) or Cmd+P (Mac)
	if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
		// Only handle if results are visible
		const resultsSection = document.getElementById('results-section');
		if (resultsSection && resultsSection.style.display !== 'none') {
			event.preventDefault();
			handlePrintResults();
		}
	}
}

/**
 * Check if results are available for printing
 * @returns {boolean} - Whether results are available
 */
function isResultsAvailable() {
	const resultsSection = document.getElementById('results-section');
	const preferenceCategories = document.getElementById('preference-categories');

	return resultsSection &&
		resultsSection.style.display !== 'none' &&
		preferenceCategories &&
		preferenceCategories.children.length > 0;
}

/**
 * Prepare content specifically for printing
 * Updates print-specific elements with current data
 */
function preparePrintContent() {
	try {
		// Update print date elements
		const currentDate = new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

		const printDateElement = document.getElementById('print-date');
		const printFooterDateElement = document.getElementById('print-footer-date');

		if (printDateElement) {
			printDateElement.textContent = currentDate;
		}

		if (printFooterDateElement) {
			printFooterDateElement.textContent = currentDate;
		}

		// Add print-specific classes to results elements
		const resultsContainer = document.querySelector('.results-container');
		if (resultsContainer) {
			resultsContainer.classList.add('print-ready');
		}

		// Ensure all images are loaded (if any)
		const images = document.querySelectorAll('.results-section img');
		images.forEach(img => {
			if (!img.complete) {
				img.style.display = 'none'; // Hide incomplete images in print
			}
		});

		// Add page break hints for better printing
		addPageBreakHints();

		console.log('✅ Print content prepared');

	} catch (error) {
		console.error('❌ Failed to prepare print content:', error.message);
	}
}

/**
 * Add page break hints for better print layout
 * Helps ensure content doesn't break awkwardly across pages
 */
function addPageBreakHints() {
	try {
		// Add no-page-break class to preference categories
		const preferenceCategories = document.querySelectorAll('.preference-category');
		preferenceCategories.forEach(category => {
			category.classList.add('no-page-break');
		});

		// Add no-page-break class to recommendation items
		const recommendationItems = document.querySelectorAll('.recommendation-item');
		recommendationItems.forEach(item => {
			item.classList.add('no-page-break');
		});

		// Add no-page-break class to insight cards
		const insightCards = document.querySelectorAll('.insight-card');
		insightCards.forEach(card => {
			card.classList.add('no-page-break');
		});

		console.log('✅ Page break hints added');

	} catch (error) {
		console.error('❌ Failed to add page break hints:', error.message);
	}
}

/**
 * Clean up after printing
 * Removes print-specific classes and styling
 */
function cleanupAfterPrint() {
	try {
		// Remove print-specific classes
		document.body.classList.remove('printing');

		const resultsContainer = document.querySelector('.results-container');
		if (resultsContainer) {
			resultsContainer.classList.remove('print-ready');
		}

		// Remove page break classes
		const elementsWithPageBreaks = document.querySelectorAll('.no-page-break');
		elementsWithPageBreaks.forEach(element => {
			element.classList.remove('no-page-break');
		});

		console.log('✅ Print cleanup completed');

	} catch (error) {
		console.error('❌ Failed to cleanup after print:', error.message);
	}
}

/**
 * Generate a printable summary of the results
 * Creates a text summary that can be copied or saved
 * @returns {string} - Text summary of results
 */
function generatePrintableSummary() {
	try {
		if (!window.appState || !window.appState.selections || !window.appState.designs) {
			return 'No results data available.';
		}

		const { selections, designs } = window.appState;
		const analysisResults = analyzeSelections(selections, designs);

		if (!analysisResults) {
			return 'Unable to analyze results.';
		}

		const { metadata, profile } = analysisResults;

		let summary = `THIS OR THAT? - DESIGN PREFERENCE REPORT\n`;
		summary += `${'='.repeat(50)}\n\n`;
		summary += `Generated: ${new Date().toLocaleDateString()}\n`;
		summary += `Total Choices: ${metadata.totalSelections}\n`;
		summary += `Completed: ${new Date(metadata.completedAt).toLocaleDateString()}\n\n`;

		summary += `SUMMARY\n`;
		summary += `${'-'.repeat(20)}\n`;
		summary += `${profile.summary}\n\n`;

		summary += `DESIGN RECOMMENDATIONS\n`;
		summary += `${'-'.repeat(30)}\n`;
		profile.topRecommendations.forEach((rec, index) => {
			summary += `${index + 1}. ${rec}\n`;
		});
		summary += `\n`;

		summary += `PREFERENCE BREAKDOWN\n`;
		summary += `${'-'.repeat(25)}\n`;

		Object.keys(profile.preferences).forEach(category => {
			const categoryData = profile.preferences[category];
			if (categoryData.top.length > 0) {
				const categoryName = formatCategoryName(category);
				summary += `\n${categoryName.toUpperCase()}:\n`;
				categoryData.top.slice(0, 5).forEach(item => {
					summary += `  • ${formatTagForDisplay(item.tag)} (${item.percentage}%)\n`;
				});
			}
		});

		summary += `\n${'='.repeat(50)}\n`;
		summary += `Generated by This or That? - Design Preference Discovery Tool\n`;
		summary += `Design images courtesy of Land-book.com\n`;

		return summary;

	} catch (error) {
		console.error('❌ Failed to generate printable summary:', error.message);
		return 'Error generating summary.';
	}
}

/**
 * Copy results summary to clipboard
 * Provides an alternative way to share results
 */
async function copyResultsToClipboard() {
	try {
		const summary = generatePrintableSummary();

		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(summary);
			console.log('✅ Results copied to clipboard');

			// Show feedback to user
			showCopyFeedback('Results copied to clipboard!');
		} else {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = summary;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			textArea.style.top = '-999999px';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();

			const successful = document.execCommand('copy');
			textArea.remove();

			if (successful) {
				console.log('✅ Results copied to clipboard (fallback)');
				showCopyFeedback('Results copied to clipboard!');
			} else {
				throw new Error('Copy command failed');
			}
		}

	} catch (error) {
		console.error('❌ Failed to copy results to clipboard:', error.message);
		showCopyFeedback('Failed to copy results. Please try printing instead.', 'error');
	}
}

/**
 * Show print tip suggesting PDF save
 * Provides helpful guidance for users about saving as PDF
 */
function showPrintTip() {
	// Create or update print tip element
	let printTipElement = document.getElementById('print-tip');

	if (!printTipElement) {
		printTipElement = document.createElement('div');
		printTipElement.id = 'print-tip';
		printTipElement.style.cssText = `
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: #e3f2fd;
			color: #1565c0;
			border: 1px solid #bbdefb;
			padding: 16px 24px;
			border-radius: 8px;
			font-weight: 500;
			z-index: 1000;
			max-width: 500px;
			text-align: center;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			transition: opacity 0.3s ease;
		`;
		document.body.appendChild(printTipElement);
	}

	printTipElement.innerHTML = `
		<div style="margin-bottom: 8px;">
			<strong>💡 Print Tip:</strong> Save as PDF to easily share your results!
		</div>
		<div style="font-size: 14px; opacity: 0.9;">
			In the print dialog, choose "Save as PDF" as your destination to create a shareable file.
		</div>
	`;

	printTipElement.style.opacity = '1';

	// Hide after 6 seconds
	setTimeout(() => {
		printTipElement.style.opacity = '0';
		setTimeout(() => {
			if (printTipElement.parentNode) {
				printTipElement.parentNode.removeChild(printTipElement);
			}
		}, 300);
	}, 6000);
}

/**
 * Show feedback message for copy operation
 * @param {string} message - Feedback message
 * @param {string} type - Message type ('success' or 'error')
 */
function showCopyFeedback(message, type = 'success') {
	// Create or update feedback element
	let feedbackElement = document.getElementById('copy-feedback');

	if (!feedbackElement) {
		feedbackElement = document.createElement('div');
		feedbackElement.id = 'copy-feedback';
		feedbackElement.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			padding: 12px 20px;
			border-radius: 6px;
			font-weight: 500;
			z-index: 1000;
			transition: opacity 0.3s ease;
		`;
		document.body.appendChild(feedbackElement);
	}

	// Style based on type
	if (type === 'success') {
		feedbackElement.style.backgroundColor = '#d4edda';
		feedbackElement.style.color = '#155724';
		feedbackElement.style.border = '1px solid #c3e6cb';
	} else {
		feedbackElement.style.backgroundColor = '#f8d7da';
		feedbackElement.style.color = '#721c24';
		feedbackElement.style.border = '1px solid #f5c6cb';
	}

	feedbackElement.textContent = message;
	feedbackElement.style.opacity = '1';

	// Hide after 3 seconds
	setTimeout(() => {
		feedbackElement.style.opacity = '0';
		setTimeout(() => {
			if (feedbackElement.parentNode) {
				feedbackElement.parentNode.removeChild(feedbackElement);
			}
		}, 300);
	}, 3000);
}

// Set up print event listeners
if (typeof window !== 'undefined') {
	// Listen for print events to clean up
	window.addEventListener('beforeprint', () => {
		console.log('🖨️ Print dialog opening...');
		preparePrintContent();
	});

	window.addEventListener('afterprint', () => {
		console.log('🖨️ Print dialog closed');
		cleanupAfterPrint();
	});

	// Initialize when DOM is loaded
	document.addEventListener('DOMContentLoaded', initializePrintFunctionality);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		initializePrintFunctionality,
		handlePrintResults,
		preparePrintContent,
		generatePrintableSummary,
		copyResultsToClipboard,
		isResultsAvailable
	};
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.initializePrintFunctionality = initializePrintFunctionality;
	window.handlePrintResults = handlePrintResults;
	window.generatePrintableSummary = generatePrintableSummary;
	window.copyResultsToClipboard = copyResultsToClipboard;
}