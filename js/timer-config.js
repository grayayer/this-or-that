/**
 * Timer Configuration Module
 * Handles user preferences for timer duration and disable option
 */

/**
 * Timer configuration state
 */
const timerConfig = {
	// Default values
	defaultDuration: 15,
	minDuration: 15,
	maxDuration: 60,
	step: 5,

	// Current settings
	duration: 15,
	isDisabled: false,
	isConfigVisible: false,

	// Storage key
	storageKey: 'thisOrThat_timerConfig',

	// DOM elements (cached for performance)
	slider: null,
	checkbox: null,
	durationDisplay: null,
	configContainer: null,
	toggleButton: null,

	// Callbacks
	onConfigChange: null
};

/**
 * Initializes the timer configuration system
 * @param {Object} options - Configuration options
 * @param {Function} options.onConfigChange - Callback when config changes
 * @returns {boolean} - True if initialized successfully
 */
function initializeTimerConfig(options = {}) {
	try {
		// Set up callbacks
		timerConfig.onConfigChange = options.onConfigChange || null;

		// Cache DOM elements
		timerConfig.slider = document.getElementById('timer-duration-slider');
		timerConfig.checkbox = document.getElementById('timer-disable-checkbox');
		timerConfig.durationDisplay = document.getElementById('timer-duration-display');
		timerConfig.configContainer = document.getElementById('timer-config');
		timerConfig.toggleButton = document.getElementById('timer-config-button');

		if (!timerConfig.slider || !timerConfig.checkbox || !timerConfig.durationDisplay) {
			throw new Error('Required timer configuration DOM elements not found');
		}

		// Load saved configuration
		loadTimerConfig();

		// Set up event listeners
		setupTimerConfigListeners();

		// Apply initial state
		updateTimerConfigDisplay();

		console.log('✅ Timer configuration initialized');
		return true;

	} catch (error) {
		console.error('❌ Failed to initialize timer configuration:', error.message);
		return false;
	}
}

/**
 * Loads timer configuration from localStorage
 */
function loadTimerConfig() {
	try {
		const saved = localStorage.getItem(timerConfig.storageKey);
		if (saved) {
			const config = JSON.parse(saved);

			// Validate and apply saved configuration
			if (typeof config.duration === 'number' &&
				config.duration >= timerConfig.minDuration &&
				config.duration <= timerConfig.maxDuration) {
				timerConfig.duration = config.duration;
			}

			if (typeof config.isDisabled === 'boolean') {
				timerConfig.isDisabled = config.isDisabled;
			}

			// Load visibility state (default to false for better UX)
			if (typeof config.isConfigVisible === 'boolean') {
				timerConfig.isConfigVisible = config.isConfigVisible;
			} else {
				timerConfig.isConfigVisible = false; // Default to hidden
			}

			console.log('📁 Loaded timer config:', {
				duration: timerConfig.duration,
				disabled: timerConfig.isDisabled,
				visible: timerConfig.isConfigVisible
			});
		}
	} catch (error) {
		console.warn('⚠️ Failed to load timer configuration, using defaults:', error.message);
		// Reset to defaults on error
		timerConfig.duration = timerConfig.defaultDuration;
		timerConfig.isDisabled = false;
		timerConfig.isConfigVisible = false;
	}
}

/**
 * Saves timer configuration to localStorage
 */
function saveTimerConfig() {
	try {
		const config = {
			duration: timerConfig.duration,
			isDisabled: timerConfig.isDisabled,
			isConfigVisible: timerConfig.isConfigVisible,
			timestamp: Date.now()
		};

		localStorage.setItem(timerConfig.storageKey, JSON.stringify(config));
		console.log('💾 Saved timer config:', config);

	} catch (error) {
		console.warn('⚠️ Failed to save timer configuration:', error.message);
	}
}

/**
 * Saves just the visibility state (separate from main config)
 */
function saveTimerConfigVisibility() {
	try {
		// Get existing config
		const existing = localStorage.getItem(timerConfig.storageKey);
		let config = existing ? JSON.parse(existing) : {};

		// Update visibility
		config.isConfigVisible = timerConfig.isConfigVisible;
		config.timestamp = Date.now();

		localStorage.setItem(timerConfig.storageKey, JSON.stringify(config));

	} catch (error) {
		console.warn('⚠️ Failed to save timer config visibility:', error.message);
	}
}

/**
 * Sets up event listeners for timer configuration controls
 */
