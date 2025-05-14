// DOM elements
const logoAnimation = document.getElementById('logo-animation');
const titleContainer = document.getElementById('title-container');
const characterContainer = document.getElementById('character-container');
const startButton = document.getElementById('start-button');

// Global timer variables
const studyTime = {
    minutes: 25,
    seconds: 0
};

let timerInterval = null;
let timeRemaining = 0; // in seconds

// Add global variable for break time
let breakTime = 5; // Default 5 minutes

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    initSplashScreen();
    initTimerSelector();
    initBreakOptions(); // Initialize break options
    initCharacterSelector();
    startCamera(); // Start the camera feed
});

// ------------- SPLASH SCREEN (PAGES 1-3) -------------
function initSplashScreen() {
    console.log("Initializing splash screen");
    
    // Make sure elements are hidden initially
    characterContainer.style.display = 'none';
    startButton.style.display = 'none';
    
    // Set initial positions off-screen
    characterContainer.style.transform = 'translateY(100vh)';
    startButton.style.transform = 'translateY(100vh)';
    
    // Logo animation finishes playing
    logoAnimation.addEventListener('ended', function() {
        console.log("Logo animation ended");
        
        // Show elements but keep them off-screen initially
        characterContainer.style.display = 'block';
        startButton.style.display = 'block';
        
        // Add transitions
        characterContainer.style.transition = 'transform 1s ease-out';
        startButton.style.transition = 'transform 1s ease-out';
        titleContainer.style.transition = 'transform 1s ease-out';
        
        // Trigger the animations after a brief delay
        setTimeout(() => {
            characterContainer.style.transform = 'translateY(25vh)';
            startButton.style.transform = 'translateY(-7vh)';
            titleContainer.style.transform = 'translateY(-50vh)';
        }, 100);
        
        // Animate logo fade out and move up
        logoAnimation.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
        logoAnimation.style.transform = 'translateY(-100vh)';
        logoAnimation.style.opacity = '0';
        
        // Hide logo after animation
        setTimeout(() => {
            logoAnimation.style.display = 'none';
        }, 1000);
    });
    
    startButton.addEventListener('click', function() {
        console.log("Start button clicked");
        navigateTo('study-timer');
    });
}

