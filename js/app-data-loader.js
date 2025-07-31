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
	 * Loads design data from JSON file with validation
	 * @param {string} dataPath - Path to the JSON file (default: 'data/sample-designs.json')
	 * @returns {Promise<Object>} - Promise resolving to loaded and validated data
	 */
	async loadDesigns(dataPath = 'data/sample-designs.json') {
		try {
			console.log(`📥 Loading design data from ${dataPath}...`);

			const response = await fetch(dataPath);

			if (!response.ok) {
				throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
			}

			const jsonText = await response.text();
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

			console.log(`✅ Successfully loaded ${this.designsData.designs.length} designs`);
			console.log(`📊 Validation: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`);

			return this.designsData;

		} catch (error) {
			console.error('❌ Failed to load design data:', error);
			throw error;
		}
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