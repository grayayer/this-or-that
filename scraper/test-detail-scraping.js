const LandBookScraper = require('./scraper.js');

async function testDetailScraping() {
	console.log('🧪 Testing detail page scraping functionality...\n');

	const scraper = new LandBookScraper({
		headless: true, // Run headless for testing
		slowMo: 100,
		maxItems: 2 // Limit for testing
	});

	try {
		console.log('1. Initializing browser...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize browser');
		}
		console.log('   ✅ Browser initialized\n');

		// Test with a simple URL
		const testUrl = 'https://land-book.com/?type=personal';
		console.log(`2. Testing URL: ${testUrl}`);

		const urlInfo = {
			pageType: 'gallery',
			params: { type: 'personal' },
			originalUrl: testUrl,
			type: 'personal'
		};

		const navigated = await scraper.navigateToUrl(urlInfo);
		if (!navigated) {
			throw new Error('Failed to navigate to test URL');
		}
		console.log('   ✅ Navigation successful\n');

		console.log('3. Testing grid scraping...');
		const gridResults = await scraper.scrapeGridPage();

		if (!gridResults.success || gridResults.items.length === 0) {
			throw new Error(`Grid scraping failed or no items found`);
		}
		console.log(`   ✅ Grid scraping successful - found ${gridResults.items.length} items\n`);

		console.log('4. Testing detail page scraping...');
		const detailResults = await scraper.scrapeAllDetailPages(gridResults.items);

		if (!detailResults.success) {
			throw new Error('Detail scraping failed');
		}
		console.log('   ✅ Detail scraping successful\n');

		console.log('📊 Results:');
		console.log(`   Items processed: ${detailResults.totalProcessed}`);
		console.log(`   Successfully scraped: ${detailResults.successCount}`);
		console.log(`   Errors: ${detailResults.errorCount}\n`);

		if (detailResults.results.length > 0) {
			console.log('📋 Sample scraped detail data:');
			detailResults.results.slice(0, 2).forEach((item, index) => {
				console.log(`   ${index + 1}. ${item.websiteName}`);
				console.log(`      Website URL: ${item.websiteUrl || 'Not found'}`);
				console.log(`      Category: ${item.category || 'Not specified'}`);
				console.log(`      Style: ${item.style || 'Not specified'}`);
				console.log(`      Industry: ${item.industry || 'Not specified'}`);
				console.log(`      Type: ${item.type || 'Not specified'}`);
				console.log(`      Colors: ${item.colors.length > 0 ? item.colors.join(', ') : 'None found'}`);
				console.log(`      Tags: ${item.tags.length > 0 ? item.tags.slice(0, 3).join(', ') : 'None'}`);
				console.log(`      Screenshot: ${item.screenshotUrl ? '✅' : '❌'}`);
				console.log(`      Thumbnail: ${item.thumbnailUrl ? '✅' : '❌'}`);
				console.log('');
			});
		}

		if (detailResults.errors.length > 0) {
			console.log('⚠️  Errors encountered:');
			detailResults.errors.slice(0, 3).forEach((error, index) => {
				console.log(`   ${index + 1}. ${error.url}: ${error.error}`);
			});
			console.log('');
		}

		console.log('🎉 Detail scraping test completed successfully!');

		if (scraper.hasErrors()) {
			console.log('\n⚠️  Additional errors from scraper:');
			scraper.getErrors().forEach((error, index) => {
				console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
			});
		}

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		process.exit(1);
	} finally {
		await scraper.close();
	}
}

testDetailScraping().catch(console.error);