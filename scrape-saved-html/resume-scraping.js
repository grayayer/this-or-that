#!/usr/bin/env node

/**
 * Resume Scraping Script
 * Identifies failed items and re-scrapes them
 */

const fs = require('fs');
const { WebsiteMetadataScraper } = require('./scrape-metadata.js');

async function main() {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		console.log('Usage: node resume-scraping.js <original-list.json> <scraped-results.json> [options]');
		console.log('Options:');
		console.log('  --output FILE       Output file name');
		console.log('  --delay N           Delay between requests (ms)');
		console.log('');
		console.log('Example: node resume-scraping.js personal-site-list.json personal-sites-data.json --output personal-sites-complete.json');
		process.exit(1);
	}

	const originalFile = args[0];
	const scrapedFile = args[1];

	// Parse options
	let outputFile = 'resumed-scraping.json';
	let delay = 1000;

	for (let i = 2; i < args.length; i++) {
		if (args[i] === '--output' && args[i + 1]) {
			outputFile = args[i + 1];
			i++;
		} else if (args[i] === '--delay' && args[i + 1]) {
			delay = parseInt(args[i + 1]);
			i++;
		}
	}

	console.log('🔍 Resume Scraping Analysis');
	console.log('='.repeat(50));

	// Load original list
	const originalData = JSON.parse(fs.readFileSync(originalFile, 'utf8'));
	const originalWebsites = originalData.websites || originalData;

	// Load scraped results
	const scrapedData = JSON.parse(fs.readFileSync(scrapedFile, 'utf8'));
	const scrapedDesigns = scrapedData.designs || [];

	console.log(`📊 Original websites: ${originalWebsites.length}`);
	console.log(`📊 Scraped designs: ${scrapedDesigns.length}`);
	console.log(`📊 Reported errors: ${scrapedData.metadata.errors}`);

	// Find items that failed (have no tags or minimal data)
	const failedItems = [];
	const successfulItems = [];

	scrapedDesigns.forEach((design, index) => {
		const originalWebsite = originalWebsites[index];

		// Check if scraping was successful by looking at tags
		const totalTags = Object.values(design.tags || {}).flat().length;

		if (totalTags === 0) {
			failedItems.push({
				index: index,
				original: originalWebsite,
				scraped: design
			});
		} else {
			successfulItems.push(design);
		}
	});

	console.log(`✅ Successful items: ${successfulItems.length}`);
	console.log(`❌ Failed items: ${failedItems.length}`);

	if (failedItems.length === 0) {
		console.log('🎉 No failed items found! All scraping was successful.');
		return;
	}

	console.log('\n📋 Failed items to re-scrape:');
	failedItems.forEach((item, i) => {
		console.log(`   ${i + 1}. ${item.original.name} (index ${item.index})`);
	});

	// Ask user if they want to proceed
	console.log(`\n🚀 Ready to re-scrape ${failedItems.length} failed items?`);
	console.log('Press Ctrl+C to cancel, or any key to continue...');

	// Wait for user input (simplified for script)
	await new Promise(resolve => setTimeout(resolve, 3000));

	// Re-scrape failed items
	console.log('\n🕷️  Starting re-scraping process...');

	const scraper = new WebsiteMetadataScraper({ delay: delay });
	const initialized = await scraper.initialize();

	if (!initialized) {
		console.error('❌ Failed to initialize scraper');
		process.exit(1);
	}

	const failedWebsites = failedItems.map(item => item.original);
	const results = await scraper.processWebsites(failedWebsites);

	await scraper.close();

	// Merge results with successful items
	const mergedResults = [...successfulItems];

	// Replace failed items with new results
	results.results.forEach((newResult, i) => {
		const failedItem = failedItems[i];
		mergedResults[failedItem.index] = {
			id: newResult.id || failedItem.scraped.id,
			image: newResult.screenshotUrl || newResult.thumbnailImage || failedItem.scraped.image,
			title: newResult.title || newResult.name || failedItem.scraped.title,
			tags: newResult.tags || {
				style: [],
				industry: [],
				typography: [],
				type: [],
				category: [],
				platform: [],
				colors: []
			}
		};
	});

	// Save merged results
	const finalData = {
		metadata: {
			scrapedAt: new Date().toISOString(),
			totalWebsites: mergedResults.length,
			source: 'resumed-scraping',
			originalErrors: scrapedData.metadata.errors,
			reprocessedItems: failedItems.length,
			finalErrors: results.errors.length
		},
		designs: mergedResults,
		errors: results.errors
	};

	fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));

	console.log(`\n✅ Resume scraping completed!`);
	console.log(`📄 Results saved to: ${outputFile}`);
	console.log(`📊 Total designs: ${mergedResults.length}`);
	console.log(`📊 Re-processed: ${failedItems.length}`);
	console.log(`❌ Final errors: ${results.errors.length}`);
}

if (require.main === module) {
	main().catch(error => {
		console.error('❌ Resume scraping failed:', error);
		process.exit(1);
	});
}