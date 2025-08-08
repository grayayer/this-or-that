/**
 * Timer Component for "This or That?" Application
 * Manages 15-second countdown with visual feedback and automatic progression
 */

/**
 * Timer state and configuration
 */
const timerState = {
	// Timer configuration
	duration: 15,              // Timer duration in seconds
	currentTime: 15,           // Current remaining time
	isActive: false,           // Whether timer is currently running
	isPaused: false,           // Whether timer is paused

	// Timer internals
	intervalId: null,          // setInterval ID for cleanup
	startTimestamp: null,      // When timer was started (for accuracy)

	// Callbacks
	onTimeout: null,           // Function to call when timer expires
	onTick: null,              // Function to call each second
	onStart: null,             // Function to call when timer starts
	onStop: null,              // Function to call when timer stops
	onReset: null,             // Function to call when timer resets

	// DOM elements (cached for performance)
	progressBarElement: null,
	displayElement: null,

	// Configuration
	enableLogging: true
};

/**
 * Initializes the timer component
 * Sets up DOM element references and default callbacks
 * @param {Object} options - Configuration options
 * @param {number} options.duration - Timer duration in seconds (default: 15)
 * @param {Function} options.onTimeout - Callback when timer expires
 * @param {Function} options.onTick - Callback for each second
 * @param {boolean} options.enableLogging - Enable console logging
 */
function initializeTimer(options = {}) {
	try {
		// Get configured duration if available
		let defaultDuration = options.duration || 15;
		if (typeof getTimerConfig === 'function') {
			const config = getTimerConfig();
			defaultDuration = config.duration;
		}

		// Update configuration
		timerState.duration = defaultDuration;
		timerState.currentTime = timerState.duration;
		timerState.onTimeout = options.onTimeout || defaultTimeoutHandler;
		timerState.onTick = options.onTick || null;
		timerState.onStart = options.onStart || null;
		timerState.onStop = options.onStop || null;
		timerState.onReset = options.onReset || null;
		timerState.enableLogging = options.enableLogging !== false;

		// Cache DOM elements
		timerState.progressBarElement = document.getElementById('timer-progress-bar');
		timerState.displayElement = document.getElementById('timer-display');

		if (!timerState.progressBarElement || !timerState.displayElement) {
			throw new Error('Required timer DOM elements not found');
		}

		// Initialize display
		updateTimerDisplay();
		updateProgressBar();

		if (timerState.enableLogging) {
			console.log('✅ Timer component initialized');
		}

		return true;

	} catch (error) {
		console.error('❌ Failed to initialize timer:', error.message);
		return false;
	}
}

/**
 * Starts the countdown timer
 * @param {number} duration - Optional duration override
 * @returns {boolean} - True if started successfully
 */
function startTimer(duration = null) {
	try {
		// Check if timer is disabled via configuration
		if (typeof getTimerConfig === 'function') {
			const config = getTimerConfig();
			if (config.isDisabled) {
				if (timerState.enableLogging) {
					console.log('⏸️ Timer disabled via configuration - not starting');
				}
				return false;
			}

			// Use configured duration if no override provided
			if (duration === null) {
				duration = config.duration;
			}
		}

		// Stop any existing timer
		if (timerState.isActive) {
			stopTimer();
		}

		// Set duration if provided
		if (duration !== null && duration > 0) {
			timerState.duration = duration;
		}

		// Reset to full duration
		timerState.currentTime = timerState.duration;
		timerState.isActive = true;
		timerState.isPaused = false;
		timerState.startTimestamp = Date.now();

		// Update display immediately
		updateTimerDisplay();
		updateProgressBar();

		// Start the countdown interval
		timerState.intervalId = setInterval(() => {
			timerTick();
		}, 100); // Update every 100ms for smooth animation

		// Call start callback
		if (timerState.onStart) {
			timerState.onStart();
		}

		if (timerState.enableLogging) {
			console.log(`⏰ Timer started: ${timerState.duration} seconds`);
		}

		return true;

	} catch (error) {
		console.error('❌ Failed to start timer:', error.message);
		return false;
	}
}