function setupTimerConfigListeners() {
	// Toggle button handler
	const toggleButton = document.getElementById('timer-config-button');
	const configPanel = document.getElementById('timer-config');

	if (toggleButton && configPanel) {
		toggleButton.addEventListener('click', (e) => {
			e.preventDefault();
			toggleTimerConfig();
		});
	}

	// Slider change handler
	timerConfig.slider.addEventListener('input', (e) => {
		if (!timerConfig.isDisabled) {
			const newDuration = parseInt(e.target.value, 10);
			setTimerDuration(newDuration);
		}
	});

	// Checkbox change handler
	timerConfig.checkbox.addEventListener('change', (e) => {
		const isDisabled = e.target.checked;
		setTimerDisabled(isDisabled);
	});

	// Prevent form submission if inside a form
	if (timerConfig.slider.form) {
		timerConfig.slider.form.addEventListener('submit', (e) => {
			e.preventDefault();
		});
	}
}

/**
 * Sets the timer duration
 * @param {number} duration - Duration in seconds
 */
function setTimerDuration(duration) {
	// Validate duration
	const validDuration = Math.max(
		timerConfig.minDuration,
		Math.min(timerConfig.maxDuration, duration)
	);

	// Round to nearest step
	const steppedDuration = Math.round(validDuration / timerConfig.step) * timerConfig.step;

	if (timerConfig.duration !== steppedDuration) {
		timerConfig.duration = steppedDuration;

		// Update display and save
		updateTimerConfigDisplay();
		saveTimerConfig();

		// Notify callback
		if (timerConfig.onConfigChange) {
			timerConfig.onConfigChange({
				duration: timerConfig.duration,
				isDisabled: timerConfig.isDisabled
			});
		}

		console.log('⏱️ Timer duration changed to:', timerConfig.duration);
	}
}

/**
 * Sets the timer disabled state
 * @param {boolean} isDisabled - Whether timer should be disabled
 */
function setTimerDisabled(isDisabled) {
	if (timerConfig.isDisabled !== isDisabled) {
		timerConfig.isDisabled = isDisabled;

		// Update display and save
		updateTimerConfigDisplay();
		saveTimerConfig();

		// Notify callback
		if (timerConfig.onConfigChange) {
			timerConfig.onConfigChange({
				duration: timerConfig.duration,
				isDisabled: timerConfig.isDisabled
			});
		}

		console.log('⏱️ Timer disabled state changed to:', timerConfig.isDisabled);
	}
}

/**
 * Toggles the visibility of the timer configuration panel
 */
function toggleTimerConfig() {
	try {
		timerConfig.isConfigVisible = !timerConfig.isConfigVisible;

		// Update DOM elements
		if (timerConfig.configContainer && timerConfig.toggleButton) {
			if (timerConfig.isConfigVisible) {
				// Show the config panel
				timerConfig.configContainer.style.display = 'block';
				timerConfig.toggleButton.setAttribute('aria-expanded', 'true');

				// Add show class for animation after a brief delay
				setTimeout(() => {
					timerConfig.configContainer.classList.add('show');
				}, 10);

				console.log('👁️ Timer configuration panel opened');
			} else {
				// Hide the config panel
				timerConfig.configContainer.classList.remove('show');
				timerConfig.toggleButton.setAttribute('aria-expanded', 'false');

				// Hide after animation completes
				setTimeout(() => {
					timerConfig.configContainer.style.display = 'none';
				}, 300);

				console.log('👁️ Timer configuration panel closed');
			}
		}

		// Save the visibility state
		saveTimerConfigVisibility();

	} catch (error) {
		console.warn('⚠️ Failed to toggle timer configuration:', error.message);
	}
}

/**
 * Updates the timer configuration display
 */
