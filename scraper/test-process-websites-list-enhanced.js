#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Enhanced test script to process the websites-list.json file and create a comprehensive data.json file
 * This version generates rich tag data similar to the original designs.json format
 */

async function processWebsitesList() {
	console.log('🚀 Starting enhanced websites-list.json processing...\n');

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

		// Transform the data into the enhanced format
		const transformedDesigns = websitesData.websites.map((website, index) => {
			const tags = generateComprehensiveTags(website.name, website.category);

			return {
				id: website.id || `design_${index + 1}`,
				name: website.name || `Design ${index + 1}`,
				description: generateDescription(website.name, website.category),
				image: website.localImagePath || website.thumbnailImage,
				tags: tags, // Rich tag structure like original
				title: website.name || `Design ${index + 1}`,
				source: 'land-book',
				sourceUrl: website.postUrl,
				websitePath: website.websitePath,
				originalIndex: website.index || index + 1,
				category: website.category || 'Uncategorized'
			};
		});

		// Create the final data structure
		const outputData = {
			metadata: {
				generatedAt: new Date().toISOString(),
				totalDesigns: transformedDesigns.length,
				source: 'enhanced-websites-list-processing',
				originalSource: websitesData.metadata.source,
				categories: [...new Set(transformedDesigns.map(d => d.category))].sort(),
				version: '2.0.0',
				formatErrors: 0
			},
			designs: transformedDesigns
		};

		// Write the processed data to a new file
		const outputPath = path.join(__dirname, '..', 'data', 'designs-enhanced.json');

		// Ensure the data directory exists
		const dataDir = path.dirname(outputPath);
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
			console.log(`📁 Created data directory: ${dataDir}`);
		}

		fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
		console.log(`💾 Enhanced data saved to: ${outputPath}`);

		// Display summary statistics
		console.log('\n📈 Processing Summary:');
		console.log(`   • Total designs processed: ${outputData.designs.length}`);
		console.log(`   • Categories found: ${outputData.metadata.categories.length}`);
		console.log(`   • Categories: ${outputData.metadata.categories.join(', ')}`);

		// Show sample of processed data with rich tags
		console.log('\n🔍 Sample enhanced designs:');
		outputData.designs.slice(0, 3).forEach((design, index) => {
			console.log(`   ${index + 1}. ${design.name}`);
			console.log(`      Category: ${design.category}`);
			console.log(`      Style: ${design.tags.style.join(', ')}`);
			console.log(`      Industry: ${design.tags.industry.join(', ')}`);
			console.log(`      Type: ${design.tags.type.join(', ')}`);
			console.log(`      Platform: ${design.tags.platform.join(', ') || 'Not specified'}`);
			console.log(`      Colors: ${design.tags.colors.slice(0, 3).join(', ')}...`);
			console.log('');
		});

		console.log('\n🎉 Enhanced processing completed successfully!');
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
 * Generate comprehensive tags similar to the original designs.json format
 */
