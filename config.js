/**
 * Doze Studio - Global Configurations, Labels, and Selectors
 * Separated configuration layer.
 * 
 * @author Estúdio Doze
 */

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