function navigateTo(pageId) {
    // Remove active class from all pages
    document.querySelectorAll('.page, .splashpage').forEach(page => {
        page.classList.remove('active');
    });
    
    // Add active class to target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}





// ------------- STUDY TIMER (PAGE 4) -------------
function initTimerSelector() {
    const minutesScroll = document.getElementById('minutes-scroll');
    const secondsScroll = document.getElementById('seconds-scroll');
    const studyTimerPage = document.getElementById('study-timer');
    const breakTimerPage = document.getElementById('break-timer');
    
    minutesScroll.innerHTML = '';
    secondsScroll.innerHTML = '';
    
    // Initialize minute values (0-59 minutes)
    for (let i = 0; i <= 59; i++) {
        const value = document.createElement('div');
        value.className = 'timer-value';
        value.textContent = i.toString().padStart(2, '0');
        value.dataset.value = i;
        minutesScroll.appendChild(value);
    }
    
    // Initialize seconds values (0-59 seconds)
    for (let i = 0; i <= 59; i++) {
        const value = document.createElement('div');
        value.className = 'timer-value';
        value.textContent = i.toString().padStart(2, '0');
        value.dataset.value = i;
        secondsScroll.appendChild(value);
    }
    
    // Set initial values
    studyTime.minutes = 25;
    studyTime.seconds = 0;
    
    // Set initial scroll positions using the same calculation as the scroll handler
    const valueHeight = 80;
    const minutesInitialTop = valueHeight - (studyTime.minutes * valueHeight);
    const secondsInitialTop = valueHeight - (studyTime.seconds * valueHeight);
    
    minutesScroll.style.transform = `translateY(${minutesInitialTop}px)`;
    secondsScroll.style.transform = `translateY(${secondsInitialTop}px)`;
    
    // Mark initial selected values
    minutesScroll.children[studyTime.minutes].classList.add('selected');
    secondsScroll.children[studyTime.seconds].classList.add('selected');
    
    updateTimeRemaining();
    updateConfirmationTime();
    
    // Add scroll event listeners for minutes and seconds
    setupTimerScrolling(minutesScroll, secondsScroll);
    
    // Set button handler
    document.getElementById('set-study-time').addEventListener('click', function() {
        // Add slide animation
        studyTimerPage.classList.add('slide-left');
        
        // Show break timer and ensure it's in the correct position
        breakTimerPage.classList.add('active');
        breakTimerPage.style.transform = 'translateX(0)';
        breakTimerPage.classList.remove('slide-right');
        
        // Play the break timer video
        const breakTimerVideo = breakTimerPage.querySelector('.character-animation');
        if (breakTimerVideo) {
            breakTimerVideo.currentTime = 0;
            breakTimerVideo.play().catch(err => console.error('Error playing video:', err));
        }
        
        // After animation completes
        setTimeout(() => {
            studyTimerPage.classList.remove('active', 'slide-left');
            studyTimerPage.style.transform = '';
        }, 300);
    });
    
    // Back button handler
    document.getElementById('study-timer-back').addEventListener('click', function() {
        const currentPage = document.getElementById('study-timer');
        const previousPage = document.getElementById('splash-screen');
        handleBackButton(currentPage, previousPage);
    });
}

function setupTimerScrolling(minutesScroll, secondsScroll) {
    // Track touch/mouse positions
    let startY, startTop;
    let currentScroll = null;
    
    function handleStart(e, scroll) {
        currentScroll = scroll;
        startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        startTop = parseFloat(getComputedStyle(scroll).transform.split(',')[5]) || 0;
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
    }
    
    function handleMove(e) {
        if (!currentScroll) return;
        
        e.preventDefault();
        const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY;
        
        let newTop = startTop + deltaY;
        const valueHeight = 80;
        const maxTop = valueHeight; // Allow scrolling to position that shows 00
        const minTop = -(58 * valueHeight); // Limit to 59
        
        // Ensure we stay within bounds
        newTop = Math.max(minTop, Math.min(maxTop, newTop));
        currentScroll.style.transform = `translateY(${newTop}px)`;
        
        // Update display in real-time while scrolling
        const currentIndex = Math.min(59, Math.max(0, Math.round((valueHeight - newTop) / valueHeight)));
        if (currentScroll === minutesScroll) {
            studyTime.minutes = currentIndex;
        } else if (currentScroll === secondsScroll) {
            studyTime.seconds = currentIndex;
        }
        updateConfirmationTime();
    }
    
    function handleEnd() {
        if (!currentScroll) return;
        
        const valueHeight = 80;
        const currentTop = parseFloat(getComputedStyle(currentScroll).transform.split(',')[5]) || 0;
        
        // Calculate nearest index with proper rounding
        const rawIndex = Math.round((valueHeight - currentTop) / valueHeight);
        const nearestIndex = Math.min(59, Math.max(0, rawIndex));
        const snappedTop = valueHeight - (nearestIndex * valueHeight);
        
        currentScroll.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)';
        currentScroll.style.transform = `translateY(${snappedTop}px)`;
        
        // Remove previous selection
        currentScroll.querySelectorAll('.timer-value').forEach(value => {
            value.classList.remove('selected');
        });
        
        // Mark the new selected value
        const selectedValue = currentScroll.children[nearestIndex];
        if (selectedValue) {
            selectedValue.classList.add('selected');
        }
        
        setTimeout(() => {
            currentScroll.style.transition = '';
            
            // Update the appropriate time value
            if (currentScroll === minutesScroll) {
                studyTime.minutes = nearestIndex;
            } else if (currentScroll === secondsScroll) {
                studyTime.seconds = nearestIndex;
            }
            
            updateTimeRemaining();
            updateConfirmationTime();
        }, 300);
        
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchend', handleEnd);
        
        currentScroll = null;
    }
    
    // Add event listeners for minutes and seconds
    minutesScroll.addEventListener('mousedown', e => handleStart(e, minutesScroll));
    minutesScroll.addEventListener('touchstart', e => handleStart(e, minutesScroll));
    secondsScroll.addEventListener('mousedown', e => handleStart(e, secondsScroll));
    secondsScroll.addEventListener('touchstart', e => handleStart(e, secondsScroll));
}

