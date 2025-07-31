const LandBookScraper = require('./scraper.js');

async function debugUrls() {
	console.log('🔍 Debugging URL extraction from grid page\n');

	const scraper = new LandBookScraper({
		headless: true,
		maxItems: 5 // Just a few for debugging
	});

	try {
		await scraper.initialize();

		const url = 'https://land-book.com/?industry=health-and-fitness';
		const urlInfo = {
			originalUrl: url,
			pageType: 'gallery',
			params: { industry: 'health-and-fitness' }
		};

		await scraper.navigateToUrl(urlInfo);

		// Let's examine what URLs we're actually extracting
		console.log('🕷️ Extracting URLs from grid...');
		const gridResults = await scraper.scrapeGridPage();

		console.log(`Found ${gridResults.items.length} items\n`);

		gridResults.items.forEach((item, index) => {
			console.log(`${index + 1}. Title: ${item.title}`);
			console.log(`   Detail URL: ${item.detailUrl}`);
			console.log(`   Thumbnail: ${item.thumbnailUrl}`);
			console.log('');
		});

		// Let's also examine the raw HTML to see what links are available
		console.log('🔍 Examining page structure...');
		const pageAnalysis = await scraper.page.evaluate(() => {
			const websiteItems = document.querySelectorAll('.website-item-wrapper, .website-item, [data-website-id]');

			return Array.from(websiteItems).slice(0, 3).map((item, index) => {
				const links = item.querySelectorAll('a');
				return {
					index,
					itemClasses: item.className,
					itemId: item.id,
					links: Array.from(links).map(link => ({
						href: link.href,
						text: link.textContent.trim(),
						classes: link.className
					}))
				};
			});
		});

		console.log('Raw page analysis:');
		console.log(JSON.stringify(pageAnalysis, null, 2));

	} catch (error) {
		console.error('Debug failed:', error.message);
	} finally {
		await scraper.close();
	}
}

debugUrls().catch(console.error);