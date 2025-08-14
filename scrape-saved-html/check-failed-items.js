#!/usr/bin/env node

/**
 * Check Failed Items
 * Identifies which items failed to scrape properly and need to be re-processed
 */

const fs = require('fs');

function checkFailedItems(dataFile) {
	console.log('🔍 Checking for failed items...');

	try {
		const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

		console.log(`📊 Total items: ${data.designs.length}`);
		console.log(`❌ Reported errors: ${data.errors.length}`);

		// Find items with no tags (likely failed scrapes)
		const failedItems = data.designs.filter(design => {
			const totalTags = Object.values(design.tags || {}).flat().length;
			return totalTags === 0;
		});

		console.log(`🚫 Items with no tags (likely failed): ${failedItems.length}`);

		if (failedItems.length > 0) {
			console.log('\n📋 Failed items:');
			failedItems.forEach((item, index) => {
				console.log(`   ${index + 1}. ${item.title} (ID: ${item.id})`);
			});

			// Save failed items for re-processing
			const failedData = {
				metadata: {
					extractedAt: new Date().toISOString(),
					totalWebsites: failedItems.length,
					source: 'failed-items-extraction'
				},
				websites: failedItems.map(item => ({
					id: item.id,
					name: item.title,
					postUrl: item.postUrl || `https://land-book.com/websites/${item.id.replace('website_', '')}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`,
					websitePath: item.websitePath,
					thumbnailImage: item.image,
					category: null,
					index: parseInt(item.id.replace('website_', ''))
				}))
			};

			const failedFile = dataFile.replace('.json', '-failed.json');
			fs.writeFileSync(failedFile, JSON.stringify(failedData, null, 2));
			console.log(`\n💾 Failed items saved to: ${failedFile}`);
			console.log(`\nTo re-scrape failed items, run:`);
			console.log(`node scrape-metadata.js ${failedFile} --output ${dataFile.replace('.json', '-retry.json')}`);
		} else {
			console.log('\n✅ All items appear to have been scraped successfully!');
		}

		// Show some statistics
		const itemsWithTags = data.designs.filter(design => {
			const totalTags = Object.values(design.tags || {}).flat().length;
			return totalTags > 0;
		});

		console.log(`\n📈 Statistics:`);
		console.log(`   Items with tags: ${itemsWithTags.length}/${data.designs.length}`);
		console.log(`   Success rate: ${Math.round((itemsWithTags.length / data.designs.length) * 100)}%`);

		if (itemsWithTags.length > 0) {
			const avgTags = itemsWithTags.reduce((sum, item) => {
				return sum + Object.values(item.tags || {}).flat().length;
			}, 0) / itemsWithTags.length;

			console.log(`   Average tags per successful item: ${Math.round(avgTags)}`);
		}

	} catch (error) {
		console.error(`❌ Error checking failed items: ${error.message}`);
	}
}

// Run if called directly
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log('Usage: node check-failed-items.js <data-file.json>');
		console.log('Example: node check-failed-items.js personal-sites-data.json');
		process.exit(1);
	}

	checkFailedItems(args[0]);
}

module.exports = { checkFailedItems };