function updateTimerScroll(scroll, value) {
    const valueHeight = 80;
    // Ensure value is within valid range
    const safeValue = Math.min(59, Math.max(0, value));
    scroll.style.transform = `translateY(${-safeValue * valueHeight}px)`;
}

// Back button handler function
function handleBackButton(currentPage, previousPage) {
    // Add slide-right animation to current page
    currentPage.classList.add('slide-right');
    
    // Show previous page and ensure it's in the correct position
    previousPage.classList.add('active');
    previousPage.style.transform = 'translateX(0)';
    previousPage.classList.remove('slide-left');
    
    // If navigating back to break timer, play its video
    if (previousPage.id === 'break-timer') {
        const breakTimerVideo = previousPage.querySelector('.character-animation');
        if (breakTimerVideo) {
            breakTimerVideo.currentTime = 0;
            breakTimerVideo.play().catch(err => console.error('Error playing video:', err));
        }
    }
    
    // After animation completes
    setTimeout(() => {
        currentPage.classList.remove('active', 'slide-right');
        currentPage.style.transform = '';
    }, 300);
}

// ------------- BREAK TIMER (PAGE 5) -------------
// Get the necessary elements
const breakTimerPage = document.getElementById('break-timer');
const studyTimerPage = document.getElementById('study-timer'); // Make sure this ID exists
const backButton = document.getElementById('break-timer-back');

// Add click event listener to back button
backButton.addEventListener('click', () => {
    const currentPage = document.getElementById('break-timer');
    const previousPage = document.getElementById('study-timer');
    handleBackButton(currentPage, previousPage);
});

function initBreakOptions() {
    const breakOptions = document.querySelectorAll('.break-option');
    const characterSelectPage = document.getElementById('character-select');
    const breakTimerPage = document.getElementById('break-timer');
    
    breakOptions.forEach(function(option) {
        option.addEventListener('click', function() {
            breakTime = parseInt(this.dataset.minutes);
            breakOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // Add slide animation
            breakTimerPage.classList.add('slide-left');
            
            // Show character select and ensure it's in the correct position
            characterSelectPage.classList.add('active');
            characterSelectPage.style.transform = 'translateX(0)';
            characterSelectPage.classList.remove('slide-right');
            
            // After animation completes
            setTimeout(() => {
                breakTimerPage.classList.remove('active', 'slide-left');
                breakTimerPage.style.transform = '';
            }, 300);
        });
    });

    // Back button handler
    document.getElementById('break-timer-back').addEventListener('click', function() {
        const currentPage = document.getElementById('break-timer');
        const previousPage = document.getElementById('study-timer');
        handleBackButton(currentPage, previousPage);
    });
}





// ------------- CHARACTER SELECT (PAGE 6) -------------
let currentIndex = 0; // Move to module/global scope
let characterAnimations = null;

