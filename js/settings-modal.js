/**
 * Settings Modal Module
 * Handles the persistent settings modal that's available throughout the app session
 */

/**
 * Settings modal state
 */
const settingsModal = {
	// DOM elements
	modal: null,
	backdrop: null,
	headerButton: null,
	closeButton: null,
	cancelButton: null,
	saveButton: null,

	// Modal timer controls
	modalSlider: null,
	modalCheckbox: null,
	modalDurationDisplay: null,

	// State
	isOpen: false,
	originalTimerState: null,

	// Configuration
	enableLogging: true
};

/**
 * Initializes the settings modal system
 * @returns {boolean} - True if initialized successfully
 */
function initializeSettingsModal() {
	try {
		// Cache DOM elements
		settingsModal.modal = document.getElementById('settings-modal');
		settingsModal.backdrop = document.getElementById('modal-backdrop');
		settingsModal.headerButton = document.getElementById('header-settings-button');
		settingsModal.closeButton = document.getElementById('modal-close-button');
		settingsModal.cancelButton = document.getElementById('modal-cancel-button');
		settingsModal.saveButton = document.getElementById('modal-save-button');

		// Modal timer controls
		settingsModal.modalSlider = document.getElementById('modal-timer-duration-slider');
		settingsModal.modalCheckbox = document.getElementById('modal-timer-disable-checkbox');
		settingsModal.modalDurationDisplay = document.getElementById('modal-timer-duration-display');

		if (!settingsModal.modal || !settingsModal.headerButton) {
			throw new Error('Required settings modal DOM elements not found');
		}

		// Set up event listeners
		setupSettingsModalListeners();



		if (settingsModal.enableLogging) {
			console.log('✅ Settings modal initialized');
		}

		return true;

	} catch (error) {
		console.error('❌ Failed to initialize settings modal:', error.message);
		return false;
	}
}

/**
 * Sets up event listeners for the settings modal
 */
function setupSettingsModalListeners() {
	// Header settings button
	if (settingsModal.headerButton) {
		settingsModal.headerButton.addEventListener('click', (e) => {
			e.preventDefault();
			openSettingsModal();
		});
	}

	// Close button
	if (settingsModal.closeButton) {
		settingsModal.closeButton.addEventListener('click', (e) => {
			e.preventDefault();
			closeSettingsModal();
		});
	}

	// Cancel button
	if (settingsModal.cancelButton) {
		settingsModal.cancelButton.addEventListener('click', (e) => {
			e.preventDefault();
			closeSettingsModal();
		});
	}

	// Save button
	if (settingsModal.saveButton) {
		settingsModal.saveButton.addEventListener('click', (e) => {
			e.preventDefault();
			saveSettingsModal();
		});
	}

	// Backdrop click to close
	if (settingsModal.backdrop) {
		settingsModal.backdrop.addEventListener('click', (e) => {
			e.preventDefault();
			closeSettingsModal();
		});
	}

	// Escape key to close
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && settingsModal.isOpen) {
			closeSettingsModal();
		}
	});

	// Modal timer controls
	if (settingsModal.modalSlider) {
		settingsModal.modalSlider.addEventListener('input', (e) => {
			const duration = parseInt(e.target.value, 10);
			updateModalTimerDisplay(duration, settingsModal.modalCheckbox?.checked || false);
		});
	}

	if (settingsModal.modalCheckbox) {
		settingsModal.modalCheckbox.addEventListener('change', (e) => {
			const isDisabled = e.target.checked;
			const duration = parseInt(settingsModal.modalSlider?.value || 15, 10);
			updateModalTimerDisplay(duration, isDisabled);
		});
	}
}



/**
 * Opens the settings modal
 */
function openSettingsModal() {
	try {
		if (settingsModal.isOpen) return;

		// Pause any active timers
		pauseAppTimers();

		// Load current settings into modal
		loadCurrentSettingsIntoModal();

		// Show modal
		if (settingsModal.modal) {
			settingsModal.modal.style.display = 'flex';

			// Trigger animation after a brief delay
			setTimeout(() => {
				settingsModal.modal.classList.add('show');
			}, 10);
		}

		// Prevent body scroll
		document.body.style.overflow = 'hidden';

		// Focus management
		if (settingsModal.modalSlider) {
			settingsModal.modalSlider.focus();
		}

		settingsModal.isOpen = true;

		if (settingsModal.enableLogging) {
			console.log('🔧 Settings modal opened');
		}

	} catch (error) {
		console.error('❌ Failed to open settings modal:', error.message);
	}
}

/**
 * Closes the settings modal
 */
