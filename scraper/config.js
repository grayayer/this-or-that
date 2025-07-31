/**
 * Configuration options for Land-book scraper
 */

const DEFAULT_CONFIG = {
	// Browser options
	browser: {
		headless: true,
		slowMo: 100,
		timeout: 30000,
		viewport: {
			width: 1200,
			height: 800
		}
	},

	// Scraping limits
	limits: {
		maxItems: 20, // Free account limit
		maxRetries: 3,
		requestDelay: 1500, // Minimum delay between requests (ms)
		requestDelayVariation: 1000 // Random additional delay (ms)
	},

	// Output options
	output: {
		format: 'json',
		filename: 'designs.json',
		directory: '../data',
		includeMetadata: true,
		prettyPrint: true
	},

	// Logging options
	logging: {
		level: 'info', // 'debug', 'info', 'warn', 'error'
		showProgress: true,
		logToFile: false,
		logFile: 'scraper.log'
	}
};

// Available Land-book categories and filters
const LANDBOOK_CATEGORIES = {
	// Main categories
	categories: [
		'portfolio',
		'agency',
		'e-commerce',
		'landing-page',
		'blog',
		'restaurant',
		'photography',
		'fashion',
		'technology',
		'health-fitness',
		'education',
		'non-profit',
		'real-estate',
		'travel',
		'finance',
		'entertainment',
		'news',
		'government',
		'personal',
		'other'
	],

	// Style filters
	styles: [
		'minimalist',
		'bold-typography',
		'gradient',
		'dark-theme',
		'light-theme',
		'colorful',
		'black-white',
		'illustration',
		'photography',
		'animation',
		'parallax',
		'grid-layout',
		'single-page',
		'multi-page',
		'mobile-first',
		'desktop-first'
	],

	// Industry filters
	industries: [
		'technology',
		'design',
		'marketing',
		'consulting',
		'healthcare',
		'education',
		'finance',
		'retail',
		'hospitality',
		'entertainment',
		'non-profit',
		'government',
		'startup',
		'enterprise',
		'freelance',
		'agency'
	],

	// Platform filters
	platforms: [
		'wordpress',
		'webflow',
		'squarespace',
		'wix',
		'shopify',
		'react',
		'vue',
		'angular',
		'next-js',
		'gatsby',
		'custom',
		'framer',
		'figma',
		'sketch'
	],

	// Color schemes
	colors: [
		'light-colors',
		'dark-colors',
		'bright-colors',
		'pastel-colors',
		'monochrome',
		'colorful',
		'blue',
		'green',
		'red',
		'purple',
		'orange',
		'yellow',
		'pink',
		'brown',
		'gray'
	]
};

// Predefined scraping presets
const SCRAPING_PRESETS = {
	'minimal-portfolios': {
		categories: ['portfolio'],
		styles: ['minimalist', 'light-theme'],
		maxItems: 20,
		description: 'Minimal portfolio designs with light themes'
	},

	'dark-tech': {
		categories: ['technology', 'startup'],
		styles: ['dark-theme', 'gradient'],
		industries: ['technology', 'startup'],
		maxItems: 20,
		description: 'Dark-themed technology and startup websites'
	},

	'e-commerce-modern': {
		categories: ['e-commerce'],
		styles: ['minimalist', 'grid-layout'],
		industries: ['retail', 'fashion'],
		maxItems: 20,
		description: 'Modern e-commerce sites with clean layouts'
	},

	'creative-agencies': {
		categories: ['agency', 'portfolio'],
		styles: ['bold-typography', 'animation'],
		industries: ['design', 'marketing', 'agency'],
		maxItems: 20,
		description: 'Creative agency websites with bold designs'
	},

	'health-wellness': {
		categories: ['landing-page'],
		industries: ['healthcare', 'health-fitness'],
		styles: ['light-theme', 'minimalist'],
		colors: ['light-colors', 'pastel-colors'],
		maxItems: 20,
		description: 'Health and wellness focused designs'
	}
};

/**
 * Build Land-book URL with filters
 */
function buildLandBookUrl(filters = {}) {
	const baseUrl = 'https://land-book.com/gallery';
	const params = new URLSearchParams();

	// Add category filters
	if (filters.categories && filters.categories.length > 0) {
		filters.categories.forEach(category => {
			params.append('categories[]', category);
		});
	}

	// Add style filters
	if (filters.styles && filters.styles.length > 0) {
		filters.styles.forEach(style => {
			params.append('styles[]', style);
		});
	}

	// Add industry filters
	if (filters.industries && filters.industries.length > 0) {
		filters.industries.forEach(industry => {
			params.append('industries[]', industry);
		});
	}

	// Add platform filters
	if (filters.platforms && filters.platforms.length > 0) {
		filters.platforms.forEach(platform => {
			params.append('platforms[]', platform);
		});
	}

	// Add color filters
	if (filters.colors && filters.colors.length > 0) {
		filters.colors.forEach(color => {
			params.append('colors[]', color);
		});
	}

	const queryString = params.toString();
	return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Validate configuration object
 */
function validateConfig(config) {
	const errors = [];

	// Validate browser config
	if (config.browser) {
		if (typeof config.browser.headless !== 'boolean') {
			errors.push('browser.headless must be a boolean');
		}
		if (typeof config.browser.timeout !== 'number' || config.browser.timeout < 1000) {
			errors.push('browser.timeout must be a number >= 1000');
		}
	}

	// Validate limits
	if (config.limits) {
		if (typeof config.limits.maxItems !== 'number' || config.limits.maxItems < 1) {
			errors.push('limits.maxItems must be a number >= 1');
		}
		if (typeof config.limits.requestDelay !== 'number' || config.limits.requestDelay < 0) {
			errors.push('limits.requestDelay must be a number >= 0');
		}
	}

	// Validate logging level
	if (config.logging && config.logging.level) {
		const validLevels = ['debug', 'info', 'warn', 'error'];
		if (!validLevels.includes(config.logging.level)) {
			errors.push(`logging.level must be one of: ${validLevels.join(', ')}`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

/**
 * Merge user config with defaults
 */
function mergeConfig(userConfig = {}) {
	return {
		browser: { ...DEFAULT_CONFIG.browser, ...userConfig.browser },
		limits: { ...DEFAULT_CONFIG.limits, ...userConfig.limits },
		output: { ...DEFAULT_CONFIG.output, ...userConfig.output },
		logging: { ...DEFAULT_CONFIG.logging, ...userConfig.logging }
	};
}

module.exports = {
	DEFAULT_CONFIG,
	LANDBOOK_CATEGORIES,
	SCRAPING_PRESETS,
	buildLandBookUrl,
	validateConfig,
	mergeConfig
};