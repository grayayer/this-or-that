/**
 * Image Optimization Module
 * Handles WebP format support, compression, and responsive images
 */

class ImageOptimizer {
	constructor() {
		this.webpSupported = null;
		this.compressionSupported = null;
		this.init();
	}

	/**
	 * Initialize the image optimizer
	 */
	async init() {
		this.webpSupported = await this.checkWebPSupport();
		this.compressionSupported = this.checkCompressionSupport();

		console.log('🖼️ Image Optimizer initialized:', {
			webpSupported: this.webpSupported,
			compressionSupported: this.compressionSupported
		});
	}

	/**
	 * Check if WebP format is supported
	 * @returns {Promise<boolean>} - True if WebP is supported
	 */
	checkWebPSupport() {
		return new Promise((resolve) => {
			const webp = new Image();
			webp.onload = webp.onerror = () => {
				resolve(webp.height === 2);
			};
			webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
		});
	}

	/**
	 * Check if image compression is supported
	 * @returns {boolean} - True if compression is supported
	 */
	checkCompressionSupport() {
		return typeof HTMLCanvasElement !== 'undefined' &&
			HTMLCanvasElement.prototype.toBlob !== undefined;
	}

	/**
	 * Optimize image URL for better performance
	 * @param {string} originalUrl - Original image URL
	 * @param {Object} options - Optimization options
	 * @returns {string} - Optimized image URL
	 */
	optimizeImageUrl(originalUrl, options = {}) {
		const {
			width = null,
			height = null,
			quality = 0.8,
			format = 'auto'
		} = options;

		// If it's a Land-book URL, try to optimize it
		if (originalUrl.includes('land-book.com')) {
			return this.optimizeLandBookUrl(originalUrl, { width, height, quality, format });
		}

		// For other URLs, return as-is (could add more optimization services here)
		return originalUrl;
	}

	/**
	 * Optimize Land-book image URLs
	 * @param {string} url - Original Land-book URL
	 * @param {Object} options - Optimization options
	 * @returns {string} - Optimized URL
	 */
	optimizeLandBookUrl(url, options = {}) {
		const { width, height, quality, format } = options;

		try {
			const urlObj = new URL(url);

			// Add WebP format if supported
			if (this.webpSupported && (format === 'auto' || format === 'webp')) {
				// Try to convert extension to webp
				const pathname = urlObj.pathname;
				if (pathname.match(/\.(jpg|jpeg|png)$/i)) {
					urlObj.pathname = pathname.replace(/\.(jpg|jpeg|png)$/i, '.webp');
				}
			}

			// Add size parameters if supported by the CDN
			const params = new URLSearchParams(urlObj.search);

			if (width) {
				params.set('w', width.toString());
			}

			if (height) {
				params.set('h', height.toString());
			}

			if (quality && quality < 1) {
				params.set('q', Math.round(quality * 100).toString());
			}

			// Add format parameter
			if (this.webpSupported && format !== 'original') {
				params.set('f', 'webp');
			}

			urlObj.search = params.toString();
			return urlObj.toString();

		} catch (error) {
			console.warn('⚠️ Failed to optimize Land-book URL:', error);
			return url;
		}
	}

	/**
	 * Create responsive image sources
	 * @param {string} originalUrl - Original image URL
	 * @param {Array} sizes - Array of size configurations
	 * @returns {Array} - Array of source objects
	 */
	createResponsiveSources(originalUrl, sizes = []) {
		const defaultSizes = [
			{ width: 400, media: '(max-width: 480px)' },
			{ width: 600, media: '(max-width: 768px)' },
			{ width: 800, media: '(max-width: 1024px)' },
			{ width: 1200, media: '(min-width: 1025px)' }
		];

		const sizesToUse = sizes.length > 0 ? sizes : defaultSizes;

		return sizesToUse.map(size => ({
			srcset: this.optimizeImageUrl(originalUrl, {
				width: size.width,
				quality: 0.85,
				format: 'auto'
			}),
			media: size.media,
			type: this.webpSupported ? 'image/webp' : 'image/jpeg'
		}));
	}

