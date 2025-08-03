#!/usr/bin/env node

/**
 * Command-line interface for Land-book scraper
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs').promises;
const LandBookScraper = require('./scraper.js');
const ScraperLogger = require('./logger.js');
const {
	DEFAULT_CONFIG,
	LANDBOOK_CATEGORIES,
	SCRAPING_PRESETS,
	buildLandBookUrl,
	validateConfig,
	mergeConfig
} = require('./config.js');

// Package info
const packageJson = require('./package.json');

program
	.name('landbook-scraper')
	.description('Scrape design data from Land-book.com')
	.version(packageJson.version);

/**
 * Main scrape command
 */
program
	.command('scrape')
	.description('Scrape designs from Land-book.com')
	.option('-c, --categories <categories>', 'Comma-separated list of categories')
	.option('-s, --styles <styles>', 'Comma-separated list of styles')
	.option('-i, --industries <industries>', 'Comma-separated list of industries')
	.option('-p, --platforms <platforms>', 'Comma-separated list of platforms')
	.option('--colors <colors>', 'Comma-separated list of color schemes')
	.option('-m, --max-items <number>', 'Maximum number of items to scrape', parseInt, 20)
	.option('-o, --output <path>', 'Output file path', 'designs.json')
	.option('--headless <boolean>', 'Run browser in headless mode', 'true')
	.option('--timeout <number>', 'Request timeout in milliseconds', parseInt, 30000)
	.option('--delay <number>', 'Delay between requests in milliseconds', parseInt, 1500)
	.option('--download-images', 'Download images locally to /data/images/ directory')
	.option('--log-level <level>', 'Logging level (debug, info, warn, error)', 'info')
	.option('--log-file <path>', 'Log to file')
	.option('--config <path>', 'Path to configuration file')
	.option('--preset <name>', 'Use predefined scraping preset')
	.option('--dry-run', 'Show what would be scraped without actually scraping')
	.action(async (options) => {
		try {
			await runScrapeCommand(options);
		} catch (error) {
			console.error('❌ Scraping failed:', error.message);
			process.exit(1);
		}
	});

/**
 * List available options command
 */
program
	.command('list')
	.description('List available categories, styles, and presets')
	.option('-t, --type <type>', 'Type to list (categories, styles, industries, platforms, colors, presets)', 'all')
	.action((options) => {
		listAvailableOptions(options.type);
	});

/**
 * Validate URL command
 */
program
	.command('validate-url')
	.description('Validate and preview Land-book URL with filters')
	.option('-c, --categories <categories>', 'Comma-separated list of categories')
	.option('-s, --styles <styles>', 'Comma-separated list of styles')
	.option('-i, --industries <industries>', 'Comma-separated list of industries')
	.option('-p, --platforms <platforms>', 'Comma-separated list of platforms')
	.option('--colors <colors>', 'Comma-separated list of color schemes')
	.option('--preset <name>', 'Use predefined scraping preset')
	.action((options) => {
		validateAndShowUrl(options);
	});

/**
 * Generate config command
 */
program
	.command('init-config')
	.description('Generate a configuration file')
	.option('-o, --output <path>', 'Output config file path', 'scraper-config.json')
	.action(async (options) => {
		await generateConfigFile(options.output);
	});

/**
 * Run scrape command
 */
