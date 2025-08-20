/**
 * Title Animation Controller
 * Creates flip-clock style animations for "This or That" title
 */

class TitleAnimator {
	constructor() {
		this.thisElements = document.querySelectorAll('.this');
		this.thatElements = document.querySelectorAll('.that');
		this.visualTitle = document.querySelector('.visual-title');
		this.currentThisIndex = 0;
		this.currentThatIndex = 0;
		this.animationInterval = 2000; // 2 seconds between cycles
		this.isAnimating = true;
		this.animationTimeoutId = null;
		this.activeTimeouts = []; // Track all active timeouts

		this.init();
	}

	init() {
		// Hide all elements initially except the first ones
		this.hideAllExcept(this.thisElements, 0);
		this.hideAllExcept(this.thatElements, 0);

		// Start the animation cycle
		setTimeout(() => this.startAnimationCycle(), 1000); // Wait 1 second before starting
	}

	hideAllExcept(elements, activeIndex) {
		elements.forEach((el, index) => {
			if (index === activeIndex) {
				el.style.opacity = '1';
				el.style.transform = 'translateY(0)';
				el.style.zIndex = '1';
			} else {
				el.style.opacity = '0';
				el.style.transform = 'translateY(100%)';
				el.style.zIndex = '0';
			}
		});
	}

	startAnimationCycle() {
		if (!this.isAnimating) return;

		this.animateThis();

		// Start "that" animation with delay
		const thatTimeout = setTimeout(() => {
			if (!this.isAnimating) return;
			this.animateThat();
		}, 400); // 400ms delay for staggered effect
		this.activeTimeouts.push(thatTimeout);

		// Schedule next cycle
		this.animationTimeoutId = setTimeout(() => {
			if (this.isAnimating) {
				this.startAnimationCycle();
			}
		}, this.animationInterval);
	}

	animateThis() {
		const currentElement = this.thisElements[this.currentThisIndex];
		const nextIndex = (this.currentThisIndex + 1) % this.thisElements.length;
		const nextElement = this.thisElements[nextIndex];

		// Animate current element out (slide down)
		currentElement.style.transition = 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out';
		currentElement.style.transform = 'translateY(100%)';
		currentElement.style.opacity = '0';

		// Prepare next element (position it above)
		nextElement.style.transition = 'none';
		nextElement.style.transform = 'translateY(-100%)';
		nextElement.style.opacity = '0';

		// Animate next element in (slide down into position)
		const thisTimeout = setTimeout(() => {
			if (!this.isAnimating) return;
			nextElement.style.transition = 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out';
			nextElement.style.transform = 'translateY(0)';
			nextElement.style.opacity = '1';
		}, 50);
		this.activeTimeouts.push(thisTimeout);

		this.currentThisIndex = nextIndex;
	}

	animateThat() {
		const currentElement = this.thatElements[this.currentThatIndex];
		const nextIndex = (this.currentThatIndex + 1) % this.thatElements.length;
		const nextElement = this.thatElements[nextIndex];

		// Animate current element out (slide up)
		currentElement.style.transition = 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out';
		currentElement.style.transform = 'translateY(-100%)';
		currentElement.style.opacity = '0';

		// Prepare next element (position it below)
		nextElement.style.transition = 'none';
		nextElement.style.transform = 'translateY(100%)';
		nextElement.style.opacity = '0';

		// Animate next element in (slide up into position)
		const thatTimeout = setTimeout(() => {
			if (!this.isAnimating) return;
			nextElement.style.transition = 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out';
			nextElement.style.transform = 'translateY(0)';
			nextElement.style.opacity = '1';
		}, 50);
		this.activeTimeouts.push(thatTimeout);

		this.currentThatIndex = nextIndex;
	}

	// Method to pause/resume animations
	pause() {
		this.isAnimating = false;

		// Clear main animation timeout
		if (this.animationTimeoutId) {
			clearTimeout(this.animationTimeoutId);
			this.animationTimeoutId = null;
		}

		// Clear all active timeouts
		this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
		this.activeTimeouts = [];

		console.log('Animation paused - all timeouts cleared');
	}

	resume() {
		if (!this.isAnimating) {
			this.isAnimating = true;
			this.startAnimationCycle();
		}
	}

	// Method to freeze and compact the title
	freezeAndCompact() {
		console.log('Freezing title animation at:', this.currentThisIndex, this.currentThatIndex);
		this.pause();

		// Clear all inline styles and set up frozen state
		this.thisElements.forEach((el, index) => {
			// Clear inline styles that might conflict
			el.style.transition = '';
			el.style.transform = '';
			el.style.opacity = '';
			el.style.zIndex = '';

			if (index === this.currentThisIndex) {
				el.classList.add('frozen-active');
				console.log('Added frozen-active to this element:', el.className);
			} else {
				el.classList.remove('frozen-active');
			}
		});

		this.thatElements.forEach((el, index) => {
			// Clear inline styles that might conflict
			el.style.transition = '';
			el.style.transform = '';
			el.style.opacity = '';
			el.style.zIndex = '';

			if (index === this.currentThatIndex) {
				el.classList.add('frozen-active');
				console.log('Added frozen-active to that element:', el.className);
			} else {
				el.classList.remove('frozen-active');
			}
		});

		// Add frozen class to visual title for CSS targeting
		if (this.visualTitle) {
			this.visualTitle.classList.add('frozen');
		}

		// The existing app system will handle adding .app-header.compact and .header-compact classes
		// Our CSS is now set up to respond to those classes
	}

	// Method to expand and resume animations
	expandAndResume() {
		// Remove frozen classes
		if (this.visualTitle) {
			this.visualTitle.classList.remove('frozen');
		}

		this.thisElements.forEach(el => el.classList.remove('frozen-active'));
		this.thatElements.forEach(el => el.classList.remove('frozen-active'));

		// Resume animations after transition
		setTimeout(() => {
			this.resume();
		}, 600); // Wait for CSS transition to complete
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	// Wait a bit for other scripts to load
	setTimeout(() => {
		window.titleAnimator = new TitleAnimator();
	}, 500);
});

// Freeze and compact animations when user starts interacting with the app
document.addEventListener('click', (e) => {
	console.log('Click detected on:', e.target.id);
	if (e.target.id === 'start-app-btn' && window.titleAnimator) {
		window.titleAnimator.freezeAndCompact();
	}
});