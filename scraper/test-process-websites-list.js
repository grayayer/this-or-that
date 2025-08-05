#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Test script to process the websites-list.json file and create a new data.json file
 * This simulates what the scraper would do with the extracted website data
 */

async function processWebsitesList() {
	console.log('🚀 Starting websites-list.json processing test...\n');

	try {
		// Read the websites-list.json file
		const websitesListPath = path.join(__dirname, '..', 'scrape-saved-html', 'websites-list.json');
		console.log(`📖 Reading websites list from: ${websitesListPath}`);

		if (!fs.existsSync(websitesListPath)) {
			throw new Error(`Websites list file not found: ${websitesListPath}`);
		}

		const websitesData = JSON.parse(fs.readFileSync(websitesListPath, 'utf8'));
		console.log(`✅ Loaded ${websitesData.websites.length} websites from list`);
		console.log(`📊 Metadata: ${JSON.stringify(websitesData.metadata, null, 2)}\n`);

		// Transform the data into the format expected by the This or That app
		const transformedDesigns = websitesData.websites.map((website, index) => {
			return {
				id: website.id || `design_${index + 1}`,
				name: website.name || `Design ${index + 1}`,
				description: generateDescription(website.name, website.category),
				image: website.localImagePath || website.thumbnailImage,
				category: website.category || 'Uncategorized',
				tags: generateTags(website.name, website.category),
				source: 'land-book',
				sourceUrl: website.postUrl,
				websitePath: website.websitePath,
				originalIndex: website.index || index + 1
			};
		});

		// Create the final data structure
		const outputData = {
			metadata: {
				generatedAt: new Date().toISOString(),
				totalDesigns: transformedDesigns.length,
				source: 'websites-list-processing',
				originalSource: websitesData.metadata.source,
				categories: [...new Set(transformedDesigns.map(d => d.category))].sort(),
				version: '1.0.0'
			},
			designs: transformedDesigns
		};

		// Write the processed data to a new file
		const outputPath = path.join(__dirname, '..', 'data', 'designs-from-websites-list.json');

		// Ensure the data directory exists
		const dataDir = path.dirname(outputPath);
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
			console.log(`📁 Created data directory: ${dataDir}`);
		}

		fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
		console.log(`💾 Processed data saved to: ${outputPath}`);

		// Display summary statistics
		console.log('\n📈 Processing Summary:');
		console.log(`   • Total designs processed: ${outputData.designs.length}`);
		console.log(`   • Categories found: ${outputData.metadata.categories.length}`);
		console.log(`   • Categories: ${outputData.metadata.categories.join(', ')}`);

		// Show sample of processed data
		console.log('\n🔍 Sample processed designs:');
		outputData.designs.slice(0, 3).forEach((design, index) => {
			console.log(`   ${index + 1}. ${design.name}`);
			console.log(`      Category: ${design.category}`);
			console.log(`      Tags: ${design.tags.join(', ')}`);
			console.log(`      Image: ${design.image}`);
			console.log('');
		});

		// Validate image paths exist
		console.log('🖼️  Validating image paths...');
		let validImages = 0;
		let missingImages = 0;

		for (const design of outputData.designs.slice(0, 10)) { // Check first 10 for speed
			const imagePath = path.join(__dirname, '..', 'scrape-saved-html', design.image);
			if (fs.existsSync(imagePath)) {
				validImages++;
			} else {
				missingImages++;
				console.log(`   ⚠️  Missing image: ${design.image}`);
			}
		}

		console.log(`   ✅ Valid images (sample): ${validImages}/10`);
		console.log(`   ❌ Missing images (sample): ${missingImages}/10`);

		console.log('\n🎉 Processing completed successfully!');
		console.log(`📄 Output file: ${outputPath}`);

		return outputPath;

	} catch (error) {
		console.error('❌ Error processing websites list:', error.message);
		throw error;
	}
}

/**
 * Generate a description based on the website name and category
 */
function generateDescription(name, category) {
	if (!name) return 'A beautiful website design';

	const categoryDescriptions = {
		'Landing Page': 'A compelling landing page design',
		'Ecommerce': 'An elegant ecommerce website',
		'Template': 'A professional website template',
		'Portfolio': 'A creative portfolio showcase',
		'Other': 'A unique website design'
	};

	const baseDescription = categoryDescriptions[category] || 'A modern website design';

	// Extract key terms from the name for more specific descriptions
	const healthTerms = ['health', 'medical', 'wellness', 'fitness', 'therapy', 'clinic'];
	const techTerms = ['AI', 'digital', 'app', 'software', 'platform'];
	const businessTerms = ['consulting', 'agency', 'studio', 'company'];

	const nameLower = name.toLowerCase();

	if (healthTerms.some(term => nameLower.includes(term))) {
		return `${baseDescription} focused on health and wellness`;
	} else if (techTerms.some(term => nameLower.includes(term))) {
		return `${baseDescription} showcasing modern technology`;
	} else if (businessTerms.some(term => nameLower.includes(term))) {
		return `${baseDescription} for professional services`;
	}

	return baseDescription;
}

