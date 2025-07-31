const LandBookScraper = require('./scraper.js');

async function testRealWebsiteDetail() {
	console.log('🧪 Testing real website detail page extraction...\n');

	const scraper = new LandBookScraper({
		headless: false, // Show browser to debug
		slowMo: 300,
		maxItems: 10 // Get more items to find real websites
	});

	try {
		console.log('1. Initializing browser...');
		const initialized = await scraper.initialize();
		if (!initialized) {
			throw new Error('Failed to initialize browser');
		}
		console.log('   ✅ Browser initialized\n');

		// Try a different category that might have real websites
		const testUrl = 'https://land-book.com/?industry=education';
		console.log(`2. Testing URL: ${testUrl}`);

		const urlInfo = {
			pageType: 'gallery',
			params: { industry: 'education' },
			originalUrl: testUrl,
			industry: 'education'
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

		console.log('4. Looking for real website detail pages...');
		let realWebsiteFound = false;

		for (let i = 0; i < Math.min(gridResults.items.length, 5); i++) {
			const item = gridResults.items[i];
			console.log(`\n   Testing item ${i + 1}: ${item.title || 'Untitled'}`);
			console.log(`   URL: ${item.detailUrl}`);

			// Skip if URL looks like a template page
			if (item.detailUrl.includes('/template') || item.detailUrl.includes('framer.link')) {
				console.log('   ⏭️  Skipping template/framer link');
				continue;
			}

			const detailResult = await scraper.scrapeDetailPage(item.detailUrl);

			if (detailResult.success) {
				const data = detailResult.data;

				// Check if this looks like a real website with taxonomy data
				const hasTaxonomy = data.category.length > 0 || data.style.length > 0 ||
					data.industry.length > 0 || data.type.length > 0 ||
					data.platform.length > 0 || data.colors.length > 0;

				if (hasTaxonomy || data.websiteUrl) {
					console.log('\n   🎯 Found real website with data!');
					console.log(`   Website Name: ${data.websiteName}`);
					console.log(`   Website URL: ${data.websiteUrl || 'Not found'}`);
					console.log(`   Category: ${data.category.length > 0 ? data.category.join(', ') : 'Not found'}`);
					console.log(`   Style: ${data.style.length > 0 ? data.style.join(', ') : 'Not found'}`);
					console.log(`   Industry: ${data.industry.length > 0 ? data.industry.join(', ') : 'Not found'}`);
					console.log(`   Type: ${data.type.length > 0 ? data.type.join(', ') : 'Not found'}`);
					console.log(`   Platform: ${data.platform.length > 0 ? data.platform.join(', ') : 'Not found'}`);
					console.log(`   Colors: ${data.colors.length > 0 ? data.colors.join(', ') : 'None found'}`);
					console.log(`   Tags: ${data.tags.length > 0 ? data.tags.slice(0, 5).join(', ') : 'None'}`);
					console.log(`   Screenshot: ${data.screenshotUrl ? '✅ Found' : '❌ Not found'}`);

					realWebsiteFound = true;
					break;
				} else {
					console.log('   ⚠️  No taxonomy data found for this item');
				}
			} else {
				console.log(`   ❌ Failed to scrape: ${detailResult.error}`);
			}

			// Small delay between tests
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		if (!realWebsiteFound) {
			console.log('\n⚠️  No real websites with taxonomy data found in this sample');
			console.log('   This might be due to Land-book\'s current content or page structure changes');
		}

		console.log('\n🎉 Real website detail test completed!');

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		process.exit(1);
	} finally {
		console.log('\n⏳ Keeping browser open for 3 seconds to review...');
		await new Promise(resolve => setTimeout(resolve, 3000));
		await scraper.close();
	}
}

testRealWebsiteDetail().catch(console.error);