async function runScrapeCommand(options) {
	// Load configuration
	let config = DEFAULT_CONFIG;

	if (options.config) {
		try {
			const configFile = await fs.readFile(options.config, 'utf8');
			const userConfig = JSON.parse(configFile);
			config = mergeConfig(userConfig);
		} catch (error) {
			console.error(`❌ Failed to load config file: ${error.message}`);
			process.exit(1);
		}
	}

	// Override config with CLI options
	if (options.maxItems) config.limits.maxItems = options.maxItems;
	if (options.headless !== undefined) config.browser.headless = options.headless === 'true';
	if (options.timeout) config.browser.timeout = options.timeout;
	if (options.delay) config.limits.requestDelay = options.delay;
	if (options.downloadImages) config.downloadImages = true;
	if (options.logLevel) config.logging.level = options.logLevel;
	if (options.logFile) {
		config.logging.logToFile = true;
		config.logging.logFile = options.logFile;
	}

	// Validate configuration
	const validation = validateConfig(config);
	if (!validation.isValid) {
		console.error('❌ Configuration validation failed:');
		validation.errors.forEach(error => console.error(`   - ${error}`));
		process.exit(1);
	}

	// Initialize logger
	const logger = new ScraperLogger(config.logging);

	// Build filters
	let filters = {};

	if (options.preset) {
		if (!SCRAPING_PRESETS[options.preset]) {
			logger.error(`Unknown preset: ${options.preset}`);
			logger.info(`Available presets: ${Object.keys(SCRAPING_PRESETS).join(', ')}`);
			process.exit(1);
		}

		filters = { ...SCRAPING_PRESETS[options.preset] };
		logger.info(`Using preset: ${options.preset}`);
		logger.info(`Description: ${filters.description}`);
		delete filters.description; // Remove description from filters
	}

	// Override preset with CLI options
	if (options.categories) filters.categories = options.categories.split(',').map(s => s.trim());
	if (options.styles) filters.styles = options.styles.split(',').map(s => s.trim());
	if (options.industries) filters.industries = options.industries.split(',').map(s => s.trim());
	if (options.platforms) filters.platforms = options.platforms.split(',').map(s => s.trim());
	if (options.colors) filters.colors = options.colors.split(',').map(s => s.trim());

	// Build URL
	const url = buildLandBookUrl(filters);
	logger.info(`Target URL: ${url}`);

	// Show filters
	if (Object.keys(filters).length > 0) {
		logger.info('Active filters:');
		Object.entries(filters).forEach(([key, values]) => {
			if (Array.isArray(values) && values.length > 0) {
				console.log(`   ${key}: ${values.join(', ')}`);
			}
		});
	}

	// Dry run mode
	if (options.dryRun) {
		logger.info('🏃 Dry run mode - no actual scraping will be performed');
		logger.info(`Would scrape up to ${config.limits.maxItems} items`);
		logger.info(`Output would be saved to: ${options.output}`);
		return;
	}

	// Initialize scraper
	const scraper = new LandBookScraper({
		...config.browser,
		maxItems: config.limits.maxItems,
		downloadImages: config.downloadImages || false,
		logger: logger
	});

	try {
		// Initialize browser
		logger.info('🚀 Initializing scraper...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize scraper');
		}

		// Navigate to URL
		logger.info('🔍 Navigating to Land-book...');
		const urlInfo = {
			originalUrl: url,
			pageType: 'gallery',
			params: filters
		};

		const navigated = await scraper.navigateToUrl(urlInfo);
		if (!navigated) {
			throw new Error('Failed to navigate to target URL');
		}

		// Scrape grid page
		logger.info('🕷️ Scraping grid page...');
		const gridResult = await scraper.scrapeGridPage();
		if (!gridResult.success) {
			throw new Error(`Grid scraping failed: ${gridResult.error}`);
		}

		logger.info(`Found ${gridResult.items.length} items to process`);

		// Scrape detail pages
		if (gridResult.items.length > 0) {
			logger.info('📄 Scraping detail pages...');
			logger.initProgress(gridResult.items.length, 'Detail page scraping');

			const detailResult = await scraper.scrapeAllDetailPages(gridResult.items);

			if (detailResult.success) {
				// Generate JSON output
				logger.info('💾 Generating JSON output...');
				const outputPath = path.resolve(options.output);
				const jsonResult = await scraper.generateJsonOutput(detailResult.results, outputPath);

				if (jsonResult.success) {
					logger.success(`Scraping completed successfully!`);
					logger.info(`Output saved to: ${outputPath}`);
					logger.logStats({
						totalProcessed: detailResult.totalProcessed,
						successCount: detailResult.successCount,
						errorCount: detailResult.errorCount,
						...jsonResult.statistics
					});

					if (detailResult.errors.length > 0) {
						logger.logErrorSummary(detailResult.errors);
					}
				} else {
					throw new Error(`JSON generation failed: ${jsonResult.error}`);
				}
			} else {
				throw new Error('Detail page scraping failed');
			}
		} else {
			logger.warn('No items found to scrape');
		}

	} finally {
		// Clean up
		await scraper.close();
	}
}