/**
 * Generate relevant tags based on the website name and category
 */
function generateTags(name, category) {
	const tags = [];
	const nameLower = name.toLowerCase();

	// CATEGORY-BASED TAGS (Primary classification)
	if (category) {
		tags.push(category.toLowerCase().replace(/\s+/g, '-'));
	}

	// INDUSTRY & VERTICAL TAGS
	// Health & Medical
	if (nameLower.match(/\b(health|medical|wellness|fitness|therapy|clinic|hospital|doctor|nurse|patient|treatment|medicine|pharmaceutical|biotech|healthcare)\b/)) {
		tags.push('health');
		if (nameLower.match(/\b(medical|clinic|hospital|doctor|treatment|medicine|pharmaceutical)\b/)) tags.push('medical');
		if (nameLower.match(/\b(wellness|therapy|mental|mindfulness|meditation)\b/)) tags.push('wellness');
		if (nameLower.match(/\b(fitness|gym|workout|exercise|training|sport|athletic)\b/)) tags.push('fitness');
		if (nameLower.match(/\b(therapy|therapeutic|rehabilitation|recovery)\b/)) tags.push('therapy');
	}

	// Technology & Software
	if (nameLower.match(/\b(ai|artificial|intelligence|machine|learning|tech|software|app|platform|digital|saas|api|cloud|data|analytics)\b/)) {
		tags.push('technology');
		if (nameLower.match(/\b(ai|artificial|intelligence|machine|learning)\b/)) tags.push('ai');
		if (nameLower.match(/\b(software|app|platform|saas|tool)\b/)) tags.push('software');
		if (nameLower.match(/\b(digital|online|web|internet)\b/)) tags.push('digital');
		if (nameLower.match(/\b(data|analytics|insights|metrics|dashboard)\b/)) tags.push('analytics');
	}

	// Business & Professional Services
	if (nameLower.match(/\b(business|corporate|professional|consulting|agency|studio|company|enterprise|startup|venture)\b/)) {
		tags.push('business');
		if (nameLower.match(/\b(consulting|advisory|strategy|management)\b/)) tags.push('consulting');
		if (nameLower.match(/\b(agency|studio|creative|design)\b/)) tags.push('creative-agency');
	}

	// E-commerce & Retail
	if (nameLower.match(/\b(shop|store|buy|sell|product|commerce|retail|marketplace|cart|checkout|payment)\b/)) {
		tags.push('ecommerce');
		if (nameLower.match(/\b(marketplace|platform|multi)\b/)) tags.push('marketplace');
		if (nameLower.match(/\b(luxury|premium|high-end|exclusive)\b/)) tags.push('luxury');
	}

	// Education & Learning
	if (nameLower.match(/\b(education|learning|course|training|school|university|academy|teach|student|knowledge)\b/)) {
		tags.push('education');
		if (nameLower.match(/\b(online|e-learning|digital|virtual)\b/)) tags.push('online-learning');
	}

	// DESIGN STYLE TAGS
	// Modern & Contemporary
	if (nameLower.match(/\b(modern|contemporary|sleek|clean|minimal|simple|elegant|sophisticated)\b/)) {
		tags.push('modern');
		if (nameLower.match(/\b(minimal|minimalist|clean|simple)\b/)) tags.push('minimalist');
	}

	// Creative & Artistic
	if (nameLower.match(/\b(creative|artistic|bold|vibrant|colorful|unique|innovative|experimental)\b/)) {
		tags.push('creative');
		if (nameLower.match(/\b(bold|vibrant|colorful|bright)\b/)) tags.push('colorful');
	}

	// Professional & Corporate
	if (nameLower.match(/\b(professional|corporate|business|formal|enterprise|executive)\b/)) {
		tags.push('professional');
	}

	// FUNCTIONALITY TAGS
	// Interactive & Dynamic
	if (nameLower.match(/\b(interactive|dynamic|animation|motion|scroll|hover|transition)\b/)) {
		tags.push('interactive');
	}

	// Mobile & Responsive
	if (nameLower.match(/\b(mobile|responsive|adaptive|device|phone|tablet)\b/)) {
		tags.push('mobile-friendly');
	}

	// TECHNICAL IMPLEMENTATION TAGS
	if (nameLower.match(/\b(webflow|wordpress|react|vue|angular|javascript|css|html)\b/)) {
		tags.push('web-development');
		if (nameLower.match(/\b(webflow)\b/)) tags.push('webflow');
		if (nameLower.match(/\b(wordpress)\b/)) tags.push('wordpress');
		if (nameLower.match(/\b(react|vue|angular|javascript)\b/)) tags.push('javascript-framework');
	}

	// CONTENT TYPE TAGS
	if (nameLower.match(/\b(blog|news|article|content|media|publication)\b/)) {
		tags.push('content');
	}

	if (nameLower.match(/\b(portfolio|showcase|gallery|work|project)\b/)) {
		tags.push('portfolio');
	}

	// TARGET AUDIENCE TAGS
	if (nameLower.match(/\b(startup|entrepreneur|founder|small business|smb)\b/)) {
		tags.push('startup');
	}

	if (nameLower.match(/\b(enterprise|corporation|large|big|global)\b/)) {
		tags.push('enterprise');
	}

	if (nameLower.match(/\b(personal|individual|freelancer|solo)\b/)) {
		tags.push('personal');
	}

	// SPECIAL FEATURES TAGS
	if (nameLower.match(/\b(dashboard|admin|control|panel|management)\b/)) {
		tags.push('dashboard');
	}

	if (nameLower.match(/\b(landing|page|conversion|lead|signup)\b/)) {
		tags.push('landing-page');
	}

	if (nameLower.match(/\b(booking|appointment|schedule|calendar|reservation)\b/)) {
		tags.push('booking');
	}

	// COLOR & AESTHETIC TAGS (inferred from common patterns)
	if (nameLower.match(/\b(dark|black|night|shadow)\b/)) {
		tags.push('dark-theme');
	}

	if (nameLower.match(/\b(light|bright|white|clean)\b/)) {
		tags.push('light-theme');
	}

	if (nameLower.match(/\b(blue|green|red|purple|orange|yellow)\b/)) {
		tags.push('colorful');
	}

	// GEOGRAPHIC/REGIONAL TAGS
	if (nameLower.match(/\b(global|international|worldwide)\b/)) {
		tags.push('global');
	}

	if (nameLower.match(/\b(local|community|neighborhood|city)\b/)) {
		tags.push('local');
	}

	// FALLBACK TAGS - ensure we always have meaningful tags
	if (tags.length === 0) {
		// Analyze the structure of the name for fallback tags
		if (nameLower.includes('|') || nameLower.includes('–') || nameLower.includes('-')) {
			tags.push('branded', 'professional');
		} else {
			tags.push('website', 'design');
		}
	}

	// QUALITY ENHANCEMENT - add semantic tags based on combinations
	if (tags.includes('health') && tags.includes('technology')) {
		tags.push('healthtech');
	}

	if (tags.includes('business') && tags.includes('software')) {
		tags.push('b2b-saas');
	}

	if (tags.includes('ecommerce') && tags.includes('luxury')) {
		tags.push('premium-retail');
	}

	// Remove duplicates and prioritize most relevant tags (limit to 8 for rich data)
	const uniqueTags = [...new Set(tags)];

	// Prioritize tags by importance (category, industry, style, functionality)
	const priorityOrder = [
		'health', 'medical', 'wellness', 'fitness', 'therapy',
		'technology', 'ai', 'software', 'digital',
		'business', 'consulting', 'ecommerce', 'education',
		'modern', 'minimalist', 'creative', 'professional',
		'landing-page', 'portfolio', 'dashboard', 'interactive',
		'startup', 'enterprise', 'personal',
		'webflow', 'wordpress', 'mobile-friendly'
	];

	// Sort tags by priority, keeping high-value tags first
	const sortedTags = uniqueTags.sort((a, b) => {
		const aIndex = priorityOrder.indexOf(a);
		const bIndex = priorityOrder.indexOf(b);
		if (aIndex === -1 && bIndex === -1) return 0;
		if (aIndex === -1) return 1;
		if (bIndex === -1) return -1;
		return aIndex - bIndex;
	});

	return sortedTags.slice(0, 8); // Return up to 8 most relevant tags
}

// Run the test if this file is executed directly
if (require.main === module) {
	processWebsitesList()
		.then((outputPath) => {
			console.log(`\n✨ Test completed! Check the output at: ${outputPath}`);
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n💥 Test failed:', error);
			process.exit(1);
		});
}

module.exports = { processWebsitesList };