	/**
	 * Compress image using canvas
	 * @param {File|Blob} imageFile - Image file to compress
	 * @param {Object} options - Compression options
	 * @returns {Promise<Blob>} - Compressed image blob
	 */
	async compressImage(imageFile, options = {}) {
		if (!this.compressionSupported) {
			return imageFile;
		}

		const {
			maxWidth = 1200,
			maxHeight = 900,
			quality = 0.8,
			format = 'image/jpeg'
		} = options;

		return new Promise((resolve, reject) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const img = new Image();

			img.onload = () => {
				// Calculate new dimensions
				let { width, height } = this.calculateDimensions(
					img.width,
					img.height,
					maxWidth,
					maxHeight
				);

				// Set canvas size
				canvas.width = width;
				canvas.height = height;

				// Draw and compress
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(resolve, format, quality);
			};

			img.onerror = reject;
			img.src = URL.createObjectURL(imageFile);
		});
	}

	/**
	 * Calculate optimal dimensions maintaining aspect ratio
	 * @param {number} originalWidth - Original width
	 * @param {number} originalHeight - Original height
	 * @param {number} maxWidth - Maximum width
	 * @param {number} maxHeight - Maximum height
	 * @returns {Object} - New dimensions
	 */
	calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
		let width = originalWidth;
		let height = originalHeight;

		// Scale down if necessary
		if (width > maxWidth) {
			height = (height * maxWidth) / width;
			width = maxWidth;
		}

		if (height > maxHeight) {
			width = (width * maxHeight) / height;
			height = maxHeight;
		}

		return {
			width: Math.round(width),
			height: Math.round(height)
		};
	}

	/**
	 * Preload images with optimization
	 * @param {Array} imageUrls - Array of image URLs to preload
	 * @param {Object} options - Preload options
	 * @returns {Promise<Array>} - Array of preload results
	 */
	async preloadImages(imageUrls, options = {}) {
		const {
			priority = 'low',
			crossOrigin = 'anonymous',
			timeout = 10000
		} = options;

		const preloadPromises = imageUrls.map(url => {
			return this.preloadSingleImage(url, { priority, crossOrigin, timeout });
		});

		return Promise.allSettled(preloadPromises);
	}

	/**
	 * Preload a single image
	 * @param {string} url - Image URL
	 * @param {Object} options - Preload options
	 * @returns {Promise<HTMLImageElement>} - Loaded image element
	 */
	preloadSingleImage(url, options = {}) {
		const { priority, crossOrigin, timeout } = options;

		return new Promise((resolve, reject) => {
			const img = new Image();

			// Set up timeout
			const timeoutId = setTimeout(() => {
				reject(new Error(`Image preload timeout: ${url}`));
			}, timeout);

			img.onload = () => {
				clearTimeout(timeoutId);
				resolve(img);
			};

			img.onerror = () => {
				clearTimeout(timeoutId);
				reject(new Error(`Failed to preload image: ${url}`));
			};

			// Set attributes
			if (crossOrigin) {
				img.crossOrigin = crossOrigin;
			}

			// Set loading priority if supported
			if ('loading' in img && priority === 'high') {
				img.loading = 'eager';
			} else if ('loading' in img) {
				img.loading = 'lazy';
			}

			// Start loading
			img.src = this.optimizeImageUrl(url, {
				width: 800,
				quality: 0.85,
				format: 'auto'
			});
		});
	}

	/**
	 * Create optimized picture element
	 * @param {string} src - Original image source
	 * @param {Object} options - Picture element options
	 * @returns {HTMLPictureElement} - Optimized picture element
	 */
	createOptimizedPicture(src, options = {}) {
		const {
			alt = '',
			className = '',
			sizes = [],
			loading = 'lazy'
		} = options;

		const picture = document.createElement('picture');
		const sources = this.createResponsiveSources(src, sizes);

		// Add source elements
		sources.forEach(source => {
			const sourceEl = document.createElement('source');
			sourceEl.srcset = source.srcset;
			sourceEl.media = source.media;
			sourceEl.type = source.type;
			picture.appendChild(sourceEl);
		});

		// Add fallback img element
		const img = document.createElement('img');
		img.src = this.optimizeImageUrl(src, { quality: 0.8 });
		img.alt = alt;
		img.className = className;
		img.loading = loading;

		picture.appendChild(img);

		return picture;
	}

	/**
	 * Monitor image loading performance
	 * @param {HTMLImageElement} img - Image element to monitor
	 * @returns {Promise<Object>} - Performance metrics
	 */
	monitorImagePerformance(img) {
		return new Promise((resolve) => {
			const startTime = performance.now();
			let loadTime = null;
			let errorOccurred = false;

			const cleanup = () => {
				img.removeEventListener('load', onLoad);
				img.removeEventListener('error', onError);
			};

			const onLoad = () => {
				loadTime = performance.now() - startTime;
				cleanup();
				resolve({
					success: true,
					loadTime,
					size: {
						natural: { width: img.naturalWidth, height: img.naturalHeight },
						display: { width: img.width, height: img.height }
					},
					src: img.src
				});
			};

			const onError = () => {
				errorOccurred = true;
				cleanup();
				resolve({
					success: false,
					loadTime: performance.now() - startTime,
					error: 'Failed to load image',
					src: img.src
				});
			};

			img.addEventListener('load', onLoad);
			img.addEventListener('error', onError);

			// If image is already loaded
			if (img.complete) {
				if (img.naturalWidth > 0) {
					onLoad();
				} else {
					onError();
				}
			}
		});
	}

	/**
	 * Get optimization statistics
	 * @returns {Object} - Optimization stats
	 */
	getStats() {
		return {
			webpSupported: this.webpSupported,
			compressionSupported: this.compressionSupported,
			features: {
				responsiveImages: true,
				lazyLoading: 'loading' in HTMLImageElement.prototype,
				intersectionObserver: 'IntersectionObserver' in window
			}
		};
	}
}

// Create global instance
const imageOptimizer = new ImageOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = ImageOptimizer;
}