function updateTimerConfigDisplay() {
	try {
		// Update slider value
		if (timerConfig.slider) {
			timerConfig.slider.value = timerConfig.duration;
		}

		// Update checkbox state
		if (timerConfig.checkbox) {
			timerConfig.checkbox.checked = timerConfig.isDisabled;
		}

		// Update duration display text
		if (timerConfig.durationDisplay) {
			if (timerConfig.isDisabled) {
				timerConfig.durationDisplay.textContent = '∞';
				timerConfig.durationDisplay.title = 'Timer disabled - no time limit';
			} else {
				timerConfig.durationDisplay.textContent = timerConfig.duration;
				timerConfig.durationDisplay.title = `${timerConfig.duration} seconds per choice`;
			}
		}

		// Update container visual state
		if (timerConfig.configContainer) {
			timerConfig.configContainer.classList.toggle('timer-disabled', timerConfig.isDisabled);
		}

		// Update toggle button and panel visibility
		if (timerConfig.toggleButton && timerConfig.configContainer) {
			timerConfig.toggleButton.setAttribute('aria-expanded', timerConfig.isConfigVisible.toString());

			if (timerConfig.isConfigVisible) {
				timerConfig.configContainer.style.display = 'block';
				timerConfig.configContainer.classList.add('show');
			} else {
				timerConfig.configContainer.style.display = 'none';
				timerConfig.configContainer.classList.remove('show');
			}
		}

		// Update the instruction text
		const instructionText = timerConfig.durationDisplay?.parentElement;
		if (instructionText) {
			const baseText = timerConfig.isDisabled
				? 'Take your time with each choice - no time limit!'
				: `You have ${timerConfig.duration} seconds per choice - trust your instincts!`;

			// Update only the text content, preserving the span element
			const textNodes = Array.from(instructionText.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
			if (textNodes.length > 0) {
				textNodes[0].textContent = timerConfig.isDisabled
					? 'Take your time with each choice - '
					: 'You have ';

				if (textNodes.length > 1) {
					textNodes[1].textContent = timerConfig.isDisabled
						? ''
						: ' seconds per choice - trust your instincts!';
				}
			}
		}

	} catch (error) {
		console.warn('⚠️ Failed to update timer config display:', error.message);
	}
}

/**
 * Gets the current timer configuration
 * @returns {Object} - Current timer configuration
 */
function getTimerConfig() {
	return {
		duration: timerConfig.duration,
		isDisabled: timerConfig.isDisabled,
		isConfigVisible: timerConfig.isConfigVisible,
		minDuration: timerConfig.minDuration,
		maxDuration: timerConfig.maxDuration,
		step: timerConfig.step
	};
}

/**
 * Resets timer configuration to defaults
 */
function resetTimerConfig() {
	timerConfig.duration = timerConfig.defaultDuration;
	timerConfig.isDisabled = false;
	timerConfig.isConfigVisible = false;

	updateTimerConfigDisplay();
	saveTimerConfig();

	if (timerConfig.onConfigChange) {
		timerConfig.onConfigChange({
			duration: timerConfig.duration,
			isDisabled: timerConfig.isDisabled
		});
	}

	console.log('🔄 Timer configuration reset to defaults');
}

/**
 * Validates timer configuration values
 * @param {Object} config - Configuration to validate
 * @returns {boolean} - True if valid
 */
function validateTimerConfig(config) {
	if (!config || typeof config !== 'object') {
		return false;
	}

	if (typeof config.duration !== 'number' ||
		config.duration < timerConfig.minDuration ||
		config.duration > timerConfig.maxDuration) {
		return false;
	}

	if (typeof config.isDisabled !== 'boolean') {
		return false;
	}

	return true;
}

/**
 * Sets up integration with the main timer system
 */
function setupTimerConfigIntegration() {
	// Initialize timer config when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			initializeTimerConfig({
				onConfigChange: (config) => {
					// Update the main timer system when config changes
					if (typeof timerState !== 'undefined') {
						timerState.duration = config.duration;

						// If timer is currently running and config changed, restart with new duration
						if (timerState.isActive && !config.isDisabled) {
							if (typeof resetTimer === 'function') {
								resetTimer(true); // Auto-start with new duration
							}
						} else if (config.isDisabled && timerState.isActive) {
							// Stop timer if disabled
							if (typeof stopTimer === 'function') {
								stopTimer();
							}
						}
					}

					console.log('🔄 Timer system updated with new config:', config);
				}
			});
		});
	} else {
		// DOM already ready
		initializeTimerConfig({
			onConfigChange: (config) => {
				if (typeof timerState !== 'undefined') {
					timerState.duration = config.duration;

					if (timerState.isActive && !config.isDisabled) {
						if (typeof resetTimer === 'function') {
							resetTimer(true);
						}
					} else if (config.isDisabled && timerState.isActive) {
						if (typeof stopTimer === 'function') {
							stopTimer();
						}
					}
				}

				console.log('🔄 Timer system updated with new config:', config);
			}
		});
	}
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		initializeTimerConfig,
		getTimerConfig,
		setTimerDuration,
		setTimerDisabled,
		toggleTimerConfig,
		resetTimerConfig,
		setupTimerConfigIntegration
	};
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.initializeTimerConfig = initializeTimerConfig;
	window.getTimerConfig = getTimerConfig;
	window.setTimerDuration = setTimerDuration;
	window.setTimerDisabled = setTimerDisabled;
	window.toggleTimerConfig = toggleTimerConfig;
	window.resetTimerConfig = resetTimerConfig;
	window.setupTimerConfigIntegration = setupTimerConfigIntegration;
}

// Auto-setup integration
setupTimerConfigIntegration();