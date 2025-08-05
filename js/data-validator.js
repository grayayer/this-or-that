/**
 * JSON Data Validator for This or That Application
 * Validates design data structure and handles malformed data
 */

class DataValidator {
	constructor() {
		this.errors = [];
		this.warnings = [];
	}

	/**
	 * Validates the complete designs JSON structure
	 * @param {Object} data - The parsed JSON data
	 * @returns {Object} - Validation result with isValid, errors, warnings, and cleanedData
	 */
	validateDesignsData(data) {
		this.errors = [];
		this.warnings = [];

		if (!data || typeof data !== 'object') {
			this.errors.push('Data must be a valid object');
			return this.getValidationResult(false, null);
		}

		// Validate metadata
		this.validateMetadata(data.metadata);

		// Validate designs array
		if (!Array.isArray(data.designs)) {
			this.errors.push('designs must be an array');
			return this.getValidationResult(false, null);
		}

		if (data.designs.length === 0) {
			this.errors.push('designs array cannot be empty');
			return this.getValidationResult(false, null);
		}

		// Validate each design and clean data
		const cleanedDesigns = [];
		data.designs.forEach((design, index) => {
			const cleanedDesign = this.validateAndCleanDesign(design, index);
			if (cleanedDesign) {
				cleanedDesigns.push(cleanedDesign);
			}
		});

		if (cleanedDesigns.length === 0) {
			this.errors.push('No valid designs found after validation');
			return this.getValidationResult(false, null);
		}

		const cleanedData = {
			metadata: {
				...data.metadata,
				totalDesigns: cleanedDesigns.length,
				validationErrors: this.errors.length,
				validationWarnings: this.warnings.length
			},
			designs: cleanedDesigns
		};

		return this.getValidationResult(this.errors.length === 0, cleanedData);
	}

	/**
	 * Validates metadata section
	 * @param {Object} metadata - Metadata object
	 */
	validateMetadata(metadata) {
		if (!metadata || typeof metadata !== 'object') {
			this.warnings.push('Missing or invalid metadata section');
			return;
		}

		if (!metadata.generatedAt) {
			this.warnings.push('Missing generatedAt in metadata');
		}

		if (typeof metadata.totalDesigns !== 'number') {
			this.warnings.push('totalDesigns should be a number');
		}
	}

	/**
	 * Validates and cleans a single design object
	 * @param {Object} design - Design object to validate
	 * @param {number} index - Index in the array for error reporting
	 * @returns {Object|null} - Cleaned design object or null if invalid
	 */
	validateAndCleanDesign(design, index) {
		if (!design || typeof design !== 'object') {
			this.errors.push(`Design at index ${index} is not a valid object`);
			return null;
		}

		const cleanedDesign = {};

		// Validate required fields
		if (!design.id || typeof design.id !== 'string') {
			this.errors.push(`Design at index ${index} missing valid id`);
			return null;
		}
		cleanedDesign.id = design.id.trim();

		if (!design.image || typeof design.image !== 'string') {
			this.errors.push(`Design at index ${index} missing valid image URL`);
			return null;
		}

		if (!this.isValidUrl(design.image)) {
			this.errors.push(`Design at index ${index} has invalid image URL: ${design.image}`);
			return null;
		}
		cleanedDesign.image = design.image.trim();

		// Validate optional fields
		if (design.title && typeof design.title === 'string') {
			cleanedDesign.title = design.title.trim();
		}

		if (design.author && typeof design.author === 'string') {
			cleanedDesign.author = design.author.trim();
		}

		// Validate and clean tags
		const cleanedTags = this.validateAndCleanTags(design.tags, index);
		if (!cleanedTags) {
			return null;
		}
		cleanedDesign.tags = cleanedTags;

		return cleanedDesign;
	}

	/**
	 * Validates and cleans tags object
	 * @param {Object} tags - Tags object
	 * @param {number} designIndex - Design index for error reporting
	 * @returns {Object|null} - Cleaned tags object or null if invalid
	 */
	validateAndCleanTags(tags, designIndex) {
		if (!tags || typeof tags !== 'object') {
			this.errors.push(`Design at index ${designIndex} missing valid tags object`);
			return null;
		}

		const cleanedTags = {};
		const validTagCategories = ['style', 'industry', 'typography', 'type', 'category', 'platform', 'colors'];

		validTagCategories.forEach(category => {
			if (tags[category]) {
				if (Array.isArray(tags[category])) {
					if (category === 'colors') {
						cleanedTags[category] = this.cleanColorTags(tags[category], designIndex);
					} else {
						cleanedTags[category] = this.cleanStringTags(tags[category], designIndex, category);
					}
				} else {
					this.warnings.push(`Design at index ${designIndex} has non-array ${category} tags`);
					cleanedTags[category] = [];
				}
			} else {
				cleanedTags[category] = [];
			}
		});

		return cleanedTags;
	}

