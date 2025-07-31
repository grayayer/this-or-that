const LandBookScraper = require('./scraper.js');

async function testSpecificDetailPage() {
	console.log('🧪 Testing specific detail page with rich taxonomy data...\n');

	const scraper = new LandBookScraper({
		headless: false, // Show browser to see what's happening
		slowMo: 200,
		maxItems: 3
	});

	try {
		console.log('1. Initializing browser...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize browser');
		}
		console.log('   ✅ Browser initialized\n');

		// Test with a URL that should have more taxonomy data
		const testUrl = 'https://land-book.com/?industry=health-and-fitness&style=light-colors';
		console.log(`2. Testing URL: ${testUrl}`);

		const urlInfo = {
			pageType: 'gallery',
			params: { industry: 'health-and-fitness', style: 'light-colors' },
			originalUrl: testUrl,
			industry: 'health-and-fitness',
			style: 'light-colors'
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

		console.log('4. Testing detail page scraping on first item...');
		if (gridResults.items.length > 0) {
			const firstItem = gridResults.items[0];
			console.log(`   Testing with: ${firstItem.title || 'Untitled'}`);
			console.log(`   URL: ${firstItem.detailUrl}`);

			const detailResult = await scraper.scrapeDetailPage(firstItem.detailUrl);

			if (detailResult.success) {
				console.log('\n📋 Detailed extraction results:');
				const data = detailResult.data;
				console.log(`   Website Name: ${data.websiteName}`);
				console.log(`   Website URL: ${data.websiteUrl || 'Not found'}`);
				console.log(`   Category: ${data.category.length > 0 ? data.category.join(', ') : 'Not found'}`);
				console.log(`   Style: ${data.style.length > 0 ? data.style.join(', ') : 'Not found'}`);
				console.log(`   Industry: ${data.industry.length > 0 ? data.industry.join(', ') : 'Not found'}`);
				console.log(`   Type: ${data.type.length > 0 ? data.type.join(', ') : 'Not found'}`);
				console.log(`   Platform: ${data.platform.length > 0 ? data.platform.join(', ') : 'Not found'}`);
				console.log(`   Colors: ${data.colors.length > 0 ? data.colors.join(', ') : 'None found'}`);
				console.log(`   Tags: ${data.tags.length > 0 ? data.tags.join(', ') : 'None'}`);
				console.log(`   Screenshot: ${data.screenshotUrl ? '✅ Found' : '❌ Not found'}`);
				console.log(`   Thumbnail: ${firstItem.thumbnailUrl ? '✅ Found' : '❌ Not found'}`);
			} else {
				console.error('❌ Detail scraping failed:', detailResult.error);
			}
		}

		console.log('\n🎉 Specific detail page test completed!');

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		process.exit(1);
	} finally {
		// Keep browser open for a moment to see results
		console.log('\n⏳ Keeping browser open for 5 seconds to review...');
		await new Promise(resolve => setTimeout(resolve, 5000));
		await scraper.close();
	}
}

testSpecificDetailPage().catch(console.error);