/**
 * Application Data Loader with Validation
 * Loads and validates design data for the This or That application
 */

class AppDataLoader {
	constructor() {
		// Initialize validator - handle both Node.js and browser environments
		if (typeof DataValidator !== 'undefined') {
			this.validator = new DataValidator();
		} else if (typeof require !== 'undefined') {
			const DataValidator = require('./data-validator.js');
			this.validator = new DataValidator();
		} else {
			throw new Error('DataValidator not available. Make sure data-validator.js is loaded first.');
		}

		this.designsData = null;
		this.isLoaded = false;
	}

	/**
	 * Loads design data from JSON file with validation and retry logic
	 * @param {string} dataPath - Path to the JSON file (default: 'data/sample-designs.json')
	 * @param {Object} options - Loading options
	 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
	 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
	 * @param {Function} options.onProgress - Progress callback function
	 * @returns {Promise<Object>} - Promise resolving to loaded and validated data
	 */
	async loadDesigns(dataPath = 'data/sample-designs.json', options = {}) {
		const {
			maxRetries = 3,
			retryDelay = 1000,
			onProgress = null
		} = options;

		let lastError = null;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				if (onProgress) {
					onProgress({
						stage: 'loading',
						attempt,
						maxRetries,
						message: `Loading design data from ${dataPath}... (attempt ${attempt}/${maxRetries})`
					});
				}

				console.log(`📥 Loading design data from ${dataPath}... (attempt ${attempt}/${maxRetries})`);

				// Check if we're offline (but allow localhost)
				if (typeof navigator !== 'undefined' && !navigator.onLine) {
					// Allow localhost and local file access even when offline
					const isLocalhost = dataPath.startsWith('/') ||
						dataPath.startsWith('./') ||
						dataPath.startsWith('data/') ||
						window.location.hostname === 'localhost' ||
						window.location.hostname === '127.0.0.1';

					if (!isLocalhost) {
						throw new Error('No internet connection available');
					}
				}

				// Add timeout to fetch request
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

				const response = await fetch(dataPath, {
					signal: controller.signal,
					cache: 'no-cache', // Ensure fresh data on retry
					headers: {
						'Cache-Control': 'no-cache',
						'Pragma': 'no-cache'
					}
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					const errorMessage = this.getHttpErrorMessage(response.status, response.statusText);
					throw new Error(errorMessage);
				}

				if (onProgress) {
					onProgress({
						stage: 'parsing',
						attempt,
						maxRetries,
						message: 'Parsing and validating data...'
					});
				}

				const jsonText = await response.text();

				// Check if response is actually JSON
				if (!jsonText.trim()) {
					throw new Error('Empty response received from server');
				}

				const validationResult = this.validator.validateJsonString(jsonText);

				if (!validationResult.isValid) {
					console.error('❌ Data validation failed:', validationResult.errors);
					throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);
				}

				if (validationResult.warnings.length > 0) {
					console.warn('⚠️ Data validation warnings:', validationResult.warnings);
				}

				this.designsData = validationResult.cleanedData;
				this.isLoaded = true;

				if (onProgress) {
					onProgress({
						stage: 'complete',
						attempt,
						maxRetries,
						message: `Successfully loaded ${this.designsData.designs.length} designs`
					});
				}

				console.log(`✅ Successfully loaded ${this.designsData.designs.length} designs`);
				console.log(`📊 Validation: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`);

				return this.designsData;

			} catch (error) {
				lastError = error;
				console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, error.message);

				if (onProgress) {
					onProgress({
						stage: 'error',
						attempt,
						maxRetries,
						message: `Attempt ${attempt} failed: ${error.message}`,
						error: error.message
					});
				}

				// Don't retry on certain types of errors
				if (this.isNonRetryableError(error)) {
					console.error('❌ Non-retryable error encountered:', error.message);
					break;
				}