/**
 * Stops the countdown timer
 * @param {boolean} silent - If true, don't call stop callback
 * @returns {boolean} - True if stopped successfully
 */
function stopTimer(silent = false) {
	try {
		if (!timerState.isActive) {
			return true; // Already stopped
		}

		// Clear the interval
		if (timerState.intervalId) {
			clearInterval(timerState.intervalId);
			timerState.intervalId = null;
		}

		// Update state
		timerState.isActive = false;
		timerState.isPaused = false;
		timerState.startTimestamp = null;

		// Call stop callback
		if (!silent && timerState.onStop) {
			timerState.onStop();
		}

		if (timerState.enableLogging) {
			console.log('⏹️ Timer stopped');
		}

		return true;

	} catch (error) {
		console.error('❌ Failed to stop timer:', error.message);
		return false;
	}
}

/**
 * Resets the timer to its initial state
 * @param {boolean} autoStart - If true, automatically start after reset
 * @returns {boolean} - True if reset successfully
 */
function resetTimer(autoStart = false) {
	try {
		// Stop current timer
		stopTimer(true);

		// Reset to initial state
		timerState.currentTime = timerState.duration;
		timerState.isActive = false;
		timerState.isPaused = false;

		// Remove all timer styling classes
		if (timerState.progressBarElement) {
			timerState.progressBarElement.classList.remove('timer-paused', 'timer-warning', 'timer-critical');
		}
		if (timerState.displayElement) {
			timerState.displayElement.classList.remove('timer-paused', 'timer-warning', 'timer-critical');
		}

		// Update display
		updateTimerDisplay();
		updateProgressBar();

		// Call reset callback
		if (timerState.onReset) {
			timerState.onReset();
		}

		// Auto-start if requested
		if (autoStart) {
			startTimer();
		}

		if (timerState.enableLogging) {
			console.log('🔄 Timer reset');
		}

		return true;

	} catch (error) {
		console.error('❌ Failed to reset timer:', error.message);
		return false;
	}
}

/**
 * Pauses the timer (can be resumed)
 * @returns {boolean} - True if paused successfully
 */
function pauseTimer() {
	try {
		if (!timerState.isActive || timerState.isPaused) {
			return true; // Already paused or not active
		}

		// Clear interval but keep state
		if (timerState.intervalId) {
			clearInterval(timerState.intervalId);
			timerState.intervalId = null;
		}

		timerState.isPaused = true;

		// Add visual pause styling
		if (timerState.progressBarElement) {
			timerState.progressBarElement.classList.add('timer-paused');
		}
		if (timerState.displayElement) {
			timerState.displayElement.classList.add('timer-paused');
		}

		if (timerState.enableLogging) {
			console.log('⏸️ Timer paused');
		}

		return true;

	} catch (error) {
		console.error('❌ Failed to pause timer:', error.message);
		return false;
	}
}

/**
 * Resumes a paused timer
 * @returns {boolean} - True if resumed successfully
 */
function resumeTimer() {
	try {
		if (!timerState.isActive || !timerState.isPaused) {
			return true; // Not paused or not active
		}

		// Restart interval
		timerState.intervalId = setInterval(() => {
			timerTick();
		}, 100);

		timerState.isPaused = false;
		timerState.startTimestamp = Date.now() - ((timerState.duration - timerState.currentTime) * 1000);

		// Remove visual pause styling
		if (timerState.progressBarElement) {
			timerState.progressBarElement.classList.remove('timer-paused');
		}
		if (timerState.displayElement) {
			timerState.displayElement.classList.remove('timer-paused');
		}

		if (timerState.enableLogging) {
			console.log('▶️ Timer resumed');
		}

		return true;

	} catch (error) {
		console.error('❌ Failed to resume timer:', error.message);
		return false;
	}
}

/**
 * Internal timer tick function
 * Called every 100ms to update timer state and display
 */