function initCharacterSelector() {
    const leftArrow = document.querySelector('.carousel-arrow.left');
    const rightArrow = document.querySelector('.carousel-arrow.right');
    characterAnimations = document.querySelectorAll('.character-animation');
    const backButton = document.getElementById('character-select-back');
    const selectButton = document.getElementById('select-character');
    const characterSelectPage = document.getElementById('character-select');
    const confirmationPage = document.getElementById('confirmation');

    function resetCharacterCarousel() {
        currentIndex = 0;
        characterAnimations.forEach((video, idx) => {
            video.classList.remove('active');
            video.pause();
        });
        selectedCharacter = parseInt(characterAnimations[0].dataset.character);
        const firstCharacter = characterAnimations[0];
        firstCharacter.classList.add('active');
        firstCharacter.play().catch(err => console.error('Play error:', err));
        updateArrowStates();
        updateConfirmationCharacter();
    }

    // Initial setup
    resetCharacterCarousel();

    // Preload all videos
    characterAnimations.forEach((video, index) => {
        video.load();
    });

    function changeCharacter(direction) {
        characterAnimations[currentIndex].classList.remove('active');
        characterAnimations[currentIndex].pause();

        currentIndex = (currentIndex + direction + characterAnimations.length) % characterAnimations.length;

        const newCharacter = characterAnimations[currentIndex];
        newCharacter.classList.add('active');
        newCharacter.play().catch(err => console.error('Play error:', err));

        selectedCharacter = parseInt(newCharacter.dataset.character);

        updateArrowStates();
        updateConfirmationCharacter();
    }

    function updateArrowStates() {
        leftArrow.style.opacity = currentIndex === 0 ? '0.5' : '1';
        leftArrow.disabled = currentIndex === 0;
        rightArrow.style.opacity = currentIndex === characterAnimations.length - 1 ? '0.5' : '1';
        rightArrow.disabled = currentIndex === characterAnimations.length - 1;
    }

    leftArrow.addEventListener('click', () => changeCharacter(-1));
    rightArrow.addEventListener('click', () => changeCharacter(1));

    selectButton.addEventListener('click', () => {
        const characterSelectPage = document.getElementById('character-select');
        const confirmationPage = document.getElementById('confirmation');
        
        // Add slide animation
        characterSelectPage.classList.add('slide-left');
        
        // Show confirmation page and ensure it's in the correct position
        confirmationPage.classList.add('active');
        confirmationPage.style.transform = 'translateX(0)';
        confirmationPage.classList.remove('slide-right');
        
        updateConfirmationTime();
        updateConfirmationCharacter();
        
        // After animation completes
        setTimeout(() => {
            characterSelectPage.classList.remove('active', 'slide-left');
            characterSelectPage.style.transform = '';
        }, 300);
    });

    backButton.addEventListener('click', () => {
        const currentPage = document.getElementById('character-select');
        const previousPage = document.getElementById('break-timer');
        handleBackButton(currentPage, previousPage);
    });

    // If you have other navigation that shows the character select page,
    // call resetCharacterCarousel() there as well.
}







// ------------- CONFIRMATION (PAGE 7) -------------
function updateTimeRemaining() {
    timeRemaining = (studyTime.minutes * 60) + studyTime.seconds;
}

function updateConfirmationTime() {
    // Get all timer display elements
    const minutesDisplays = document.querySelectorAll('#study-minutes');
    const secondsDisplays = document.querySelectorAll('#study-seconds');
    
    // Update all displays with current studyTime values, ensuring 2-digit format
    minutesDisplays.forEach(display => {
        display.textContent = studyTime.minutes.toString().padStart(2, '0');
    });
    
    secondsDisplays.forEach(display => {
        display.textContent = studyTime.seconds.toString().padStart(2, '0');
    });
}

