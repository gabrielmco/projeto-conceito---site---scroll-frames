/**
 * Doze Studio - Procedural Audio Controller (Dynamic Synthesizer)
 * Creates dynamic, real-time cinematic dark-ambient soundscapes via Web Audio API.
 * Modulated dynamically by user scroll velocity and mouse position.
 * 
 * @author Estúdio Doze
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

    /**
     * Bind DOM controls and listeners
     */
    initElements() {
        this.btn = document.getElementById('audio-toggle');
        this.statusText = document.getElementById('audio-status');
        
        if (this.btn) {
            this.btn.addEventListener('click', () => this.toggle());
        }
    }

    /**
     * Lazily initialize nodes on first interaction
     */
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

        // Connection Routing
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

    /**
     * Toggle play/pause state
     */
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

    /**
     * Smoothly fade in the atmospheric sound
     */
    fadeIn() {
        this.isPlaying = true;
        this.btn.classList.add('audio-playing');
        if (this.statusText) this.statusText.innerText = 'ATIVA';
        this.mainGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.8);
    }

    /**
     * Smoothly fade out the atmospheric sound
     */
    fadeOut() {
        this.isPlaying = false;
        this.btn.classList.remove('audio-playing');
        if (this.statusText) this.statusText.innerText = 'DESATIVADA';
        this.mainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
    }

    /**
     * Modulate low-pass filter cutoff with scroll speed (acoustical acceleration feedback)
     * @param {number} velocity - Scroll velocity from Lenis
     */
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
