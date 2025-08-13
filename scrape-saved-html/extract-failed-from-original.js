#!/usr/bin/env node

/**
 * Extract Failed Items from Original List
 * Creates a list of failed items using the original website list data
 */

const fs = require('fs');

function extractFailedFromOriginal(originalFile, dataFile) {
	console.log('🔍 Extracting failed items from original list...');

	try {
		const originalData = JSON.parse(fs.readFileSync(originalFile, 'utf8'));
		const scrapedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

		// Find items with no tags (likely failed scrapes)
		const failedIds = scrapedData.designs
			.filter(design => {
				const totalTags = Object.values(design.tags || {}).flat().length;
				return totalTags === 0;
			})
			.map(design => design.id);

		console.log(`🚫 Found ${failedIds.length} failed items`);

		// Find the original website data for failed items
		const originalWebsites = originalData.websites || originalData;
		const failedWebsites = originalWebsites.filter(website =>
			failedIds.includes(website.id)
		);

		console.log(`📋 Matched ${failedWebsites.length} items from original list`);

		if (failedWebsites.length > 0) {
			// Save failed items for re-processing
			const failedData = {
				metadata: {
					extractedAt: new Date().toISOString(),
					totalWebsites: failedWebsites.length,
					source: 'failed-items-from-original'
				},
				websites: failedWebsites
			};

			const failedFile = dataFile.replace('.json', '-failed-corrected.json');
			fs.writeFileSync(failedFile, JSON.stringify(failedData, null, 2));
			console.log(`💾 Failed items saved to: ${failedFile}`);
			console.log(`\nTo re-scrape failed items, run:`);
			console.log(`node scrape-metadata.js ${failedFile} --output ${dataFile.replace('.json', '-retry-corrected.json')}`);

			// Show first few URLs for verification
			console.log(`\n🔗 Sample URLs:`);
			failedWebsites.slice(0, 3).forEach((item, index) => {
				console.log(`   ${index + 1}. ${item.name}`);
				console.log(`      ${item.postUrl}`);
			});
		}

	} catch (error) {
		console.error(`❌ Error: ${error.message}`);
	}
}

// Run if called directly
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		console.log('Usage: node extract-failed-from-original.js <original-list.json> <scraped-data.json>');
		console.log('Example: node extract-failed-from-original.js personal-site-list.json personal-sites-data.json');
		process.exit(1);
	}

	extractFailedFromOriginal(args[0], args[1]);
}