function startTimer(isBreakTimer = false) {
    if (timerInterval) clearInterval(timerInterval);
    
    if (!isBreakTimer) {
        updateTimeRemaining();
    }
    
    timerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            
            if (!isBreakTimer) {
                // Study timer finished - show finished page and start break timer
                const arStudyPage = document.getElementById('ar-study');
                const finishedPage = document.getElementById('finished-page');
                
                // Update break timer display
                document.getElementById('break-minutes').textContent = breakTime.toString().padStart(2, '0');
                document.getElementById('break-seconds').textContent = '00';
                
                // Update character animation
                const finishedAnimation = document.getElementById('finished-animation');
                const selectedCharacter = document.querySelector('.character-animation.active');
                if (selectedCharacter && finishedAnimation) {
                    const characterNumber = selectedCharacter.dataset.character;
                    const source = finishedAnimation.querySelector('source');
                    source.src = `Assets/POMODOG_Dog${parseInt(characterNumber) + 1}.webm`;
                    finishedAnimation.load();
                }
                
                // Show finished page with transition
                arStudyPage.classList.remove('active');
                finishedPage.classList.add('active');
                
                // Start break timer
                timeRemaining = breakTime * 60;
                startTimer(true);
            } else {
                // Break timer finished - navigate to AR page
                const finishedPage = document.getElementById('finished-page');
                const arStudyPage = document.getElementById('ar-study');
                
                // Reset study timer to original values
                const minutesSelected = document.querySelector('#minutes-scroll .timer-value.selected');
                const secondsSelected = document.querySelector('#seconds-scroll .timer-value.selected');
                
                studyTime.minutes = minutesSelected ? parseInt(minutesSelected.dataset.value) : 25;
                studyTime.seconds = secondsSelected ? parseInt(secondsSelected.dataset.value) : 0;
                
                // Update time remaining and displays
                updateTimeRemaining();
                updateConfirmationTime();
                
                // Navigate to AR page
                finishedPage.classList.remove('active');
                arStudyPage.classList.add('active');
                
                // Start new study session
                startTimer();
            }
            return;
        }
        
        timeRemaining--;
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        if (isBreakTimer) {
            // Update break timer display
            document.getElementById('break-minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('break-seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            // Update study timer display
            studyTime.minutes = minutes;
            studyTime.seconds = seconds;
            updateConfirmationTime();
        }
    }, 1000);
}

// Finished page button handlers
document.getElementById('next-session').addEventListener('click', () => {
    // Reset timer values
    studyTime.minutes = parseInt(document.querySelector('#minutes-scroll .timer-value.selected')?.dataset.value || '25');
    studyTime.seconds = parseInt(document.querySelector('#seconds-scroll .timer-value.selected')?.dataset.value || '0');
    
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Reset displays
    updateTimeRemaining();
    updateConfirmationTime();
    
    // Navigate back to AR study page
    const finishedPage = document.getElementById('finished-page');
    const arStudyPage = document.getElementById('ar-study');
    
    finishedPage.classList.remove('active');
    arStudyPage.classList.add('active');
    
    // Start new study session
    startTimer();
});

document.getElementById('end-session').addEventListener('click', () => {
    const currentPage = document.getElementById('finished-page');
    const previousPage = document.getElementById('splash-screen');
    
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    handleBackButton(currentPage, previousPage);
});

// Add timer start functionality to confirmation page
document.getElementById('confirm-settings').addEventListener('click', function() {
    const confirmationPage = document.getElementById('confirmation');
    const arPage = document.getElementById('ar-study');
    
    // Add slide animation
    confirmationPage.classList.add('slide-left');
    arPage.classList.add('active');
    arPage.classList.remove('slide-right');
    
    // Initialize AR timer
    initARTimer();
    
    // After animation completes
    setTimeout(() => {
        confirmationPage.classList.remove('active', 'slide-left');
    }, 300);
});

function updateConfirmationCharacter() {
    const selectedAnimation = document.getElementById('selected-animation');
    const selectedSource = selectedAnimation.querySelector('source');
    
    // Get the currently active character's data-character attribute
    const activeCharacter = document.querySelector('.character-animation.active');
    const characterNumber = activeCharacter.dataset.character;
    
    // Use the data-character value to set the correct video
    const newSrc = `Assets/POMODOG_Dog${parseInt(characterNumber) + 1}.webm`;
    console.log('Updating character video to:', newSrc);
    selectedSource.src = newSrc;
    
    // Add error handling for video loading
    selectedAnimation.onerror = function() {
        console.error('Error loading video:', selectedAnimation.error);
    };
    
    selectedAnimation.load(); // Reload the video with new source
    
    // Only play if the video is actually loaded
    selectedAnimation.onloadeddata = function() {
        console.log('Video loaded successfully');
        selectedAnimation.play();
    };
}

// Initialize confirmation page back button
document.getElementById('confirmation-back').addEventListener('click', function() {
    const currentPage = document.getElementById('confirmation');
    const previousPage = document.getElementById('character-select');
    handleBackButton(currentPage, previousPage);
});

