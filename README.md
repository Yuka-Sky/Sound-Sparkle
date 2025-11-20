# 🎆 Sound Sparks
*Interactive Digital Fireworks System with Real-Time Audio Analysis & Generative Music*

## 🎵 Computer Audition & Audio Analysis

Sound Sparks transforms your sounds into beautiful firework displays using advanced computer audition techniques, while simultaneously generating responsive musical compositions. The system analyzes multiple aspects of incoming audio to create intelligent, responsive visual and musical effects.

### 🔊 Audio Processing Pipeline

#### **1. Microphone Input & Signal Processing**
- **Real-time audio capture** using p5.AudioIn()
- **Adjustable sensitivity** (manual control via ↑/↓ keys)
- **Dynamic range compression** for optimal visualization
- **Peak hold detection** with smooth decay for visual feedback
- **Audio feedback prevention** system to prevent music-input loops

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

**ML5.js Integration (Optional)**
- Fallback to ML5.js pitch detection when available
- Primary system relies on FFT-based analysis for consistency

### 🎼 Generative Music System

Sound Sparks features an advanced generative music system that creates evolving musical compositions based on your audio input and firework events.

#### **Multi-Layer Synthesis**
The music system consists of four independent synthesizer layers:

**🎸 Bass Layer**
- **Frequency**: Plays on downbeats (quarter note intervals)
- **Range**: Low octave (octave 2) for foundation
- **Pattern**: Simple root-fifth patterns that evolve over time
- **Envelope**: Punchy attack (0.05s) with sustained release (2.0s)

**🎹 Melody Layer**
- **Frequency**: Varies based on activity level (more fireworks = faster melody)
- **Range**: Mid-high octaves (4+, rises with complexity)
- **Pattern**: Ascending/descending scale patterns that evolve
- **Envelope**: Balanced melodic envelope (0.1s attack, 1.0s release)

**🎻 Harmony Layer**
- **Frequency**: Long intervals (8 beats) for atmospheric pads
- **Range**: Mid octave (octave 3) for harmonic support
- **Pattern**: Full chord progressions (I-vi-IV-I, i-III-v-i)
- **Envelope**: Soft, atmospheric (0.2s attack, 2.5s release)

**🥁 Percussion Layer**
- **Frequency**: Triggered by sharp audio transients
- **Range**: High frequencies (800-2000Hz) for crisp hits
- **Pattern**: Responds directly to sound events
- **Envelope**: Very short, percussive hits (0.01s attack, 0.1s release)

#### **Musical Intelligence & Evolution**
**Adaptive Activity System:**
- Music activity level scales with firework frequency
- More fireworks = faster tempo, more complex patterns
- Activity influences all layers simultaneously

**Pattern Evolution:**
- **Complexity Growth**: Musical complexity increases over 2-minute sessions
- **Pattern Mutation**: Bass and melody patterns evolve every 8 seconds
- **Organic Development**: Random variations keep music fresh and unpredictable

**Scale System:**
- **Major Mode**: Bright, uplifting progressions (default)
- **Minor Mode**: Can shift based on low-frequency inputs
- **Harmonic Context**: Full chord progressions with proper voice leading

**Firework-Music Integration:**
- Each firework triggers specific melodic phrases
- Pitch range of fireworks influences musical responses:
  - **Low sounds** → Deep melodic phrases
  - **High sounds** → Bright, ascending melodies
- Musical key can shift based on dominant pitch characteristics

### 🎨 Visual Mapping System

#### **Pitch-Based Color Mapping**
The system maps detected pitch frequencies to colors using natural spectral progression:

| Pitch Range | Color Palette | Musical Context |
|-------------|---------------|-----------------|
| **Low (< 150Hz)** | Brown/Red/Orange | Bass drums, low voice |
| **Mid-Low (150-300Hz)** | Orange/Yellow | Normal claps, mid voice |
| **Mid-High (300-450Hz)** | Yellow/Light Green | Higher voice, instruments |
| **High (> 450Hz)** | Green/Cyan/Blue/Purple | Whistles, high harmonics |