function closeSettingsModal() {
	try {
		if (!settingsModal.isOpen) return;

		// Hide modal with animation
		if (settingsModal.modal) {
			settingsModal.modal.classList.remove('show');

			// Hide after animation completes
			setTimeout(() => {
				settingsModal.modal.style.display = 'none';
			}, 300);
		}

		// Restore body scroll
		document.body.style.overflow = '';

		// Resume timers if they were paused
		resumeAppTimers();

		settingsModal.isOpen = false;

		if (settingsModal.enableLogging) {
			console.log('🔧 Settings modal closed');
		}

	} catch (error) {
		console.error('❌ Failed to close settings modal:', error.message);
	}
}

/**
 * Saves the settings from the modal
 */
function saveSettingsModal() {
	try {
		if (!settingsModal.modalSlider || !settingsModal.modalCheckbox) {
			throw new Error('Modal controls not available');
		}

		const duration = parseInt(settingsModal.modalSlider.value, 10);
		const isDisabled = settingsModal.modalCheckbox.checked;

		// Apply settings using the timer config system
		if (typeof setTimerDuration === 'function') {
			setTimerDuration(duration);
		}

		if (typeof setTimerDisabled === 'function') {
			setTimerDisabled(isDisabled);
		}

		// Close modal
		closeSettingsModal();

		if (settingsModal.enableLogging) {
			console.log('💾 Settings saved:', { duration, isDisabled });
		}

	} catch (error) {
		console.error('❌ Failed to save settings:', error.message);
	}
}

/**
 * Loads current timer settings into the modal controls
 */
function loadCurrentSettingsIntoModal() {
	try {
		if (typeof getTimerConfig === 'function') {
			const config = getTimerConfig();

			if (settingsModal.modalSlider) {
				settingsModal.modalSlider.value = config.duration;
			}

			if (settingsModal.modalCheckbox) {
				settingsModal.modalCheckbox.checked = config.isDisabled;
			}

			updateModalTimerDisplay(config.duration, config.isDisabled);

			if (settingsModal.enableLogging) {
				console.log('📁 Loaded settings into modal:', config);
			}
		}
	} catch (error) {
		console.warn('⚠️ Failed to load settings into modal:', error.message);
	}
}

/**
 * Updates the modal timer display
 * @param {number} duration - Timer duration in seconds
 * @param {boolean} isDisabled - Whether timer is disabled
 */
function updateModalTimerDisplay(duration, isDisabled) {
	if (settingsModal.modalDurationDisplay) {
		if (isDisabled) {
			settingsModal.modalDurationDisplay.textContent = '∞';
		} else {
			settingsModal.modalDurationDisplay.textContent = duration;
		}
	}
}

/**
 * Pauses app timers when modal opens
 */
function pauseAppTimers() {
	try {
		// Store original timer state
		if (typeof getTimerState === 'function') {
			settingsModal.originalTimerState = getTimerState();
		}

		// Pause timer if it's running
		if (typeof pauseTimer === 'function') {
			pauseTimer();
		}

		if (settingsModal.enableLogging) {
			console.log('⏸️ App timers paused for settings modal');
		}

	} catch (error) {
		console.warn('⚠️ Failed to pause app timers:', error.message);
	}
}

/**
 * Resumes app timers when modal closes
 */
function resumeAppTimers() {
	try {
		// Only resume if timer was previously active
		if (settingsModal.originalTimerState && settingsModal.originalTimerState.isActive) {
			if (typeof resumeTimer === 'function') {
				resumeTimer();
			}
		}

		// Clear stored state
		settingsModal.originalTimerState = null;

		if (settingsModal.enableLogging) {
			console.log('▶️ App timers resumed after settings modal');
		}

	} catch (error) {
		console.warn('⚠️ Failed to resume app timers:', error.message);
	}
}



/**
 * Gets the current modal state
 * @returns {Object} - Current modal state
 */
function getSettingsModalState() {
	return {
		isOpen: settingsModal.isOpen,
		isInitialized: settingsModal.modal !== null
	};
}

/**
 * Sets up integration with the main app
 */
function setupSettingsModalIntegration() {
	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			initializeSettingsModal();
		});
	} else {
		initializeSettingsModal();
	}


}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		initializeSettingsModal,
		openSettingsModal,
		closeSettingsModal,
		getSettingsModalState,
		setupSettingsModalIntegration
	};
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.initializeSettingsModal = initializeSettingsModal;
	window.openSettingsModal = openSettingsModal;
	window.closeSettingsModal = closeSettingsModal;
	window.getSettingsModalState = getSettingsModalState;
	window.setupSettingsModalIntegration = setupSettingsModalIntegration;
}

// Auto-setup integration
setupSettingsModalIntegration();