				// Wait before retrying (except on last attempt)
				if (attempt < maxRetries) {
					console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
					await this.delay(retryDelay);

					// Exponential backoff
					retryDelay *= 1.5;
				}
			}
		}

		// All attempts failed
		const finalError = new Error(
			`Failed to load design data after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
		);
		finalError.originalError = lastError;
		finalError.attempts = maxRetries;

		console.error('❌ Failed to load design data after all retry attempts:', finalError);
		throw finalError;
	}

	/**
	 * Gets all design data
	 * @returns {Object|null} - Design data or null if not loaded
	 */
	getDesigns() {
		if (!this.isLoaded) {
			console.warn('⚠️ Design data not loaded yet. Call loadDesigns() first.');
			return null;
		}
		return this.designsData;
	}

	/**
	 * Gets a specific design by ID
	 * @param {string} designId - Design ID to find
	 * @returns {Object|null} - Design object or null if not found
	 */
	getDesignById(designId) {
		if (!this.isLoaded || !this.designsData) {
			return null;
		}

		return this.designsData.designs.find(design => design.id === designId) || null;
	}

	/**
	 * Gets random design pairs for the game
	 * @param {number} count - Number of pairs to generate (default: 1)
	 * @param {Set} usedPairs - Set of used pair combinations to avoid duplicates
	 * @returns {Array} - Array of design pairs
	 */
	getRandomPairs(count = 1, usedPairs = new Set()) {
		if (!this.isLoaded || !this.designsData) {
			console.error('❌ Design data not loaded');
			return [];
		}

		const designs = this.designsData.designs;
		const pairs = [];

		if (designs.length < 2) {
			console.error('❌ Need at least 2 designs to create pairs');
			return [];
		}

		let attempts = 0;
		const maxAttempts = count * 10; // Prevent infinite loops

		while (pairs.length < count && attempts < maxAttempts) {
			attempts++;

			// Get two random different designs
			const index1 = Math.floor(Math.random() * designs.length);
			let index2 = Math.floor(Math.random() * designs.length);

			// Ensure different designs
			while (index2 === index1) {
				index2 = Math.floor(Math.random() * designs.length);
			}

			const design1 = designs[index1];
			const design2 = designs[index2];

			// Create a unique pair identifier (sorted to avoid duplicate pairs in different order)
			const pairId = [design1.id, design2.id].sort().join('|');

			if (!usedPairs.has(pairId)) {
				pairs.push([design1, design2]);
				usedPairs.add(pairId);
			}
		}

		if (pairs.length < count) {
			console.warn(`⚠️ Could only generate ${pairs.length} unique pairs out of ${count} requested`);
		}

		return pairs;
	}

	/**
	 * Gets designs filtered by tag criteria
	 * @param {Object} criteria - Filter criteria object
	 * @returns {Array} - Filtered designs array
	 */
	getDesignsByTags(criteria = {}) {
		if (!this.isLoaded || !this.designsData) {
			return [];
		}

		return this.designsData.designs.filter(design => {
			return Object.entries(criteria).every(([category, requiredTags]) => {
				if (!Array.isArray(requiredTags) || requiredTags.length === 0) {
					return true;
				}

				const designTags = design.tags[category] || [];
				return requiredTags.some(tag =>
					designTags.some(designTag =>
						designTag.toLowerCase().includes(tag.toLowerCase())
					)
				);
			});
		});
	}

	/**
	 * Gets statistics about the loaded data
	 * @returns {Object} - Statistics object
	 */
	getDataStats() {
		if (!this.isLoaded || !this.designsData) {
			return null;
		}

		const designs = this.designsData.designs;
		const stats = {
			totalDesigns: designs.length,
			tagStats: {},
			averageColorsPerDesign: 0,
			uniqueAuthors: new Set(),
			platformDistribution: {}
		};

		// Calculate tag statistics
		const tagCategories = ['style', 'industry', 'typography', 'type', 'category', 'platform'];
		tagCategories.forEach(category => {
			const allTags = designs.flatMap(design => design.tags[category] || []);
			const uniqueTags = [...new Set(allTags)];
			stats.tagStats[category] = {
				unique: uniqueTags.length,
				total: allTags.length,
				mostCommon: this.getMostCommonTags(allTags, 3)
			};
		});

		// Calculate color statistics
		const allColors = designs.flatMap(design => design.tags.colors || []);
		stats.averageColorsPerDesign = allColors.length / designs.length;

		// Calculate author statistics
		designs.forEach(design => {
			if (design.author) {
				stats.uniqueAuthors.add(design.author);
			}
		});
		stats.uniqueAuthors = stats.uniqueAuthors.size;

		return stats;
	}

	/**
	 * Helper method to get most common tags
	 * @param {Array} tags - Array of tags
	 * @param {number} limit - Number of top tags to return
	 * @returns {Array} - Array of {tag, count} objects
	 */
	getMostCommonTags(tags, limit = 5) {
		const counts = {};
		tags.forEach(tag => {
			counts[tag] = (counts[tag] || 0) + 1;
		});

		return Object.entries(counts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([tag, count]) => ({ tag, count }));
	}

	/**
	 * Gets user-friendly HTTP error message
	 * @param {number} status - HTTP status code
	 * @param {string} statusText - HTTP status text
	 * @returns {string} - User-friendly error message
	 */
	getHttpErrorMessage(status, statusText) {
		switch (status) {
			case 404:
				return 'Design data file not found. Please check if the data file exists.';
			case 403:
				return 'Access denied to design data. Please check file permissions.';
			case 500:
			case 502:
			case 503:
			case 504:
				return 'Server error occurred while loading design data. Please try again later.';
			case 408:
				return 'Request timeout while loading design data. Please check your connection.';
			case 429:
				return 'Too many requests. Please wait a moment before trying again.';
			default:
				if (status >= 400 && status < 500) {
					return `Client error (${status}): ${statusText}. Please check the data file path.`;
				} else if (status >= 500) {
					return `Server error (${status}): ${statusText}. Please try again later.`;
				}
				return `HTTP error ${status}: ${statusText}`;
		}
	}

	/**
	 * Checks if an error should not be retried
	 * @param {Error} error - The error to check
	 * @returns {boolean} - True if error should not be retried
	 */
	isNonRetryableError(error) {
		const message = error.message.toLowerCase();

		// Don't retry validation errors or malformed data
		if (message.includes('validation failed') ||
			message.includes('invalid json') ||
			message.includes('empty response')) {
			return true;
		}

		// Don't retry 404 or 403 errors
		if (message.includes('404') || message.includes('403')) {
			return true;
		}

		// Don't retry if explicitly aborted
		if (error.name === 'AbortError') {
			return true;
		}

		return false;
	}

	/**
	 * Utility function to create delays
	 * @param {number} ms - Milliseconds to delay
	 * @returns {Promise} - Promise that resolves after delay
	 */
	delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Attempts to load data from cache if available
	 * @param {string} dataPath - Path to the data file
	 * @returns {Object|null} - Cached data or null if not available
	 */
	loadFromCache(dataPath) {
		try {
			if (typeof localStorage === 'undefined') {
				return null;
			}

			const cacheKey = `this-or-that-data-${dataPath}`;
			const cachedData = localStorage.getItem(cacheKey);

			if (!cachedData) {
				return null;
			}

			const parsed = JSON.parse(cachedData);

			// Check if cache is still valid (24 hours)
			const cacheAge = Date.now() - parsed.timestamp;
			const maxAge = 24 * 60 * 60 * 1000; // 24 hours

			if (cacheAge > maxAge) {
				localStorage.removeItem(cacheKey);
				return null;
			}

			console.log('📦 Loading data from cache');
			return parsed.data;

		} catch (error) {
			console.warn('⚠️ Failed to load from cache:', error.message);
			return null;
		}
	}

	/**
	 * Saves data to cache for offline use
	 * @param {string} dataPath - Path to the data file
	 * @param {Object} data - Data to cache
	 */
	saveToCache(dataPath, data) {
		try {
			if (typeof localStorage === 'undefined') {
				return;
			}

			const cacheKey = `this-or-that-data-${dataPath}`;
			const cacheData = {
				timestamp: Date.now(),
				data: data
			};

			localStorage.setItem(cacheKey, JSON.stringify(cacheData));
			console.log('💾 Data saved to cache for offline use');

		} catch (error) {
			console.warn('⚠️ Failed to save to cache:', error.message);
		}
	}

	/**
	 * Loads design data with offline fallback support
	 * @param {string} dataPath - Path to the JSON file
	 * @param {Object} options - Loading options
	 * @returns {Promise<Object>} - Promise resolving to loaded data
	 */
	async loadDesignsWithOfflineSupport(dataPath, options = {}) {
		try {
			// Try to load normally first
			const data = await this.loadDesigns(dataPath, options);

			// Save to cache for offline use
			this.saveToCache(dataPath, data);

			return data;

		} catch (error) {
			console.warn('⚠️ Online loading failed, trying cache...', error.message);

			// Try to load from cache
			const cachedData = this.loadFromCache(dataPath);

			if (cachedData) {
				console.log('📦 Using cached data due to network error');

				// Validate cached data
				const validationResult = this.validator.validateDesignsData(cachedData);

				if (validationResult.isValid) {
					this.designsData = validationResult.cleanedData;
					this.isLoaded = true;

					if (options.onProgress) {
						options.onProgress({
							stage: 'cache',
							message: 'Loaded from offline cache',
							isOffline: true
						});
					}

					return this.designsData;
				}
			}

			// No cache available, throw original error
			throw error;
		}
	}

	/**
	 * Validates that the data loader is ready for use
	 * @returns {boolean} - True if ready, false otherwise
	 */
	isReady() {
		return this.isLoaded && this.designsData && this.designsData.designs.length > 0;
	}
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = AppDataLoader;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
	window.AppDataLoader = AppDataLoader;
}