function generateComprehensiveTags(name, category) {
	const nameLower = name.toLowerCase();

	// Generate style tags
	const style = [];
	if (nameLower.includes('animation') || nameLower.includes('animated')) style.push('Animation');
	if (nameLower.includes('card') || nameLower.includes('cards')) style.push('Cards');
	if (nameLower.includes('minimal') || nameLower.includes('clean')) style.push('Minimal');
	if (nameLower.includes('modern')) style.push('Modern');
	if (nameLower.includes('gradient')) style.push('Gradient');
	if (nameLower.includes('illustration')) style.push('Illustration');
	if (nameLower.includes('3d')) style.push('3D');
	if (nameLower.includes('parallax')) style.push('Parallax');
	if (nameLower.includes('video')) style.push('Background Video');
	if (nameLower.includes('image')) style.push('Background Image');
	if (nameLower.includes('big') || nameLower.includes('large')) style.push('Big Type');
	if (nameLower.includes('footer')) style.push('Big Footer');
	if (nameLower.includes('pastel')) style.push('Pastel Colors');
	if (nameLower.includes('flat')) style.push('Flat Design');
	if (nameLower.includes('people') || nameLower.includes('person')) style.push('People');
	if (nameLower.includes('border')) style.push('Visible Borders');

	// Generate industry tags
	const industry = [];
	if (nameLower.includes('health') || nameLower.includes('medical') || nameLower.includes('wellness') ||
		nameLower.includes('fitness') || nameLower.includes('clinic') || nameLower.includes('therapy')) {
		industry.push('Health & Fitness');
	}
	if (nameLower.includes('tech') || nameLower.includes('software') || nameLower.includes('ai') ||
		nameLower.includes('digital') || nameLower.includes('platform')) {
		industry.push('Tech');
	}
	if (nameLower.includes('ecommerce') || nameLower.includes('shop') || nameLower.includes('store') ||
		nameLower.includes('commerce')) {
		industry.push('Ecommerce');
	}
	if (nameLower.includes('design') || nameLower.includes('creative') || nameLower.includes('studio')) {
		industry.push('Design');
	}
	if (nameLower.includes('education') || nameLower.includes('learning') || nameLower.includes('course') ||
		nameLower.includes('school')) {
		industry.push('Education');
	}
	if (nameLower.includes('finance') || nameLower.includes('banking') || nameLower.includes('payment') ||
		nameLower.includes('insurance')) {
		industry.push('Finance');
	}
	if (nameLower.includes('food') || nameLower.includes('restaurant') || nameLower.includes('recipe') ||
		nameLower.includes('drink')) {
		industry.push('Food & Drinks');
	}
	if (nameLower.includes('beauty') || nameLower.includes('cosmetic') || nameLower.includes('skincare') ||
		nameLower.includes('spa')) {
		industry.push('Beauty');
	}
	if (nameLower.includes('music') || nameLower.includes('audio') || nameLower.includes('sound')) {
		industry.push('Music');
	}
	if (nameLower.includes('travel') || nameLower.includes('hotel') || nameLower.includes('booking')) {
		industry.push('Travel');
	}
	if (nameLower.includes('hr') || nameLower.includes('human resources') || nameLower.includes('recruiting')) {
		industry.push('HR');
	}
	if (nameLower.includes('real estate') || nameLower.includes('property')) {
		industry.push('Real Estate');
	}
	if (nameLower.includes('furniture') || nameLower.includes('interior')) {
		industry.push('Furniture & Interiors');
	}
	if (nameLower.includes('automotive') || nameLower.includes('car') || nameLower.includes('vehicle')) {
		industry.push('Automotive');
	}
	if (nameLower.includes('nature') || nameLower.includes('environment') || nameLower.includes('green')) {
		industry.push('Nature');
	}

	// Generate typography tags
	const typography = [];
	if (nameLower.includes('serif') || category === 'Portfolio' || nameLower.includes('elegant') ||
		nameLower.includes('luxury')) {
		typography.push('Serif');
	} else {
		typography.push('Sans Serif');
	}

	// Generate type tags
	const type = [];
	if (nameLower.includes('app') || nameLower.includes('mobile')) type.push('Mobile App');
	if (nameLower.includes('software') || nameLower.includes('platform') || nameLower.includes('tool') ||
		nameLower.includes('saas')) type.push('Software');
	if (nameLower.includes('service') || nameLower.includes('consulting') || nameLower.includes('agency')) type.push('Service');
	if (nameLower.includes('template') || category === 'Template') type.push('Template');
	if (nameLower.includes('portfolio') || category === 'Portfolio' || nameLower.includes('personal')) type.push('Personal');
	if (nameLower.includes('ecommerce') || nameLower.includes('shop') || nameLower.includes('store') ||
		nameLower.includes('product')) type.push('Physical Product');
	if (nameLower.includes('web app') || nameLower.includes('webapp')) type.push('Web App');
	if (nameLower.includes('agency') || nameLower.includes('studio') || nameLower.includes('company')) type.push('Agency');
	if (nameLower.includes('beta') || nameLower.includes('preview')) type.push('Beta');
	if (nameLower.includes('resource') || nameLower.includes('library')) type.push('Resource');
	if (nameLower.includes('os app') || nameLower.includes('desktop')) type.push('OS App');

	// Generate platform tags
	const platform = [];
	if (nameLower.includes('webflow')) platform.push('Webflow');
	if (nameLower.includes('shopify')) platform.push('Shopify');
	if (nameLower.includes('wordpress')) platform.push('WordPress');
	if (nameLower.includes('framer')) platform.push('Framer');
	if (nameLower.includes('squarespace')) platform.push('Squarespace');

	// Generate color palette (simplified - in real implementation you'd analyze the actual images)
	const colors = generateColorPalette(nameLower, category);

	// Ensure we have at least some data in each category
	if (style.length === 0) {
		if (nameLower.includes('modern') || nameLower.includes('clean')) {
			style.push('Modern');
		} else if (nameLower.includes('minimal')) {
			style.push('Minimal');
		} else {
			style.push('Cards');
		}
	}

	if (industry.length === 0) {
		if (category === 'Ecommerce') industry.push('Ecommerce');
		else if (category === 'Landing Page') industry.push('Tech');
		else if (category === 'Portfolio') industry.push('Design');
		else industry.push('Design');
	}

	if (type.length === 0) {
		if (category === 'Ecommerce') type.push('Physical Product');
		else if (category === 'Portfolio') type.push('Personal');
		else if (category === 'Template') type.push('Template');
		else type.push('Service');
	}

	return {
		style,
		industry,
		typography,
		type,
		category: [category || 'Landing'],
		platform,
		colors
	};
}

