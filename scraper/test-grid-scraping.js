const LandBookScraper = require('./scraper.js');

async function testGridScraping() {
	console.log('🧪 Testing grid scraping functionality...\n');

	const scraper = new LandBookScraper({
		headless: true, // Run headless for testing
		slowMo: 50,
		maxItems: 5 // Limit for testing
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

		if (!gridResults.success) {
			throw new Error(`Grid scraping failed: ${gridResults.error}`);
		}

		console.log('   ✅ Grid scraping successful\n');

		console.log('📊 Results:');
		console.log(`   Total items found: ${gridResults.totalFound}`);
		console.log(`   Valid items: ${gridResults.validItems}`);
		console.log(`   Items scraped: ${gridResults.items.length}`);
		console.log(`   Error items: ${gridResults.errorItems}`);
		console.log(`   Items missing thumbnails: ${gridResults.noThumbnailItems || 0}\n`);

		if (gridResults.items.length > 0) {
			console.log('📋 Sample scraped items:');
			gridResults.items.slice(0, 3).forEach((item, index) => {
				console.log(`   ${index + 1}. ${item.title || 'Untitled'}`);
				console.log(`      Thumbnail: ${item.thumbnailUrl ? '✅' : '❌'} ${item.thumbnailUrl?.substring(0, 50)}${item.thumbnailUrl?.length > 50 ? '...' : ''}`);
				console.log(`      Detail URL: ${item.detailUrl?.substring(0, 50)}${item.detailUrl?.length > 50 ? '...' : ''}`);
				console.log(`      Element: ${item.element.tagName}.${item.element.className}`);
				console.log('');
			});
		}

		console.log('🎉 Grid scraping test completed successfully!');

		if (scraper.hasErrors()) {
			console.log('\n⚠️  Errors encountered during testing:');
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

testGridScraping().catch(console.error);