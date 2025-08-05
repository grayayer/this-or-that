#!/usr/bin/env node

const LandBookJsonScraper = require('./json-scraper');
const fs = require('fs').promises;
const path = require('path');

/**
 * Test script for the JSON-based scraper
 * This processes the websites-list.json file and creates enhanced data with rich tags
 */

async function testJsonScraper() {
	console.log('🚀 Testing JSON-based Land-book scraper...\n');

	const scraper = new LandBookJsonScraper({
		headless: true,
		downloadImages: false, // Set to true if you want to download images
		enhancedTags: true,    // Generate rich tag data
		maxItems: 100         // Process all 100 designs from the HTML file
	});

	try {
		// Load JSON data
		const jsonPath = path.join(__dirname, '..', 'scrape-saved-html', 'websites-list.json');
		console.log(`📄 Loading JSON data from: ${jsonPath}`);

		const success = await scraper.loadJsonData(jsonPath);
		if (!success) {
			throw new Error('Failed to load JSON data');
		}

		// Initialize browser for detail scraping
		console.log('\n🌐 Initializing browser for detail scraping...');
		const browserReady = await scraper.initialize();
		if (!browserReady) {
			console.log('⚠️  Browser initialization failed, proceeding with basic processing only');
		}

		// Process the data
		console.log('\n🕷️  Starting data processing...');
		const result = await scraper.processJsonData();

		if (result.success) {
			// Save the enhanced data
			const outputPath = path.join(__dirname, '..', 'data', 'designs-enhanced.json');
			await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

			console.log(`\n💾 Enhanced data saved to: ${outputPath}`);

			// Display summary
			console.log('\n📊 Processing Summary:');
			console.log(`   • Total designs: ${result.designs.length}`);
			console.log(`   • Categories: ${result.metadata.categories.length}`);
			console.log(`   • Unique tags: ${result.metadata.tags.length}`);
			console.log(`   • Errors: ${result.errors.length}`);

			// Show sample of enhanced data
			console.log('\n🔍 Sample enhanced designs:');
			result.designs.slice(0, 3).forEach((design, index) => {
				console.log(`\n   ${index + 1}. ${design.name}`);
				console.log(`      Category: ${design.category}`);
				console.log(`      Description: ${design.description}`);
				console.log(`      Tags (${design.tags.length}): ${design.tags.join(', ')}`);
				if (design.colors && design.colors.length > 0) {
					console.log(`      Colors: ${design.colors.join(', ')}`);
				}
				if (design.websiteUrl) {
					console.log(`      Website: ${design.websiteUrl}`);
				}
			});

			// Show tag distribution
			console.log('\n🏷️  Top Tags:');
			const tagCounts = {};
			result.designs.forEach(design => {
				design.tags.forEach(tag => {
					tagCounts[tag] = (tagCounts[tag] || 0) + 1;
				});
			});

			const sortedTags = Object.entries(tagCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 15);

			sortedTags.forEach(([tag, count]) => {
				console.log(`   • ${tag}: ${count} designs`);
			});

			console.log('\n🎉 JSON scraper test completed successfully!');

		} else {
			throw new Error('Processing failed');
		}

	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		if (scraper.errors.length > 0) {
			console.log('\n🔍 Detailed errors:');
			scraper.errors.forEach((err, index) => {
				console.log(`   ${index + 1}. ${err.type}: ${err.error}`);
			});
		}
	} finally {
		// Clean up
		await scraper.close();
	}
}

// Run the test if this file is executed directly
if (require.main === module) {
	testJsonScraper()
		.then(() => {
			console.log('\n✨ Test completed!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n💥 Test failed:', error);
			process.exit(1);
		});
}

module.exports = { testJsonScraper };