function timerTick() {
	try {
		if (!timerState.isActive || timerState.isPaused) {
			return;
		}

		// Check if DOM elements still exist
		if (!timerState.progressBarElement || !timerState.displayElement) {
			console.warn('⚠️ Timer DOM elements missing, stopping timer');
			stopTimer();
			return;
		}

		// Calculate elapsed time for accuracy
		const elapsed = (Date.now() - timerState.startTimestamp) / 1000;
		timerState.currentTime = Math.max(0, timerState.duration - elapsed);

		// Update display with error handling
		try {
			updateTimerDisplay();
			updateProgressBar();
		} catch (displayError) {
			console.warn('⚠️ Timer display update failed:', displayError.message);
		}

		// Call tick callback with error handling
		if (timerState.onTick) {
			try {
				timerState.onTick(timerState.currentTime);
			} catch (callbackError) {
				console.warn('⚠️ Timer tick callback failed:', callbackError.message);
			}
		}

		// Check if timer expired
		if (timerState.currentTime <= 0) {
			handleTimeout();
		}

	} catch (error) {
		console.error('❌ Timer tick error:', error.message);
		stopTimer();
	}
}

/**
 * Handles timer timeout
 */
function handleTimeout() {
	try {
		// Stop the timer
		stopTimer(true);

		// Call timeout callback
		if (timerState.onTimeout) {
			timerState.onTimeout();
		}

		if (timerState.enableLogging) {
			console.log('⏰ Timer expired - automatic progression');
		}

	} catch (error) {
		console.error('❌ Timer timeout handler error:', error.message);
	}
}

/**
 * Updates the timer display element with error handling
 */
function updateTimerDisplay() {
	if (!timerState.displayElement) {
		console.warn('⚠️ Timer display element not found');
		return;
	}

	try {
		const seconds = Math.ceil(timerState.currentTime);
		timerState.displayElement.textContent = seconds.toString();

		// Add visual feedback based on remaining time
		const element = timerState.displayElement;
		element.classList.remove('timer-warning', 'timer-critical');

		if (seconds <= 5) {
			element.classList.add('timer-critical');
		} else if (seconds <= 10) {
			element.classList.add('timer-warning');
		}
	} catch (error) {
		console.warn('⚠️ Failed to update timer display:', error.message);
	}
}

/**
 * Updates the progress bar visual with error handling
 */
function updateProgressBar() {
	if (!timerState.progressBarElement) {
		console.warn('⚠️ Timer progress bar element not found');
		return;
	}

	try {
		const percentage = (timerState.currentTime / timerState.duration) * 100;
		timerState.progressBarElement.style.setProperty('--progress', `${percentage}%`);

		// Add visual feedback classes
		const element = timerState.progressBarElement;
		element.classList.remove('timer-warning', 'timer-critical');

		if (percentage <= 33.33) { // Last 5 seconds of 15
			element.classList.add('timer-critical');
		} else if (percentage <= 66.67) { // Last 10 seconds of 15
			element.classList.add('timer-warning');
		}
	} catch (error) {
		console.warn('⚠️ Failed to update progress bar:', error.message);
	}
}

/**
 * Default timeout handler - advances to next pair
 */
function defaultTimeoutHandler() {
	try {
		// Check if we're in continue prompt state
		if (typeof appState !== 'undefined' && appState.isShowingContinuePrompt) {
			console.log('⏸️ Timer expired but continue prompt state is active - not auto-advancing');
			return;
		}

		// Check if we're showing a continue prompt - if so, don't auto-advance
		const continueSection = document.getElementById('continue-section');
		if (continueSection && continueSection.style.display !== 'none') {
			console.log('⏸️ Timer expired but continue prompt is showing - not auto-advancing');
			return;
		}

		// Check if loadNextPair function is available
		if (typeof loadNextPair === 'function') {
			loadNextPair();
		} else {
			console.warn('⚠️ loadNextPair function not available for automatic progression');
		}
	} catch (error) {
		console.error('❌ Default timeout handler error:', error.message);
	}
}

/**
 * Gets current timer state information
 * @returns {Object} - Current timer state
 */
