# 🎆 Sound Sparkle
*Interactive Digital Fireworks System with Real-Time Audio Analysis*

## 🎵 Computer Audition & Audio Analysis

Sound Sparkle transforms your sounds into beautiful firework displays using advanced computer audition techniques. The system analyzes multiple aspects of incoming audio to create intelligent, responsive visual effects.

### 🔊 Audio Processing Pipeline

#### **1. Microphone Input & Signal Processing**
- **Real-time audio capture** using p5.AudioIn()
- **Adjustable sensitivity** (manual control via ↑/↓ keys)
- **Dynamic range compression** for optimal visualization
- **Peak hold detection** with smooth decay for visual feedback

#### **2. FFT (Fast Fourier Transform) Analysis**
- **Frequency spectrum analysis** with 64-bin resolution
- **Real-time spectral decomposition** of incoming audio
- **Frequency range focus**: 80Hz - 2000Hz (optimized for human sounds)
- **Temporal buffering**: Analyzes 250ms windows for complex sound events

#### **3. Pitch Detection System**
The system uses a sophisticated dual-method approach for accurate pitch detection:

**Method 1: Peak Frequency Detection**
- Identifies the loudest frequency component in the spectrum
- Applies amplitude thresholds to filter out noise
- Focuses on musically relevant frequency ranges

**Method 2: Harmonic Analysis**
- Tests potential fundamental frequencies (80-800Hz)
- Analyzes harmonic content (2f, 3f, 4f, 5f) for each candidate
- Weights lower harmonics more heavily for accuracy
- Returns results only with strong harmonic patterns

#### **4. Sound Classification**
Advanced spectral analysis classifies sounds into categories:
- **Finger Snaps**: High spectral centroid + large pitch variation + sharp intensity
- **Claps**: Broad spectrum with sharp attack patterns
- **Whistles**: Stable high pitch with low intensity variation  
- **Voice**: Moderate pitch range with sustained characteristics
- **General Percussion**: Default category for other transient sounds

### 🎨 Visual Mapping System

#### **Color Mapping (Pure Pitch-Based)**
The system maps detected pitch frequencies to colors using a natural spectral progression:

| Pitch Range | Color Palette | Example Sounds |
|-------------|---------------|----------------|
| **< 150Hz** | Deep Red/Orange | Bass drums, low voice |
| **150-250Hz** | Red to Orange | Deep claps, low vocals |
| **250-350Hz** | Orange to Yellow | Normal claps, mid voice |
| **350-450Hz** | Yellow to Yellow-Green | Higher voice, some instruments |
| **450-550Hz** | Green | Mid-high voice, musical tones |
| **550-700Hz** | Green to Cyan | High voice, bright sounds |
| **700-900Hz** | Cyan to Blue | Very high voice, harmonics |
| **> 900Hz** | Blue to Purple | Whistles, high harmonics |

**Intensity Effects on Colors:**
- Higher intensity = brighter, more saturated colors
- Lower intensity = dimmer, more muted tones
- Creates dynamic color variations within each pitch range

#### **Explosion Characteristics**
Firework properties scale intelligently with sound characteristics:

**Particle Count:** 12-50 particles
- Quiet sounds: ~12-20 particles
- Medium sounds: ~25-35 particles  
- Loud sounds: ~40-50 particles

**Explosion Size Scaling:**
- **Scale Factor**: 0.7x to 1.8x based on intensity
- **Speed Multiplier**: 0.6x to 1.6x for particle velocity
- **Particle Size**: 0.8x to 2.0x individual particle scaling
- **Duration**: Longer-lasting effects for higher intensity sounds

**Visual Effects:**
- **Glow halos** for larger particles (high intensity)
- **Enhanced sparkles** with frequency scaling based on intensity
- **Particle trails** for firework rockets before explosion
- **Gravity simulation** for realistic particle physics

### 🎯 Temporal Analysis for Complex Sounds

#### **Sound Event Detection**
- **Peak Detection**: Identifies sudden amplitude increases (configurable thresholds)
- **Event Windows**: 200ms analysis period after peak detection
- **Characteristic Extraction**: Analyzes pitch evolution, spectral centroid, intensity patterns
- **Intelligent Triggering**: Prevents spam with 300ms cooldown between fireworks

#### **Enhanced Responsiveness**
The system captures the complete spectral evolution of sounds like finger snaps:
1. **Initial Detection**: Triggers on amplitude spike
2. **Temporal Analysis**: Continues analyzing for 200ms
3. **Characteristic Fusion**: Combines peak pitch, average pitch, and spectral brightness
4. **Optimal Representation**: Creates fireworks based on dominant sound characteristics

This approach ensures that complex sounds (like finger snaps that start low and end high) are properly represented by their most prominent spectral features rather than just their initial components.

### 🎛️ User Controls

| Key | Function |
|-----|----------|
| **↑/↓** | Adjust microphone sensitivity |
| **F** | Manual firework trigger |  
| **H** | Toggle UI display visibility |

### 💡 Technical Features

- **Cross-browser compatibility** with automatic audio context handling
- **Responsive visual scaling** (1400x800 canvas)
- **Translucent UI elements** that don't interfere with fireworks
- **Real-time performance optimization** with efficient particle management
- **Console logging** for debugging and system monitoring