// ------------- AR STUDY (PAGE 8) -------------
function initARTimer() {
    const resetBtn = document.getElementById('reset-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const stopConfirmation = document.getElementById('stop-confirmation');
    const confirmStopBtn = document.getElementById('confirm-stop');
    const cancelStopBtn = document.getElementById('cancel-stop');
    
    let isPaused = false;
    
    // Initialize timer display with current studyTime values
    updateConfirmationTime();
    
    // Start the timer automatically
    startTimer();
    
    // Reset button handler
    resetBtn.addEventListener('click', () => {
        const stopConfirmation = document.getElementById('stop-confirmation');
        stopConfirmation.classList.remove('hidden');
        
        // Update popup text for reset action
        const popupTitle = stopConfirmation.querySelector('h3');
        const popupText = stopConfirmation.querySelector('p');
        popupTitle.textContent = 'Want to start fresh?';
        popupText.textContent = 'Are you sure you want to restart your session?';
    });
    
    // Pause button handler
    pauseBtn.addEventListener('click', () => {
        if (isPaused) {
            // Resume timer
            console.log('Resuming timer, switching to pause.png');
            startTimer();
            const img = pauseBtn.querySelector('img');
            img.src = 'Assets/pause.png';
            console.log('Image src set to:', img.src);
        } else {
            // Pause timer
            console.log('Pausing timer, switching to play.png');
            clearInterval(timerInterval);
            timerInterval = null;
            const img = pauseBtn.querySelector('img');
            img.src = 'Assets/play.png';
            console.log('Image src set to:', img.src);
        }
        isPaused = !isPaused;
        console.log('isPaused:', isPaused);
    });
    
    // Stop button handler
    stopBtn.addEventListener('click', () => {
        // Show stop confirmation popup
        const stopConfirmation = document.getElementById('stop-confirmation');
        stopConfirmation.classList.remove('hidden');
        
        // Update popup text for stop action
        const popupTitle = stopConfirmation.querySelector('h3');
        const popupText = stopConfirmation.querySelector('p');
        popupTitle.textContent = 'End session?';
        popupText.textContent = 'Are you sure you want to end your study session?';
    });
    
    // Confirm stop handlers
    confirmStopBtn.addEventListener('click', () => {
        const stopConfirmation = document.getElementById('stop-confirmation');
        const popupTitle = stopConfirmation.querySelector('h3').textContent;
        
        if (popupTitle === 'End session?') {
            const currentPage = document.getElementById('ar-study');
            const previousPage = document.getElementById('splash-screen');
            
            // Stop current timer
            clearInterval(timerInterval);
            timerInterval = null;
            
            // Hide confirmation popup
            stopConfirmation.classList.add('hidden');
            
            // Use handleBackButton for consistent slide animation
            handleBackButton(currentPage, previousPage);
        } else {
            // Hide confirmation popup
            stopConfirmation.classList.add('hidden');
            
            // Reset action - restart current timer
            clearInterval(timerInterval);
            timerInterval = null;
            
            // Get original time values from selected timer values
            const minutesSelected = document.querySelector('#minutes-scroll .timer-value.selected');
            const secondsSelected = document.querySelector('#seconds-scroll .timer-value.selected');
            
            // Reset to original time values
            studyTime.minutes = minutesSelected ? parseInt(minutesSelected.dataset.value) : 25;
            studyTime.seconds = secondsSelected ? parseInt(secondsSelected.dataset.value) : 0;
            
            // Update time remaining and displays
            updateTimeRemaining();
            updateConfirmationTime();
            
            // Start timer with reset values
            startTimer();
            
            // Reset pause button state
            isPaused = false;
            pauseBtn.querySelector('img').src = 'Assets/pause.png';
        }
    });
    
    cancelStopBtn.addEventListener('click', () => {
        stopConfirmation.classList.add('hidden');
    });
}

async function startCamera() {
    try {
        const cameraFeed = document.getElementById('camera-feed');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // Use back camera if available
            } 
        });
        cameraFeed.srcObject = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', startCamera);