function getTimerState() {
	return {
		duration: timerState.duration,
		currentTime: timerState.currentTime,
		isActive: timerState.isActive,
		isPaused: timerState.isPaused,
		percentage: (timerState.currentTime / timerState.duration) * 100,
		remainingSeconds: Math.ceil(timerState.currentTime)
	};
}

/**
 * Sets up timer integration with the main app
 * Should be called after app initialization
 */
function setupTimerIntegration() {
	try {
		// Get configured duration
		let configuredDuration = 15;
		if (typeof getTimerConfig === 'function') {
			const config = getTimerConfig();
			configuredDuration = config.duration;
		}

		// Initialize timer with app-specific settings
		const success = initializeTimer({
			duration: configuredDuration,
			enableLogging: true,
			onTimeout: () => {
				// Automatic progression when timer expires
				if (typeof loadNextPair === 'function') {
					loadNextPair();
				}
			}
		});

		if (!success) {
			throw new Error('Failed to initialize timer');
		}

		// Set up integration with image selection
		if (typeof window !== 'undefined') {
			// Override handleSelection to reset timer
			const originalHandleSelection = window.handleSelection;
			if (originalHandleSelection) {
				window.handleSelection = function (selectedDesignId) {
					// Stop current timer when selection is made
					stopTimer();

					// Call original handler
					const result = originalHandleSelection.call(this, selectedDesignId);

					// Start new timer for next pair (with small delay)
					setTimeout(() => {
						if (getTimerState && !getTimerState().isActive) {
							// Check if we're in continue prompt state before starting timer
							if (typeof appState !== 'undefined' && appState.isShowingContinuePrompt) {
								console.log('⏸️ TIMER.JS SELECTION BLOCKED: Continue prompt state active - not starting timer');
								return;
							}

							// Double-check that continue prompt is not showing
							const continueSection = document.getElementById('continue-section');
							if (continueSection && continueSection.style.display !== 'none') {
								console.log('⏸️ TIMER.JS SELECTION BLOCKED: Continue prompt is showing - not starting timer');
								return;
							}

							console.log('▶️ TIMER.JS SELECTION STARTING TIMER - no blocks detected');
							startTimer();
						}
					}, 1000);

					return result;
				};
			}

			// Override loadNextPair to start timer
			const originalLoadNextPair = window.loadNextPair;
			if (originalLoadNextPair) {
				window.loadNextPair = function () {
					// Call original function
					const result = originalLoadNextPair.call(this);

					// Start timer if pair loaded successfully
					if (result) {
						setTimeout(() => {
							// Check if we're in continue prompt state before starting timer
							if (typeof appState !== 'undefined' && appState.isShowingContinuePrompt) {
								console.log('⏸️ TIMER.JS BLOCKED: Continue prompt state active - not starting timer');
								return;
							}

							// Double-check that continue prompt is not showing
							const continueSection = document.getElementById('continue-section');
							if (continueSection && continueSection.style.display !== 'none') {
								console.log('⏸️ TIMER.JS BLOCKED: Continue prompt is showing - not starting timer');
								return;
							}

							console.log('▶️ TIMER.JS STARTING TIMER - no blocks detected');
							startTimer();
						}, 500); // Small delay to let images load
					}

					return result;
				};
			}
		}

		console.log('✅ Timer integration set up successfully');
		return true;

	} catch (error) {
		console.error('❌ Failed to set up timer integration:', error.message);
		return false;
	}
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		initializeTimer,
		startTimer,
		stopTimer,
		resetTimer,
		pauseTimer,
		resumeTimer,
		getTimerState,
		setupTimerIntegration
	};
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
	window.initializeTimer = initializeTimer;
	window.startTimer = startTimer;
	window.stopTimer = stopTimer;
	window.resetTimer = resetTimer;
	window.pauseTimer = pauseTimer;
	window.resumeTimer = resumeTimer;
	window.getTimerState = getTimerState;
	window.setupTimerIntegration = setupTimerIntegration;
}