#!/usr/bin/env node

/**
 * Test script for image downloading functionality
 * Tests the new local image download feature
 */

const LandBookScraper = require('./scraper.js');

async function testImageDownload() {
	console.log('🧪 Testing Image Download Functionality\n');

	const scraper = new LandBookScraper({
		headless: true,
		maxItems: 3 // Just test with a few items
	});

	try {
		// Initialize scraper
		console.log('1. Initializing scraper...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize scraper');
		}

		// Test direct image download
		console.log('\n2. Testing direct image download...');
		const testImageUrl = 'https://cdn.land-book.com/website/81953/dbee8d92079439b2-www-hyperbolic-ai.webp?w=800&q=85&f=webp';
		const testDesignId = 'test-design-001';

		const localPath = await scraper.downloadImage(testImageUrl, testDesignId);
		if (localPath) {
			console.log(`✅ Successfully downloaded test image to: ${localPath}`);
		} else {
			console.log('❌ Failed to download test image');
		}

		// Test scraping with image download
		console.log('\n3. Testing scraping with image download...');

		// Navigate to a Land-book page
		const urlInfo = scraper.parseUrl('https://land-book.com/websites');
		await scraper.navigateToUrl(urlInfo);

		// Scrape a few items
		const scrapedData = await scraper.scrapeCurrentPage();
		console.log(`📊 Scraped ${scrapedData.length} items from page`);

		if (scrapedData.length > 0) {
			// Process first few items to test image downloading
			const testItems = scrapedData.slice(0, 2);
			console.log(`\n4. Processing ${testItems.length} items with image download...`);

			for (let i = 0; i < testItems.length; i++) {
				const item = testItems[i];
				console.log(`\n   Processing item ${i + 1}: ${item.websiteName || 'Untitled'}`);

				try {
					const processedDesign = await scraper.processRawDataToDesign(item, i);
					console.log(`   ✅ Processed successfully:`);
					console.log(`      ID: ${processedDesign.id}`);
					console.log(`      Image: ${processedDesign.image}`);
					console.log(`      Tags: ${Object.keys(processedDesign.tags).length} categories`);
				} catch (error) {
					console.log(`   ❌ Failed to process: ${error.message}`);
				}
			}
		}

		console.log('\n✅ Image download test completed successfully!');

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error(error.stack);
	} finally {
		// Clean up
		await scraper.close();
	}
}

// Run the test
if (require.main === module) {
	testImageDownload().catch(error => {
		console.error('Test execution failed:', error);
		process.exit(1);
	});
}

module.exports = { testImageDownload };