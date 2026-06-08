/**
 * Doze Studio - Interactive Canvas Animation Controller (Optimized Senior Version)
 * 
 * Handles optimized progressive loading, off-main-thread image decoding,
 * and scroll-decoupled LERP frame interpolation for 60fps buttery-smooth canvas animations.
 * 
 * @author Prashant Koirala & Antigravity IDE
 * @version 2.0.0
 * @license MIT
 */

(function() {
    'use strict';

    // Configuration constants
    const CONFIG = {
        FRAME_PADDING: 4,
        FRAME_MAX_INDEX: 1345,
        CRITICAL_FRAMES_COUNT: 100,     // Preload 100 frames for instant load
        ANIMATION_SCRUB_DURATION: 3,
        HEADING_ANIMATION_SCRUB: 2,
        CANVAS_SCALE_FACTOR: 0.5,
        PANELISM_SCALE_FACTOR: 2,
        LINE_WIDTH_EXPANDED: 190
    };

    // Animation timeline labels
    const TIMELINE_LABELS = {
        FIRST: 'first',
        SECOND: 'second',
        THIRD: 'third',
        FOURTH: 'fourth',
        FIFTH: 'fifth',
        SIXTH: 'sixth',
        SEVENTH: 'seventh',
        EIGHTH: 'eight',
        NINTH: 'ninth',
        TENTH: 'tenth',
        ELEVENTH: 'eleventh',
        TWELFTH: 'twelveth',
        THIRTEENTH: '13th',
        FOURTEENTH: '14th',
        FIFTEENTH: '15th'
    };

    // DOM element selectors
    const SELECTORS = {
        CANVAS: 'canvas',
        PARENT: '.parent',
        ANIMATE1: '.animate1',
        ANIMATE2: '.animate2',
        ANIMATE3: '.animate3',
        PANEL: '.panel',
        PANELISM: '.panelism',
        PANELISM_SPAN: '.panelism span',
        HEADINGS: '.headings h3'
    };

    /**
     * Procedural Audio Controller using Web Audio API for interactive soundtracks
     */
    class ProceduralAudioController {
        constructor() {
            this.ctx = null;
            this.isPlaying = false;
            
            // Audio Nodes
            this.mainGain = null;
            this.osc1 = null;
            this.osc2 = null;
            this.filter = null;
            this.lfo = null;
            this.lfoGain = null;
            
            this.initElements();
        }

        initElements() {
            this.btn = document.getElementById('audio-toggle');
            this.statusText = document.getElementById('audio-status');
            
            if (this.btn) {
                this.btn.addEventListener('click', () => this.toggle());
            }
        }

        initializeAudio() {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();

            // 1. Gain master control with soft compression
            this.mainGain = this.ctx.createGain();
            this.mainGain.gain.setValueAtTime(0, this.ctx.currentTime);

            // 2. Low-Pass Resonant Filter
            this.filter = this.ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
            this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

            // 3. Deep Cinematic Bass Osc (Triangle, 55Hz - note A1)
            this.osc1 = this.ctx.createOscillator();
            this.osc1.type = 'triangle';
            this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

            // 4. Soft Ambient Harmonics Osc (Sawtooth, 110.2Hz - note A2)
            this.osc2 = this.ctx.createOscillator();
            this.osc2.type = 'sawtooth';
            this.osc2.frequency.setValueAtTime(110.2, this.ctx.currentTime);
            
            this.osc2Gain = this.ctx.createGain();
            this.osc2Gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

            // 5. LFO to sweep the filter cutoff (creating breathing motions)
            this.lfo = this.ctx.createOscillator();
            this.lfo.type = 'sine';
            this.lfo.frequency.setValueAtTime(0.07, this.ctx.currentTime);

            this.lfoGain = this.ctx.createGain();
            this.lfoGain.gain.setValueAtTime(45, this.ctx.currentTime);

            // Connections
            this.lfo.connect(this.lfoGain);
            this.lfoGain.connect(this.filter.frequency);

            this.osc1.connect(this.filter);
            
            this.osc2.connect(this.osc2Gain);
            this.osc2Gain.connect(this.filter);

            this.filter.connect(this.mainGain);
            this.mainGain.connect(this.ctx.destination);

            // Start Oscillators
            this.osc1.start(0);
            this.osc2.start(0);
            this.lfo.start(0);
        }

        toggle() {
            if (!this.ctx) {
                this.initializeAudio();
            }

            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            if (this.isPlaying) {
                this.fadeOut();
            } else {
                this.fadeIn();
            }
        }

        fadeIn() {
            this.isPlaying = true;
            this.btn.classList.add('audio-playing');
            if (this.statusText) this.statusText.innerText = 'ATIVA';
            this.mainGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.8);
        }

        fadeOut() {
            this.isPlaying = false;
            this.btn.classList.remove('audio-playing');
            if (this.statusText) this.statusText.innerText = 'DESATIVADA';
            this.mainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
        }

        modulateWithScroll(velocity) {
            if (!this.isPlaying || !this.filter) return;

            // Shift filter cutoff based on scroll speed (clamp velocity)
            const speed = Math.min(Math.abs(velocity), 10);
            const cutoffShift = speed * 12;

            // Smoothly glide the cutoff frequency using exponential ramp
            const targetFreq = 140 + cutoffShift;
            this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);
        }

        /**
         * Modulate audio pitch and harmonics dynamically based on mouse coordinate ratios
         * @param {number} xRatio - Normalized cursor X coordinate (0 to 1)
         * @param {number} yRatio - Normalized cursor Y coordinate (0 to 1)
         */
        modulateWithMouse(xRatio, yRatio) {
            if (!this.isPlaying || !this.osc2 || !this.osc2Gain) return;

            // Shift the frequency of osc2 based on mouse horizontal coordinate (detune range)
            const baseFreq = 110.2;
            const detuneRange = 6.0; // detune in Hz
            const targetFreq = baseFreq + (xRatio - 0.5) * detuneRange;
            this.osc2.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.25);

            // Shift the volume of the higher harmonics based on mouse vertical coordinate (volume range)
            const targetGain = 0.04 + (1 - yRatio) * 0.08; // 0.04 to 0.12 gain
            this.osc2Gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.15);
        }
    }

    /**
     * Main application class for managing the animation system
     */
    class DozeStudioAnimation {
        constructor() {
            this.canvas = null;
            this.context = null;
            this.audioController = null;
            this.logoOffset = { x: 0, y: 0 }; // Track logo parallax offset
            
            // Frame rendering state
            this.frames = {
                currentIndex: 1,      // Current LERPed frame (interpolated)
                targetIndex: 1,       // Target frame (driven by GSAP ScrollTrigger)
                renderedIndex: -1,    // Track actual drawn frame to prevent redrawing
                maxIndex: CONFIG.FRAME_MAX_INDEX
            };
            
            this.images = new Array(CONFIG.FRAME_MAX_INDEX + 1).fill(null);
            this.imagesLoaded = 0;
            this.isInitialized = false;
            
            this.init();
        }

        /**
         * Initialize the animation system
         */
        init() {
            try {
                this.audioController = new ProceduralAudioController();
                this.initializeCanvas();
                this.initializeLenisScroll();
                this.initializeCustomCursor();
                this.preloadImages();
                this.setupEventListeners();
            } catch (error) {
                console.error('Failed to initialize Doze Studio Animation:', error);
                this.handleInitializationError(error);
            }
        }

        /**
         * Initialize canvas, context, and apply device pixel ratio scaling
         */
        initializeCanvas() {
            this.canvas = document.querySelector(SELECTORS.CANVAS);
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }

            this.context = this.canvas.getContext('2d');
            if (!this.context) {
                throw new Error('Failed to get canvas context');
            }

            // Set responsive dimensions with high-DPI scaling
            this.resizeCanvas();
        }

        /**
         * Initialize Lenis Smooth Scroll and sync with GSAP ScrollTrigger
         */
        initializeLenisScroll() {
            if (typeof Lenis !== 'undefined') {
                this.lenis = new Lenis({
                    duration: 1.8,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ultra-smooth easing
                    orientation: 'vertical',
                    gestureOrientation: 'vertical',
                    smoothWheel: true,
                    wheelMultiplier: 0.7,
                    touchMultiplier: 1.1,
                    infinite: false
                });

                // Synchronize Lenis scrolling events with GSAP ScrollTrigger updates and audio modulation
                this.lenis.on('scroll', (e) => {
                    if (typeof ScrollTrigger !== 'undefined') {
                        ScrollTrigger.update();
                    }
                    if (this.audioController) {
                        this.audioController.modulateWithScroll(e.velocity);
                    }
                });

                // Add Lenis to GSAP ticker so scroll and timeline run in the same animation cycle
                gsap.ticker.add((time) => {
                    this.lenis.raf(time * 1000);
                });

                // Disable lag smoothing for instant responsiveness
                gsap.ticker.lagSmoothing(0);
            } else {
                console.warn('Lenis Smooth Scroll not available');
            }
        }

        /**
         * Initialize the premium lag-softened custom cursor with fluid damping (LERP)
         */
        initializeCustomCursor() {
            // Mouse track position initialized to center
            this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            // Custom cursor positions for smooth physics damping
            this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            this.cursorDot = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

            const cursorEl = document.getElementById('custom-cursor');
            const dotEl = document.getElementById('custom-cursor-dot');

            if (!cursorEl || !dotEl) return;

            // Track mouse moves and modulate audio harmonics dynamically
            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                
                if (this.audioController) {
                    this.audioController.modulateWithMouse(
                        e.clientX / window.innerWidth,
                        e.clientY / window.innerHeight
                    );
                }
            });

            // Interactive elements selection for hovering states
            const interactiveElements = document.querySelectorAll('a, button, [id="audio-toggle"], .panel, canvas, #back-to-top');
            
            interactiveElements.forEach(element => {
                element.addEventListener('mouseenter', () => {
                    document.body.classList.add('cursor-hovering');
                    cursorEl.classList.add('cursor-active');
                });
                element.addEventListener('mouseleave', () => {
                    document.body.classList.remove('cursor-hovering');
                    cursorEl.classList.remove('cursor-active');
                });
            });
        }

        /**
         * Preload critical frames (1 to 100) first to show the landing page immediately
         */
        preloadImages() {
            const criticalCount = Math.min(CONFIG.CRITICAL_FRAMES_COUNT, this.frames.maxIndex);
            
            // Ultra-premium engineering status messages
            const statusMessages = [
                "INICIALIZANDO MOTOR GRÁFICO...",
                "CONFIGURANDO CONTEXTO DE RENDERIZAÇÃO...",
                "ALOCANDO BUFFER DE MEMÓRIA...",
                "DECODIFICANDO TEXTURAS CRÍTICAS...",
                "SINCRO-OTIMIZANDO QUADROS..."
            ];

            const updatePreloader = (progress) => {
                const percent = Math.round(progress * 100);
                
                const percentEl = document.getElementById('preloader-percent');
                const barEl = document.getElementById('preloader-bar');
                const circleEl = document.getElementById('preloader-circle');
                const statusEl = document.getElementById('preloader-status');

                if (percentEl) percentEl.innerText = `${percent.toString().padStart(2, '0')}%`;
                if (barEl) barEl.style.width = `${percent}%`;
                if (circleEl) {
                    // SVG Circle stroke length is 471
                    const offset = 471 - (progress * 471);
                    circleEl.style.strokeDashoffset = offset;
                }

                if (statusEl) {
                    const msgIndex = Math.min(Math.floor(progress * statusMessages.length), statusMessages.length - 1);
                    statusEl.innerText = statusMessages[msgIndex];
                }
            };

            updatePreloader(0);

            let loadedCritical = 0;

            for (let i = 1; i <= criticalCount; i++) {
                const img = new Image();
                img.src = this.generateImageUrl(i);
                this.images[i] = img;

                img.onload = async () => {
                    try {
                        // Senior performance pattern: decode async off the main thread
                        if (typeof img.decode === 'function') {
                            await img.decode();
                        }
                    } catch (e) {
                        // Fallback in case of decoding errors
                    }

                    loadedCritical++;
                    this.imagesLoaded++;
                    updatePreloader(loadedCritical / criticalCount);

                    if (loadedCritical === criticalCount) {
                        this.onCriticalImagesLoaded();
                    }
                };

                img.onerror = () => {
                    loadedCritical++;
                    this.imagesLoaded++;
                    updatePreloader(loadedCritical / criticalCount);
                    if (loadedCritical === criticalCount) {
                        this.onCriticalImagesLoaded();
                    }
                };
            }
        }

        /**
         * Called as soon as critical frames are ready. Unveils page immediately.
         */
        onCriticalImagesLoaded() {
            this.isInitialized = true;
            
            // Render first frame immediately
            this.frames.currentIndex = 1;
            this.frames.targetIndex = 1;
            this.loadImage(1);
            
            // Fire smooth rendering loop
            this.startRenderLoop();

            // Fire GSAP Scroll Timeline
            this.startAnimation();

            // Smooth exit transition for the preloader
            const preloader = document.getElementById('preloader');
            const statusEl = document.getElementById('preloader-status');
            if (statusEl) statusEl.innerText = "SISTEMA PRONTO. CARREGANDO INTERAÇÃO.";

            setTimeout(() => {
                if (preloader) {
                    preloader.style.opacity = '0';
                    preloader.style.transform = 'translateY(-30px)';
                    preloader.style.pointerEvents = 'none';

                    setTimeout(() => {
                        preloader.style.display = 'none';
                    }, 1000);
                }
            }, 600);

            // Lazy load remaining 1245 images in the background with controlled batches
            this.startBackgroundPreload();
        }

        /**
         * Preload remaining images (101 to 1345) in the background with controlled batch sizes
         * to avoid blocking network channels or spiking main thread activity.
         */
        startBackgroundPreload() {
            const startIndex = CONFIG.CRITICAL_FRAMES_COUNT + 1;
            const endIndex = this.frames.maxIndex;
            let currentQueueIndex = startIndex;
            
            // Limit concurrent loaders to avoid layout/network contention
            const BATCH_SIZE = 6;
            let activeConnections = 0;

            const loadNext = () => {
                if (currentQueueIndex > endIndex) {
                    return; // All frames loaded
                }

                const indexToLoad = currentQueueIndex++;
                activeConnections++;

                const img = new Image();
                img.src = this.generateImageUrl(indexToLoad);
                this.images[indexToLoad] = img;

                img.onload = async () => {
                    try {
                        if (typeof img.decode === 'function') {
                            await img.decode();
                        }
                    } catch (e) {
                        // Silently handle exceptions
                    }

                    this.imagesLoaded++;
                    activeConnections--;

                    // Trigger next image loading during browser idle phases
                    if (typeof requestIdleCallback !== 'undefined') {
                        requestIdleCallback(() => loadNext());
                    } else {
                        setTimeout(loadNext, 0);
                    }
                };

                img.onerror = () => {
                    this.imagesLoaded++;
                    activeConnections--;
                    
                    if (typeof requestIdleCallback !== 'undefined') {
                        requestIdleCallback(() => loadNext());
                    } else {
                        setTimeout(loadNext, 0);
                    }
                };
            };

            // Start initial concurrent batch
            for (let b = 0; b < BATCH_SIZE; b++) {
                loadNext();
            }
        }

        /**
         * Load an image frame instantly on-demand if the user scrolls to it before background loader
         * @param {number} index - Frame index
         */
        loadFrameOnDemand(index) {
            if (!this.isValidFrameIndex(index) || this.images[index]) {
                return; // Already loading, loaded, or invalid
            }

            const img = new Image();
            img.src = this.generateImageUrl(index);
            this.images[index] = img;

            img.onload = async () => {
                try {
                    if (typeof img.decode === 'function') {
                        await img.decode();
                    }
                } catch (e) {
                    // Silently handle exceptions
                }

                // If user is still looking at this frame, render immediately
                const currentRound = Math.round(this.frames.currentIndex);
                if (currentRound === index) {
                    this.renderImage(img);
                    this.frames.renderedIndex = index;
                }
            };
        }

        /**
         * Generate image URL for a given frame index
         * @param {number} index - Frame index
         * @returns {string} Image URL
         */
        generateImageUrl(index) {
            const paddedIndex = index.toString().padStart(CONFIG.FRAME_PADDING, '0');
            return `./images/frame_${paddedIndex}.jpeg`;
        }

        /**
         * Load and draw a specific frame
         * @param {number} index - Frame index to display
         */
        loadImage(index) {
            if (!this.isValidFrameIndex(index)) {
                return;
            }

            const img = this.images[index];
            if (!img) {
                this.loadFrameOnDemand(index);
                return;
            }

            if (img.complete) {
                this.renderImage(img);
                this.frames.renderedIndex = index;
            }
        }

        /**
         * Validate frame index
         * @param {number} index - Frame index to validate
         * @returns {boolean} Whether index is valid
         */
        isValidFrameIndex(index) {
            return index >= 1 && index <= this.frames.maxIndex;
        }

        /**
         * Resize canvas using window dimensions multiplied by Device Pixel Ratio for Retina screens
         */
        resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            // Scale drawing operations to device pixels automatically
            this.context.scale(dpr, dpr);
        }

        /**
         * Render image on canvas with proper cover scaling, centering, and retina coordinates
         * @param {HTMLImageElement} img - Image to render
         */
        renderImage(img) {
            const canvasWidth = window.innerWidth;
            const canvasHeight = window.innerHeight;
            
            // Calculate scaling factors to match CSS cover behavior
            const scaleX = canvasWidth / img.width;
            const scaleY = canvasHeight / img.height;
            const scale = Math.max(scaleX, scaleY);

            // Calculate new dimensions
            const newWidth = img.width * scale;
            const newHeight = img.height * scale;

            // Calculate centering offsets
            const offsetX = (canvasWidth - newWidth) / 2;
            const offsetY = (canvasHeight - newHeight) / 2;

            // Clear canvas and draw using the optimized high quality rendering
            this.context.clearRect(0, 0, canvasWidth, canvasHeight);
            this.context.imageSmoothingEnabled = true;
            this.context.imageSmoothingQuality = 'high';
            this.context.drawImage(img, offsetX, offsetY, newWidth, newHeight);
        }

        /**
         * Decoupled animation render loop running at browser refresh rate
         */
        startRenderLoop() {
            const render = () => {
                const target = this.frames.targetIndex;
                const current = this.frames.currentIndex;

                // Smoothly slide currentIndex towards targetIndex using LERP damping
                if (Math.abs(target - current) < 0.05) {
                    this.frames.currentIndex = target;
                } else {
                    this.frames.currentIndex = current + (target - current) * 0.08; // 0.08 LERP factor
                }

                // Render current frame
                const frameToRender = Math.max(1, Math.min(Math.round(this.frames.currentIndex), this.frames.maxIndex));
                if (frameToRender !== this.frames.renderedIndex) {
                    this.loadImage(frameToRender);
                }

                // Smoothly interpolate custom cursor positions (if mouse data is initialized)
                if (this.mouse) {
                    const cursorEl = document.getElementById('custom-cursor');
                    const dotEl = document.getElementById('custom-cursor-dot');
                    
                    if (cursorEl && dotEl) {
                        // Outer loop LERPing with 0.12 factor
                        this.cursor.x += (this.mouse.x - this.cursor.x) * 0.12;
                        this.cursor.y += (this.mouse.y - this.cursor.y) * 0.12;
                        
                        // Inner dot LERPing with 0.35 factor
                        this.cursorDot.x += (this.mouse.x - this.cursorDot.x) * 0.35;
                        this.cursorDot.y += (this.mouse.y - this.cursorDot.y) * 0.35;
                        
                        cursorEl.style.transform = `translate3d(${this.cursor.x}px, ${this.cursor.y}px, 0) translate(-50%, -50%)`;
                        dotEl.style.transform = `translate3d(${this.cursorDot.x}px, ${this.cursorDot.y}px, 0) translate(-50%, -50%)`;
                    }

                    // Smooth LERPing for 3D mouse parallax on the hero logo container
                    const logoEl = document.getElementById('hero-logo-container');
                    if (logoEl && this.logoOffset) {
                        const centerX = window.innerWidth / 2;
                        const centerY = window.innerHeight / 2;
                        const targetOffsetX = (this.mouse.x - centerX) * 0.035; // Subtle 3.5% displacement
                        const targetOffsetY = (this.mouse.y - centerY) * 0.035;
                        
                        this.logoOffset.x += (targetOffsetX - this.logoOffset.x) * 0.1;
                        this.logoOffset.y += (targetOffsetY - this.logoOffset.y) * 0.1;
                        
                        logoEl.style.transform = `translate3d(calc(-50% + ${this.logoOffset.x}px), calc(-50% + ${this.logoOffset.y}px), 0)`;
                    }
                }

                requestAnimationFrame(render);
            };

            requestAnimationFrame(render);
        }

        /**
         * Start the main animation timeline (Scaled ratios to map perfectly up to frame 1345)
         */
        startAnimation() {
            if (typeof gsap === 'undefined') {
                console.error('GSAP not available');
                return;
            }

            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: SELECTORS.PARENT,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: CONFIG.ANIMATION_SCRUB_DURATION
                }
            });

            this.buildAnimationTimeline(timeline);
        }

        /**
         * Build the complete animation timeline
         * Tweens targetIndex properties; LERP loop draws the frames smoothly.
         * @param {GSAPTimeline} timeline - GSAP timeline instance
         */
        buildAnimationTimeline(timeline) {
            // Frame progression animations scaled to map fully to 1345 frames!
            timeline
                .to(this.frames, this.createFrameUpdate(236), TIMELINE_LABELS.FIRST)
                .to(SELECTORS.ANIMATE1, { opacity: 0, ease: 'linear' }, TIMELINE_LABELS.FIRST)
                
                .to(this.frames, this.createFrameUpdate(472), TIMELINE_LABELS.SECOND)
                .to(SELECTORS.ANIMATE2, { opacity: 1, ease: 'linear' }, TIMELINE_LABELS.SECOND)

                .to(this.frames, this.createFrameUpdate(519), TIMELINE_LABELS.THIRD)
                .to(this.frames, this.createFrameUpdate(613), TIMELINE_LABELS.FOURTH)
                .to(SELECTORS.ANIMATE2, { opacity: 0, ease: 'linear' }, TIMELINE_LABELS.FOURTH)

                .to(this.frames, this.createFrameUpdate(637), TIMELINE_LABELS.FIFTH)
                .to(SELECTORS.ANIMATE3, { opacity: 1, ease: 'linear' }, TIMELINE_LABELS.FIFTH)

                .to(this.frames, this.createFrameUpdate(778), TIMELINE_LABELS.SIXTH)
                .to(SELECTORS.ANIMATE3, { opacity: 0, ease: 'linear' }, TIMELINE_LABELS.SIXTH)

                .to(this.frames, this.createFrameUpdate(849), TIMELINE_LABELS.SEVENTH)
                .to(this.frames, this.createFrameUpdate(896), TIMELINE_LABELS.EIGHTH)
                .to(SELECTORS.PANEL, { x: '0%', ease: 'expo' }, TIMELINE_LABELS.EIGHTH)

                .to(this.frames, this.createFrameUpdate(944), TIMELINE_LABELS.NINTH)
                .to(SELECTORS.PANEL, { x: '100%', ease: 'linear' }, TIMELINE_LABELS.NINTH)

                .to(this.frames, this.createFrameUpdate(1014), TIMELINE_LABELS.TENTH)
                .to(this.frames, this.createFrameUpdate(1085), TIMELINE_LABELS.ELEVENTH)
                .to(SELECTORS.CANVAS, { scale: CONFIG.CANVAS_SCALE_FACTOR, ease: 'linear' }, TIMELINE_LABELS.ELEVENTH)
                
                .to(this.frames, this.createFrameUpdate(1132), TIMELINE_LABELS.TWELFTH)
                .to(SELECTORS.PANELISM, { opacity: 1, ease: 'expo' }, TIMELINE_LABELS.TWELFTH)
                
                .to(this.frames, this.createFrameUpdate(1180), TIMELINE_LABELS.TWELFTH)
                .to(SELECTORS.PANELISM_SPAN, { width: CONFIG.LINE_WIDTH_EXPANDED, ease: 'expo' }, TIMELINE_LABELS.TWELFTH)
                
                .to(this.frames, this.createFrameUpdate(1250), TIMELINE_LABELS.THIRTEENTH)
                .to(SELECTORS.CANVAS, { scale: 1, ease: 'linear' }, TIMELINE_LABELS.THIRTEENTH)

                .to(this.frames, this.createFrameUpdate(1298), TIMELINE_LABELS.FOURTEENTH)
                .to(SELECTORS.PANELISM, { scale: CONFIG.PANELISM_SCALE_FACTOR, ease: 'circ' }, TIMELINE_LABELS.FOURTEENTH)

                .to(this.frames, this.createFrameUpdate(1345), TIMELINE_LABELS.FIFTEENTH)
                .to(SELECTORS.PANELISM, { scale: CONFIG.PANELISM_SCALE_FACTOR, ease: 'circ' }, TIMELINE_LABELS.FIFTEENTH);
        }

        /**
         * Create frame update animation configuration for GSAP
         * Animates targetIndex; decouples scroll and rendering.
         * @param {number} targetIndex - Target frame index
         * @returns {Object} Animation configuration object
         */
        createFrameUpdate(targetIndex) {
            return {
                targetIndex: targetIndex,
                ease: 'linear'
            };
        }

        /**
         * Setup heading animations
         */
        setupHeadingAnimations() {
            if (typeof gsap === 'undefined') {
                return;
            }

            const headings = document.querySelectorAll(SELECTORS.HEADINGS);
            headings.forEach(heading => {
                gsap.from(heading, {
                    scrollTrigger: {
                        trigger: heading,
                        start: 'top 90%',
                        end: 'bottom 20%',
                        scrub: CONFIG.HEADING_ANIMATION_SCRUB
                    },
                    opacity: 0.3
                });
            });
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            window.addEventListener('resize', this.handleResize.bind(this));
            this.setupHeadingAnimations();

            // Synchronize footer "VOLTAR AO TOPO" scroll button with Lenis Scroll
            const backToTopBtn = document.getElementById('back-to-top');
            if (backToTopBtn && this.lenis) {
                backToTopBtn.addEventListener('click', () => {
                    this.lenis.scrollTo(0, { duration: 1.8 });
                });
            }
        }

        /**
         * Handle window resize
         */
        handleResize() {
            if (this.isInitialized) {
                this.resizeCanvas();
                this.loadImage(Math.round(this.frames.currentIndex));
            }
        }

        /**
         * Handle initialization errors gracefully
         * @param {Error} error - Initialization error
         */
        handleInitializationError(error) {
            console.error('Animation system failed to initialize:', error);
        }

        /**
         * Public method to manually load a specific frame
         * @param {number} index - Frame index to load
         */
        loadFrame(index) {
            if (this.isInitialized) {
                this.loadImage(index);
            }
        }

        /**
         * Public method to get current frame information
         * @returns {Object} Current frame state
         */
        getCurrentFrame() {
            return {
                index: this.frames.currentIndex,
                targetIndex: this.frames.targetIndex,
                maxIndex: this.frames.maxIndex,
                isInitialized: this.isInitialized,
                imagesLoaded: this.imagesLoaded
            };
        }
    }

    // Initialize the animation system when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new DozeStudioAnimation();
        });
    } else {
        new DozeStudioAnimation();
    }

})();