/**
 * List available options
 */
function listAvailableOptions(type) {
	console.log('🔍 Land-book Scraper - Available Options\n');

	if (type === 'all' || type === 'categories') {
		console.log('📂 Categories:');
		LANDBOOK_CATEGORIES.categories.forEach(cat => console.log(`   - ${cat}`));
		console.log();
	}

	if (type === 'all' || type === 'styles') {
		console.log('🎨 Styles:');
		LANDBOOK_CATEGORIES.styles.forEach(style => console.log(`   - ${style}`));
		console.log();
	}

	if (type === 'all' || type === 'industries') {
		console.log('🏢 Industries:');
		LANDBOOK_CATEGORIES.industries.forEach(industry => console.log(`   - ${industry}`));
		console.log();
	}

	if (type === 'all' || type === 'platforms') {
		console.log('⚙️ Platforms:');
		LANDBOOK_CATEGORIES.platforms.forEach(platform => console.log(`   - ${platform}`));
		console.log();
	}

	if (type === 'all' || type === 'colors') {
		console.log('🌈 Colors:');
		LANDBOOK_CATEGORIES.colors.forEach(color => console.log(`   - ${color}`));
		console.log();
	}

	if (type === 'all' || type === 'presets') {
		console.log('🎯 Presets:');
		Object.entries(SCRAPING_PRESETS).forEach(([name, preset]) => {
			console.log(`   - ${name}: ${preset.description}`);
		});
		console.log();
	}
}

/**
 * Validate and show URL
 */
function validateAndShowUrl(options) {
	let filters = {};

	if (options.preset) {
		if (!SCRAPING_PRESETS[options.preset]) {
			console.error(`❌ Unknown preset: ${options.preset}`);
			console.log(`Available presets: ${Object.keys(SCRAPING_PRESETS).join(', ')}`);
			process.exit(1);
		}

		filters = { ...SCRAPING_PRESETS[options.preset] };
		console.log(`🎯 Using preset: ${options.preset}`);
		console.log(`Description: ${filters.description}\n`);
		delete filters.description;
	}

	// Override with CLI options
	if (options.categories) filters.categories = options.categories.split(',').map(s => s.trim());
	if (options.styles) filters.styles = options.styles.split(',').map(s => s.trim());
	if (options.industries) filters.industries = options.industries.split(',').map(s => s.trim());
	if (options.platforms) filters.platforms = options.platforms.split(',').map(s => s.trim());
	if (options.colors) filters.colors = options.colors.split(',').map(s => s.trim());

	const url = buildLandBookUrl(filters);

	console.log('🔗 Generated URL:');
	console.log(`   ${url}\n`);

	if (Object.keys(filters).length > 0) {
		console.log('🔍 Active filters:');
		Object.entries(filters).forEach(([key, values]) => {
			if (Array.isArray(values) && values.length > 0) {
				console.log(`   ${key}: ${values.join(', ')}`);
			}
		});
	} else {
		console.log('ℹ️ No filters applied - will scrape from main gallery');
	}
}

/**
 * Generate configuration file
 */
async function generateConfigFile(outputPath) {
	const configTemplate = {
		...DEFAULT_CONFIG,
		// Add example filters
		filters: {
			categories: ['portfolio', 'agency'],
			styles: ['minimalist', 'bold-typography'],
			industries: ['design', 'technology'],
			platforms: [],
			colors: []
		}
	};

	try {
		await fs.writeFile(outputPath, JSON.stringify(configTemplate, null, 2));
		console.log(`✅ Configuration file generated: ${outputPath}`);
		console.log('📝 Edit the file to customize your scraping settings');
	} catch (error) {
		console.error(`❌ Failed to generate config file: ${error.message}`);
		process.exit(1);
	}
}

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
	program.outputHelp();
}