#### **Enhanced Visual Effects**
- **Intensity Scaling**: Particle count (30-60), size, and duration scale with sound intensity
- **Glow Effects**: Multi-layer particle rendering with transparency
- **Sparkle System**: Dynamic sparkle generation based on intensity
- **Physics Simulation**: Realistic gravity and particle movement

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

### 🎯 Temporal Analysis for Complex Sounds

#### **Sound Event Detection**
- **Peak Detection**: Identifies sudden amplitude increases (configurable thresholds)
- **Event Windows**: 200ms analysis period after peak detection
- **Characteristic Extraction**: Analyzes pitch evolution, spectral content, intensity patterns
- **Intelligent Triggering**: Prevents spam with 300ms cooldown between fireworks
- **Feedback Prevention**: 1-second input suppression after music generation

#### **Enhanced Responsiveness**
The system captures the complete spectral evolution of complex sounds:
1. **Initial Detection**: Triggers on amplitude spike
2. **Temporal Analysis**: Continues analyzing for 200ms
3. **Characteristic Fusion**: Combines peak pitch, average pitch, and spectral brightness
4. **Dual Output**: Creates both visual fireworks AND musical responses

### 🎛️ User Controls & Interface

#### **Keyboard Controls**
| Key | Function |
|-----|----------|
| **↑/↓** | Adjust microphone sensitivity (0.5x - 10x) |
| **F** | Manual firework trigger |  
| **H** | Toggle UI display visibility |
| **M** | Toggle generative music system |
| **R** | Reset music patterns to initial state |
| **V** | Toggle visual elements (circle meter, spectrum, pitch text) |
| **N** | Toggle microphone input |
| **SPACE** | Test music system (plays test note) |

#### **Visual Interface Elements**
**Real-time Status Display (when UI enabled with H):**
- **Audio Analysis**: Raw levels, processed levels, peak hold, detected pitch
- **Firework System**: Active fireworks, particles, sound event status
- **Generative Music**: Complexity percentage, activity level, events in memory
- **Controls**: Complete keyboard reference
- **Status Indicators**: Music ON/OFF, Microphone ON/OFF, Visuals ON/OFF

**Visual Components (toggleable with V):**
- **Circle Meter**: Central amplitude visualization with color-coded intensity
- **Frequency Spectrum**: Bottom display showing real-time frequency analysis
- **Pitch Detection**: Live pitch readout and instruction text

### 🎚️ Audio Feedback Prevention

**Smart Input Management:**
- **Temporal Suppression**: Microphone input reduced 90% for 1 second after any music generation
- **Loop Detection**: Prevents music output from triggering new fireworks
- **Manual Override**: All keyboard controls remain functional during suppression
- **Visual Feedback**: UI shows when input is suppressed

This ensures the generative music enhances rather than interferes with the interactive experience.

### 💡 Technical Features

- **Cross-browser compatibility** with automatic audio context handling
- **Responsive visual scaling** (1400x800 canvas)
- **Multi-threaded music synthesis** with voice limiting to prevent audio conflicts
- **Real-time performance optimization** with efficient particle and audio management
- **Modular architecture** separating visual, audio, and music systems
- **Console logging** for debugging and system monitoring
- **State persistence** for music patterns and system settings

### 🚀 Getting Started

1. **Open `index.html`** in a modern web browser
2. **Click anywhere** to enable audio context (browser requirement)
3. **Make sounds** (claps, snaps, voice) to trigger fireworks and music
4. **Use keyboard controls** to customize your experience
5. **Press H** to see detailed system information and controls

**Optimal Experience:**
- Use in a quiet environment for best pitch detection
- Adjust sensitivity (↑/↓) based on your microphone setup
- Try different types of sounds to explore the color palette
- Let the music evolve - complexity builds over time
- Toggle visuals (V) to focus on either fireworks or music

---

*Sound Sparks combines advanced computer audition, generative music algorithms, and interactive visual design to create a unique audiovisual experience that responds intelligently to your creative input.*