	/**
	 * Cleans string-based tag arrays
	 * @param {Array} tagArray - Array of tag strings
	 * @param {number} designIndex - Design index for error reporting
	 * @param {string} category - Tag category name
	 * @returns {Array} - Cleaned tag array
	 */
	cleanStringTags(tagArray, designIndex, category) {
		const cleaned = [];
		const seen = new Set();

		tagArray.forEach((tag, tagIndex) => {
			if (typeof tag === 'string') {
				const cleanTag = tag.trim();

				// Skip empty strings, commas, and common scraping artifacts
				if (cleanTag &&
					cleanTag !== ',' &&
					cleanTag !== 'Claim this website' &&
					cleanTag !== 'PRO' &&
					!cleanTag.includes(',') &&
					!seen.has(cleanTag.toLowerCase())) {

					cleaned.push(cleanTag);
					seen.add(cleanTag.toLowerCase());
				}
			} else {
				this.warnings.push(`Design at index ${designIndex} has non-string tag in ${category} at position ${tagIndex}`);
			}
		});

		return cleaned;
	}

	/**
	 * Cleans color tag arrays
	 * @param {Array} colorArray - Array of color strings
	 * @param {number} designIndex - Design index for error reporting
	 * @returns {Array} - Cleaned color array
	 */
	cleanColorTags(colorArray, designIndex) {
		const cleaned = [];
		const seen = new Set();

		colorArray.forEach((color, colorIndex) => {
			if (typeof color === 'string') {
				const cleanColor = color.trim().toUpperCase();

				// Validate hex color format
				if (this.isValidHexColor(cleanColor) && !seen.has(cleanColor)) {
					cleaned.push(cleanColor);
					seen.add(cleanColor);
				} else if (cleanColor) {
					this.warnings.push(`Design at index ${designIndex} has invalid color format: ${color}`);
				}
			} else {
				this.warnings.push(`Design at index ${designIndex} has non-string color at position ${colorIndex}`);
			}
		});

		return cleaned;
	}

	/**
	 * Validates URL format
	 * @param {string} url - URL to validate
	 * @returns {boolean} - True if valid URL
	 */
	isValidUrl(url) {
		try {
			// Accept absolute URLs
			new URL(url);
			return true;
		} catch {
			// Also accept relative URLs that start with ./ or just a path
			if (typeof url === 'string' && url.length > 0) {
				// Check if it's a relative path (starts with ./ or just a filename/path)
				if (url.startsWith('./') || url.startsWith('../') || !url.includes('://')) {
					return true;
				}
			}
			return false;
		}
	}

	/**
	 * Validates hex color format
	 * @param {string} color - Color string to validate
	 * @returns {boolean} - True if valid hex color
	 */
	isValidHexColor(color) {
		return /^#[0-9A-F]{6}$/i.test(color);
	}

	/**
	 * Creates validation result object
	 * @param {boolean} isValid - Whether validation passed
	 * @param {Object} cleanedData - Cleaned data object
	 * @returns {Object} - Validation result
	 */
	getValidationResult(isValid, cleanedData) {
		return {
			isValid,
			errors: [...this.errors],
			warnings: [...this.warnings],
			cleanedData
		};
	}

	/**
	 * Validates JSON string and returns parsed, cleaned data
	 * @param {string} jsonString - JSON string to validate
	 * @returns {Object} - Validation result
	 */
	validateJsonString(jsonString) {
		try {
			const data = JSON.parse(jsonString);
			return this.validateDesignsData(data);
		} catch (parseError) {
			this.errors.push(`Invalid JSON format: ${parseError.message}`);
			return this.getValidationResult(false, null);
		}
	}

	/**
	 * Creates test cases for edge cases and malformed data
	 * @returns {Array} - Array of test cases
	 */
	createTestCases() {
		return [
			{
				name: 'Valid minimal design',
				data: {
					metadata: { generatedAt: '2025-01-30T10:00:00.000Z', totalDesigns: 1 },
					designs: [{
						id: 'test_001',
						image: 'https://example.com/image.jpg',
						tags: {
							style: ['Modern'],
							industry: ['Tech'],
							typography: ['Sans Serif'],
							type: ['Web App'],
							category: ['Landing'],
							platform: ['React'],
							colors: ['#FFFFFF']
						}
					}]
				},
				expectedValid: true
			},
			{
				name: 'Missing required fields',
				data: {
					designs: [{
						title: 'Missing ID and image',
						tags: {}
					}]
				},
				expectedValid: false
			},
			{
				name: 'Invalid color formats',
				data: {
					metadata: {},
					designs: [{
						id: 'test_002',
						image: 'https://example.com/image.jpg',
						tags: {
							colors: ['#FFFFFF', 'invalid-color', '#12345', '#GGGGGG', '#123456']
						}
					}]
				},
				expectedValid: true // Should clean invalid colors but remain valid
			},
			{
				name: 'Malformed tags with commas and artifacts',
				data: {
					metadata: {},
					designs: [{
						id: 'test_003',
						image: 'https://example.com/image.jpg',
						tags: {
							style: ['Modern', ',', 'Clean, Minimal', 'Claim this website', 'PRO', 'Bold'],
							industry: ['Tech', 'Health & Fitness, Medical', ',']
						}
					}]
				},
				expectedValid: true
			},
			{
				name: 'Empty designs array',
				data: {
					metadata: {},
					designs: []
				},
				expectedValid: false
			},
			{
				name: 'Invalid JSON structure',
				data: null,
				expectedValid: false
			}
		];
	}
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = DataValidator;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
	window.DataValidator = DataValidator;
}