/**
 * Generate a color palette based on content analysis
 */
function generateColorPalette(nameLower, category) {
	// This is a simplified version - in a real implementation,
	// you'd analyze the actual images to extract colors
	const colorPalettes = {
		'health': ['#F0F8FF', '#E6F3FF', '#4A90E2', '#2E5BBA', '#1E3A8A', '#0F172A', '#64748B', '#94A3B8', '#CBD5E1', '#F1F5F9'],
		'tech': ['#F8FAFC', '#E2E8F0', '#64748B', '#334155', '#1E293B', '#0F172A', '#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
		'ecommerce': ['#FEF7ED', '#FED7AA', '#FB923C', '#EA580C', '#C2410C', '#9A3412', '#7C2D12', '#451A03', '#292524', '#1C1917'],
		'design': ['#FAF5FF', '#E9D5FF', '#C084FC', '#9333EA', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95', '#3730A3', '#312E81'],
		'portfolio': ['#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827'],
		'template': ['#FEFCE8', '#FEF3C7', '#FDE047', '#FACC15', '#EAB308', '#CA8A04', '#A16207', '#854D0E', '#713F12', '#451A03'],
		'finance': ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#166534', '#14532D'],
		'beauty': ['#FDF2F8', '#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899', '#DB2777', '#BE185D', '#9D174D', '#831843'],
		'music': ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95']
	};

	// Determine which palette to use based on content
	if (nameLower.includes('health') || nameLower.includes('medical') || nameLower.includes('wellness') ||
		nameLower.includes('fitness') || nameLower.includes('clinic')) {
		return colorPalettes.health;
	} else if (nameLower.includes('tech') || nameLower.includes('ai') || nameLower.includes('software') ||
		nameLower.includes('digital')) {
		return colorPalettes.tech;
	} else if (nameLower.includes('ecommerce') || nameLower.includes('shop') || category === 'Ecommerce') {
		return colorPalettes.ecommerce;
	} else if (nameLower.includes('design') || nameLower.includes('creative')) {
		return colorPalettes.design;
	} else if (nameLower.includes('finance') || nameLower.includes('banking') || nameLower.includes('insurance')) {
		return colorPalettes.finance;
	} else if (nameLower.includes('beauty') || nameLower.includes('cosmetic') || nameLower.includes('spa')) {
		return colorPalettes.beauty;
	} else if (nameLower.includes('music') || nameLower.includes('audio') || nameLower.includes('sound')) {
		return colorPalettes.music;
	} else if (category === 'Portfolio') {
		return colorPalettes.portfolio;
	} else if (category === 'Template') {
		return colorPalettes.template;
	}

	// Default palette based on category
	if (category === 'Landing Page') return colorPalettes.tech;
	return colorPalettes.design;
}

// Run the test if this file is executed directly
if (require.main === module) {
	processWebsitesList()
		.then((outputPath) => {
			console.log(`\n✨ Enhanced processing completed! Check the output at: ${outputPath}`);
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n💥 Enhanced processing failed:', error);
			process.exit(1);
		});
}

module.exports = { processWebsitesList };