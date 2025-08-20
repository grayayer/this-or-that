/**
 * Title Animation Controller
 * Creates flip-clock style animations for "This or That" title
 */

class TitleAnimator {
	constructor() {
		this.thisElements = document.querySelectorAll('.this');
		this.thatElements = document.querySelectorAll('.that');
		this.currentThisIndex = 0;
		this.currentThatIndex = 0;
		this.animationInterval = 2000; // 2 seconds between cycles
		this.isAnimating = false;

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
		this.animateThis();

		// Start "that" animation with delay
		setTimeout(() => {
			this.animateThat();
		}, 400); // 400ms delay for staggered effect

		// Schedule next cycle
		setTimeout(() => {
			this.startAnimationCycle();
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
		setTimeout(() => {
			nextElement.style.transition = 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out';
			nextElement.style.transform = 'translateY(0)';
			nextElement.style.opacity = '1';
		}, 50);

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
		setTimeout(() => {
			nextElement.style.transition = 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out';
			nextElement.style.transform = 'translateY(0)';
			nextElement.style.opacity = '1';
		}, 50);

		this.currentThatIndex = nextIndex;
	}

	// Method to pause/resume animations
	pause() {
		this.isAnimating = false;
	}

	resume() {
		if (!this.isAnimating) {
			this.isAnimating = true;
			this.startAnimationCycle();
		}
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	// Wait a bit for other scripts to load
	setTimeout(() => {
		window.titleAnimator = new TitleAnimator();
	}, 500);
});

// Pause animations when user starts interacting with the app
document.addEventListener('click', (e) => {
	console.log('Click detected on:', e.target.id);
	if (e.target.id === 'start-app-btn' && window.titleAnimator) {
		window.titleAnimator.pause();
	}
});