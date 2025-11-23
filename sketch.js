// Variables for microphone and audio processing
let mic;
let micLevel = 0;
let smoothLevel = 0;

// Enhanced sensitivity variables
let sensitivity = 3.0; // Amplification factor
let maxRecordedLevel = 0; // Track the maximum level seen
let dynamicRange = 0.5; // Dynamic range adjustment
let peakHold = 0; // Peak hold value
let peakDecay = 0.95; // How fast peaks decay

// Audio feedback prevention
let lastMusicPlayTime = 0;
let musicSuppressionDuration = 1000; // Suppress input for 1 second after music plays
let inputSuppressed = false;

// FFT and pitch detection variables
let fft;
let pitchDetection;
let pitch = 0;
let spectrum = [];
let frequencyBins = 64; // Number of frequency bins to analyze

// Enhanced temporal analysis for complex sounds
let soundBuffer = []; // Buffer to store recent sound characteristics
let bufferSize = 15; // Frames to analyze (250ms at 60fps)

// Firework system variables
let fireworks = [];
let particles = [];
let lastFireworkTime = 0;
let fireworkCooldown = 300; // Reduced cooldown for better responsiveness

// Enhanced peak detection for complex sounds
let previousLevel = 0;
let peakThreshold = 0.25; // Slightly lower threshold
let peakSensitivity = 0.12; // More sensitive to catch quick transients
let soundEventActive = false;
let soundEventStartTime = 0;
let soundEventDuration = 200; // ms to analyze after peak detection

// UI visibility toggle
let showUI = true; // Toggle for hiding/showing text displays
let micEnabled = true; // Microphone toggle
let showVisuals = true; // Circle and pitch display toggle

// Advanced Generative Music System
let musicSystem = {
  // Synthesizers for different layers
  bassSynth: null,
  melodySynth: null,
  harmonySynth: null,
  percussionSynth: null,
  
  // Musical parameters
  enabled: true,
  key: 'C',
  mode: 'major',
  tempo: 120,
  
  // Timing
  lastBassTime: 0,
  lastMelodyTime: 0,
  lastHarmonyTime: 0,
  lastPercussionTime: 0,
  
  // Musical patterns and sequences
  bassPattern: [],
  melodySequence: [],
  harmonyProgression: [],
  
  // Current positions in patterns
  bassPosition: 0,
  melodyPosition: 0,
  harmonyPosition: 0,
  
  // Musical evolution
  complexity: 0.1, // Starts simple, builds over time
  activity: 0, // How active the music should be based on fireworks
  
  // Scales and chord progressions
  scales: {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10]
  },
  
  chordProgressions: {
    major: [[0, 2, 4], [5, 7, 9], [3, 5, 7], [0, 2, 4]], // I-vi-IV-I in scale degrees
    minor: [[0, 2, 4], [3, 5, 7], [5, 7, 9], [0, 2, 4]] // i-III-v-i
  }
};

// Firework-to-music mapping parameters
let musicMapping = {
  fireworkEvents: [], // Track recent firework events for musical analysis
  eventHistory: [], // Longer history for pattern detection
  maxEventHistory: 50,
  
  // Sensitivity controls
  frequencyThreshold: 90,
  energyThreshold: 0.12
};

// Initialize microphone, FFT, pitch detection, and music system
function setup() {
  createCanvas(1400, 800);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.8, frequencyBins);
  fft.setInput(mic);
  initializePitchDetection();
  initializeGenerativeMusic();
}

function initializePitchDetection() {
  // Try to initialize ML5 pitch detection if available
  console.log('Checking ML5 availability...');
  
  if (typeof ml5 !== 'undefined') {
    console.log('ML5 detected, checking for pitch detection...');
    
    // Check if pitch detection is available in this ML5 version
    if (ml5.pitchDetection) {
      try {
        pitchDetection = ml5.pitchDetection('./model/', mic.stream, modelLoaded);
        console.log('ML5 pitch detection initialized');
      } catch (error) {
        console.warn('ML5 pitch detection failed to initialize:', error);
        console.log('Falling back to FFT-based pitch estimation');
        pitchDetection = null;
      }
    } else {
      console.log('ML5 pitch detection not available in this version, using FFT-based estimation');
    }
  } else {
    console.log('ML5 not loaded, using FFT-based pitch estimation');
  }
}

function modelLoaded() {
  console.log('ML5 Pitch Detection Model Loaded!');
  getPitch();
}

function getPitch() {
  if (pitchDetection) {
    pitchDetection.getPitch(function(err, frequency) {
      if (!err && frequency) {
        pitch = frequency;
      } else {
        pitch = 0;
      }
      getPitch(); // Continue getting pitch
    });
  }
}

function draw() {
  background(20, 25, 40); // Dark blue background
  
  // Check if we should suppress input due to recent music output
  inputSuppressed = (millis() - lastMusicPlayTime) < musicSuppressionDuration;
  
  let rawLevel = micEnabled ? mic.getLevel() : 0;
  
  // Apply input suppression to prevent feedback loops
  if (inputSuppressed) {
    rawLevel *= 0.1; // Significantly reduce sensitivity when music was just played
  }
  
  micLevel = rawLevel * sensitivity; // Apply sensitivity amplification
  
  // Track maximum level for dynamic range
  if (micLevel > maxRecordedLevel) {
    maxRecordedLevel = micLevel;
  }
  // Apply dynamic range compression for better visualization
  if (maxRecordedLevel > 0) {
    micLevel = map(micLevel, 0, maxRecordedLevel * dynamicRange, 0, 1);
    micLevel = constrain(micLevel, 0, 1);
  }
  // Peak hold processing
  if (micLevel > peakHold) {
    peakHold = micLevel;
  } else {
    peakHold *= peakDecay;
  }
  
  // Fluid animation
  smoothLevel = lerp(smoothLevel, micLevel, 0.15);
  
  // FFT Analysis
  spectrum = fft.analyze();
  
  estimatePitchFromFFT(); // Always estimate pitch from FFT (ML5 is backup/comparison)
  updateSoundBuffer();
  detectAmplitudePeaksWithTemporal();  // Detect amplitude peaks for firework triggering (enhanced with temporal analysis)
  updateGenerativeMusic(); // Advanced generative music system
  
  updateFireworks();
  drawFireworks();
  if (showVisuals) {
    drawCircleMeter();
    drawSpectrum();
  }
  
  displayInfo();
}

function displayInfo() {
  if (showUI) {
    fill(255);
    textAlign(LEFT);
    textSize(12);
  
    text('AUDIO ANALYSIS', 20, 20);
    text(`Raw Level: ${(mic.getLevel() * sensitivity).toFixed(3)}`, 20, 40);
    text(`Processed Level: ${smoothLevel.toFixed(3)}`, 20, 55);
    text(`Peak Hold: ${peakHold.toFixed(3)}`, 20, 70);
    text(`Pitch: ${pitch.toFixed(1)} Hz`, 20, 85);
    text(`Sensitivity: ${sensitivity.toFixed(1)}x`, 20, 100);
    
    text('FIREWORK SYSTEM', 20, 135);
    text(`Active Fireworks: ${fireworks.length}`, 20, 155);
    text(`Active Particles: ${particles.length}`, 20, 170);
    text(`Sound Event: ${soundEventActive ? 'ANALYZING' : 'LISTENING'}`, 20, 185);
    text(`Buffer Size: ${soundBuffer.length}/${bufferSize}`, 20, 200);
    
    text('GENERATIVE MUSIC', 20, 240);
    text(`Complexity: ${(musicSystem.complexity * 100).toFixed(0)}%`, 20, 255);
    text(`Activity: ${(musicSystem.activity * 100).toFixed(0)}%`, 20, 270);
    text(`Events in Memory: ${musicMapping.fireworkEvents.length}`, 20, 285);
    
    textAlign(RIGHT);
    textSize(12);
    text('CONTROLS', width - 20, 20);
    text('↑/↓: Sensitivity ±0.5', width - 20, 40);
    text('F: Manual firework', width - 20, 55);
    text('R: Reset music patterns', width - 20, 70);
    text('1: Toggle UI display', width - 20, 85);
    text('2: Toggle music', width - 20, 100);
    text('3: Toggle visuals', width - 20, 115);
    text('4: Toggle microphone', width - 20, 130);
    
    // Status indicators
    text('STATUS', width - 20, 160);
    
    // Music status with color
    if (musicSystem.enabled) {
      fill(0, 255, 0);
      text('Music: ON', width - 20, 180);
    } else {
      fill(255, 100, 100);
      text('Music: OFF', width - 20, 180);
    }
    
    // Mic status with color
    fill(micEnabled ? [0, 255, 0] : [255, 100, 100]);
    text(micEnabled ? 'Mic: ON' : 'Mic: OFF', width - 20, 200);
    
    // Visual status with color
    fill(showVisuals ? [0, 255, 0] : [255, 100, 100]);
    text(showVisuals ? 'Visuals: ON' : 'Visuals: OFF', width - 20, 220);
  }
  
  if (showVisuals) {
    textAlign(CENTER);
    if (pitch > 0) {
      fill(100, 255, 200);
      textSize(14);
      text(`Detected Pitch: ${pitch.toFixed(1)} Hz`, width / 2, height - 60);
    }
    fill(150);
    textSize(12);
    text('Try clapping, shouting, or making sudden loud sounds!', width / 2, height - 40);
  }
}

function drawCircleMeter() {
  let centerX = width / 2;
  let centerY = height / 2;
  let maxRadius = 150;
  noFill();
  stroke(50, 50, 50, 80);
  strokeWeight(20);
  circle(centerX, centerY, maxRadius * 2);
  let arcRadius = map(smoothLevel, 0, 1, 0, maxRadius);
  // Color based on level intensity
  if (smoothLevel > 0.7) {
    stroke(255, 50, 50, 120); // Red for high levels
  } else if (smoothLevel > 0.4) {
    stroke(255, 200, 50, 120); // Orange for medium levels
  } else {
    stroke(50, 255, 100, 120); // Green for low levels
  }
  
  strokeWeight(20);
  circle(centerX, centerY, arcRadius * 2);
  // Inner glow effect
  if (smoothLevel > 0.1) {
    stroke(255, 255, 255, 60);
    strokeWeight(5);
    circle(centerX, centerY, arcRadius * 2);
  }
  
  // Center dot
  fill(255, 255, 255, 150);
  noStroke();
  circle(centerX, centerY, 10);
}

// Draw frequency spectrum
function drawSpectrum() {
  if (spectrum.length > 0) {
    strokeWeight(1);
    noFill();
    
    let barWidth = width / spectrum.length;
    for (let i = 0; i < spectrum.length; i++) {
      let amp = spectrum[i];
      let h = map(amp, 0, 255, 0, 100);
      
      // Color based on frequency range
      if (i < spectrum.length * 0.3) {
        stroke(255, 50, 50, 150); // Red for low frequencies
      } else if (i < spectrum.length * 0.7) {
        stroke(50, 255, 50, 150); // Green for mid frequencies
      } else {
        stroke(50, 50, 255, 150); // Blue for high frequencies
      }
      line(i * barWidth, height, i * barWidth, height - h);
    }
  }
}

// Enhanced peak detection with temporal analysis for complex sounds
function detectAmplitudePeaksWithTemporal() {
  // Check for sudden increases in amplitude
  let levelChange = micLevel - previousLevel;
  
  // Start sound event analysis when we detect a peak
  if (levelChange > peakSensitivity && 
      micLevel > peakThreshold && 
      !soundEventActive &&
      millis() - lastFireworkTime > fireworkCooldown) {
    soundEventActive = true;
    soundEventStartTime = millis();
    console.log(`Sound event detected! Starting temporal analysis...`);
  }
  
  // Continue analyzing during sound event
  if (soundEventActive) {
    let eventDuration = millis() - soundEventStartTime;
    
    // End of sound event - analyze and trigger firework
    if (eventDuration >= soundEventDuration || micLevel < peakThreshold * 0.5) {
      let soundCharacteristics = analyzeSoundEvent();
      
      // Trigger firework with analyzed characteristics
      let x = random(width * 0.2, width * 0.8);
      let y = random(height * 0.3, height * 0.7);
      
      triggerFirework(x, y, soundCharacteristics);
      
      // Reset for next sound event
      soundEventActive = false;
      lastFireworkTime = millis();
      
      console.log(`Firework triggered!`);
    }
  }
  
  previousLevel = micLevel;
}

// Update sound characteristics buffer
function updateSoundBuffer() {
  let soundFrame = {
    level: micLevel,
    pitch: pitch,
    timestamp: millis()
  };
  
  soundBuffer.push(soundFrame);
  
  // Keep buffer at manageable size
  if (soundBuffer.length > bufferSize) {
    soundBuffer.shift();
  }
}

// Analyze sound event for pitch and energy to determine firework characteristics
function analyzeSoundEvent() {
  if (soundBuffer.length === 0) {
    return {
      dominantPitch: pitch,
      pitchRange: getPitchRange(pitch),
      intensity: smoothLevel
    };
  }
  
  // Analyze pitch evolution over the sound event
  let recentFrames = soundBuffer.slice(-Math.min(bufferSize, soundBuffer.length));
  
  // Find peak pitch (highest frequency component)
  let maxPitch = 0;
  let avgPitch = 0;
  let validPitches = [];
  
  for (let frame of recentFrames) {
    if (frame.pitch > 80) { // Valid pitch threshold
      validPitches.push(frame.pitch);
      if (frame.pitch > maxPitch) {
        maxPitch = frame.pitch;
      }
    }
  }
  
  if (validPitches.length > 0) {
    avgPitch = validPitches.reduce((a, b) => a + b, 0) / validPitches.length;
  }
  
  // Determine sound characteristics
  let dominantPitch = maxPitch > 0 ? maxPitch : avgPitch > 0 ? avgPitch : pitch;
  let intensity = Math.max(...recentFrames.map(f => f.level));
  
  return {
    dominantPitch: dominantPitch,
    pitchRange: getPitchRange(dominantPitch),
    intensity: intensity
  };
}

// Get pitch range category
function getPitchRange(pitch) {
  if (pitch < 150) return 'low';
  else if (pitch < 300) return 'midLow';
  else if (pitch < 450) return 'midHigh';
  else return 'high';
}

// Enhanced FFT-based pitch estimation
function estimatePitchFromFFT() {
  if (spectrum.length === 0) return pitch; // Return previous pitch if no data
  let detectedPitch = 0;
  let peakFreq = findPeakFrequency(); // Method 1
  let harmonicFreq = findFundamentalFrequency(); // Method 2
  
  // Use harmonic analysis if it finds a strong fundamental, otherwise use peak
  if (harmonicFreq > 0 && harmonicFreq < 1000) {
    detectedPitch = harmonicFreq;
  } else if (peakFreq > 0) {
    detectedPitch = peakFreq;
  }
  
  // Smooth pitch changes to avoid jitter
  if (detectedPitch > 0) {
    pitch = lerp(pitch, detectedPitch, 0.1);
  }
  
  return pitch;
}

// Find the peak frequency in the spectrum
function findPeakFrequency() {
  let maxAmp = 0;
  let maxBin = 0;
  
  // Focus on frequencies between 80Hz and 2000Hz
  let nyquist = 22050; // Half of sample rate
  let binSize = nyquist / spectrum.length;
  let startBin = Math.floor(80 / binSize);
  let endBin = Math.floor(2000 / binSize);
  
  // Find peak with minimum amplitude threshold
  let threshold = 50;
  
  for (let i = startBin; i < endBin && i < spectrum.length; i++) {
    if (spectrum[i] > maxAmp && spectrum[i] > threshold) {
      maxAmp = spectrum[i];
      maxBin = i;
    }
  }
  
  if (maxAmp > threshold) {
    return maxBin * binSize;
  }
  
  return 0;
}

// Find fundamental frequency using harmonic analysis
function findFundamentalFrequency() {
  let nyquist = 22050;
  let binSize = nyquist / spectrum.length;
  
  // Look for fundamental frequencies between 80-800Hz
  let minFreq = 80;
  let maxFreq = 800;
  let bestFundamental = 0;
  let bestScore = 0;
  
  // Test potential fundamental frequencies
  for (let f = minFreq; f <= maxFreq; f += 5) {
    let score = 0;
    
    // Check the fundamental and its harmonics (2f, 3f, 4f, 5f)
    for (let harmonic = 1; harmonic <= 5; harmonic++) {
      let harmonicBin = Math.floor((f * harmonic) / binSize);
      if (harmonicBin < spectrum.length) {
        score += spectrum[harmonicBin] * (1.0 / harmonic); // Weight lower harmonics more
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestFundamental = f;
    }
  }
  
  // Only return if we have a strong enough signal
  if (bestScore > 100) {
    return bestFundamental;
  }
  
  return 0;
}

// Trigger firework
function triggerFirework(x, y, characteristics) {
  let firework = {
    x: x,
    y: y,
    targetX: x + random(-50, 50),
    targetY: y - random(50, 150),
    exploded: false,
    trail: [],
    age: 0,
    pitch: characteristics.dominantPitch,
    characteristics: characteristics
  };
  
  fireworks.push(firework);
  
  // Record this firework event for musical analysis
  recordFireworkEvent(firework);
}

// Manual triggers
function manualFirework(x, y, pitchValue) {
  let characteristics = {
    dominantPitch: pitchValue || pitch,
    pitchRange: getPitchRange(pitchValue || pitch),
    intensity: smoothLevel
  };
  
  triggerFirework(x, y, characteristics);
}

// Update firework physics and lifecycle
function updateFireworks() {
  // Update existing fireworks
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let fw = fireworks[i];
    fw.age++;
    if (!fw.exploded) {
      // Move towards target
      fw.x = lerp(fw.x, fw.targetX, 0.1);
      fw.y = lerp(fw.y, fw.targetY, 0.1);
      // Add to trail
      fw.trail.push({x: fw.x, y: fw.y});
      if (fw.trail.length > 10) {
        fw.trail.shift();
      }
      // Check if reached target or time expired
      if (dist(fw.x, fw.y, fw.targetX, fw.targetY) < 20 || fw.age > 60) {
        explodeFirework(fw);
        fw.exploded = true;
      }
    }
    // Remove old fireworks
    if (fw.exploded && fw.age > 180) {
      fireworks.splice(i, 1);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // Gravity
    p.life--;
    p.alpha = map(p.life, 0, p.maxLife, 0, 255);
    // Remove dead particles
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Create explosion particles with enhanced characteristics
function explodeFirework(firework) {
  let characteristics = firework.characteristics || {
    intensity: smoothLevel,
    dominantPitch: firework.pitch,
    pitchRange: getPitchRange(firework.pitch)
  };
  
  let numParticles = Math.floor(map(characteristics.intensity, 0, 1, 30, 60));
  let colors = getEnhancedFireworkColors(characteristics);
  let energyScale = map(characteristics.intensity, 0, 1, 0.8, 2.0);
  let pitchSpeedMultiplier = 1.0;
  switch(characteristics.pitchRange) {
    case 'low': pitchSpeedMultiplier = 0.7; break;
    case 'midLow': pitchSpeedMultiplier = 0.9; break;
    case 'midHigh': pitchSpeedMultiplier = 1.1; break;
    case 'high': pitchSpeedMultiplier = 1.3; break;
  }
  
  let explosionScale = energyScale;
  let speedMultiplier = energyScale * pitchSpeedMultiplier;
  let sizeMultiplier = energyScale;
  
  for (let i = 0; i < numParticles; i++) {
    let angle = random(TWO_PI);
    
    // Base speed with intensity scaling
    let baseSpeed = random(1.5, 4);
    let speed = baseSpeed * speedMultiplier * explosionScale;
    
    // Explosion pattern based on pitch (higher pitch = more variation)
    if (characteristics.pitchRange === 'high') {
      speed *= 1.1; // Slightly faster for high pitches
      angle += random(-0.3, 0.3); // Moderate variation
    } else if (characteristics.pitchRange === 'low') {
      speed *= 0.9; // Slightly slower for low pitches
      angle += random(-0.15, 0.15); // Less variation
    }
    
    // Enhanced particle size with better minimum visibility
    let baseSize = random(2, 4);
    let particleSize = baseSize * sizeMultiplier * explosionScale;
    
    // Enhanced particle life based on intensity (ensure minimum visibility)
    let baseLife = random(40, 70);
    let particleLife = baseLife * map(characteristics.intensity, 0, 1, 1.0, 1.4);
    
    let particle = {
      x: firework.x,
      y: firework.y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: particleLife,
      maxLife: particleLife,
      alpha: 255,
      color: random(colors),
      size: particleSize,
      intensity: characteristics.intensity,
      pitchRange: characteristics.pitchRange
    };
    
    particles.push(particle);
  }
}

// Get colors based purely on pitch range
function getEnhancedFireworkColors(characteristics) {
  let colors = [];
  
  switch(characteristics.pitchRange) {
    case 'low':
      colors = [
        color(139, 69, 19),   // Brown
        color(255, 0, 0),     // Red
        color(255, 165, 0),   // Orange  
        color(255, 255, 0)    // Yellow
      ];
      break;
    case 'midLow':
      colors = [
        color(255, 165, 0),   // Orange
        color(255, 255, 0),   // Yellow
        color(255, 255, 255), // White
        color(144, 238, 144)  // Light green
      ];
      break;
    case 'midHigh':
      colors = [
        color(144, 238, 144), // Light green
        color(0, 255, 0),     // Green
        color(173, 216, 230), // Light blue
        color(0, 0, 255)      // Blue        
      ];
      break;
    case 'high':
      colors = [
        color(0, 255, 255),   // Cyan
        color(0, 0, 255),     // Blue
        color(128, 0, 128),   // Purple
        color(0, 0, 139)      // Dark blue
      ];
      break;
    default:
      colors = [color(255, 255, 255), color(200, 200, 200), color(150, 150, 150)];
  }
  
  return colors;
}

// Draw all fireworks and particles
function drawFireworks() {
  // Draw firework trails
  for (let fw of fireworks) {
    if (!fw.exploded && fw.trail.length > 1) {
      stroke(255, 200, 100, 150);
      strokeWeight(3);
      noFill();
      beginShape();
      for (let pos of fw.trail) {
        vertex(pos.x, pos.y);
      }
      endShape();
    }
    if (!fw.exploded) {
      fill(255, 255, 100);
      noStroke();
      circle(fw.x, fw.y, 6);
    }
  }
  
  // Draw particles with enhanced visual effects
  for (let p of particles) {
    fill(red(p.color), green(p.color), blue(p.color), p.alpha);
    noStroke();
    circle(p.x, p.y, p.size);
    // Add glow effect
    if (p.size > 4) {
      fill(red(p.color), green(p.color), blue(p.color), p.alpha * 0.3);
      circle(p.x, p.y, p.size * 1.8);
      if (p.size > 8) {
        fill(red(p.color), green(p.color), blue(p.color), p.alpha * 0.1);
        circle(p.x, p.y, p.size * 2.5);
      }
    }
    // More sparkles for high intensity particles
    let sparkleChance = p.intensity ? map(p.intensity, 0, 1, 0.05, 0.25) : 0.1;
    if (random() < sparkleChance) {
      stroke(255, 255, 255, p.alpha * 0.8);
      strokeWeight(map(p.size, 1, 15, 1, 3));
      
      let sparkleSize = p.size * 0.8;
      line(p.x - sparkleSize, p.y, p.x + sparkleSize, p.y);
      line(p.x, p.y - sparkleSize, p.x, p.y + sparkleSize);
      
      // Add diagonal sparkles for very large particles
      if (p.size > 6) {
        line(p.x - sparkleSize*0.7, p.y - sparkleSize*0.7, p.x + sparkleSize*0.7, p.y + sparkleSize*0.7);
        line(p.x - sparkleSize*0.7, p.y + sparkleSize*0.7, p.x + sparkleSize*0.7, p.y - sparkleSize*0.7);
      }
    }
  }
  
  // Reset graphics state to prevent interference with text rendering
  noStroke();
  fill(255);
}

// Handle user interaction for microphone permission
function mousePressed() {
  console.log('Mouse pressed - checking audio context state:', getAudioContext().state);
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume().then(() => {
      console.log('Audio context resumed successfully');
    }).catch(err => {
      console.error('Failed to resume audio context:', err);
    });
  }
  
  // Test if music system is working
  testMusicSystem();
}

function testMusicSystem() {
  console.log('Testing music system...');
  try {
    if (musicSystem.melodySynth) {
      console.log('Playing test note...');
      musicSystem.melodySynth.play(440, 0.2, 0, 0.5); // Play A4 for 0.5 seconds
      lastMusicPlayTime = millis(); // Track when music was played
    }
  } catch (error) {
    console.error('Music system test failed:', error);
  }
}

// Unified keyboard controls
function keyPressed() {
  // Arrow keys for sensitivity
  if (keyCode === UP_ARROW) {
    sensitivity += 0.5;
    sensitivity = constrain(sensitivity, 0.5, 10);
    console.log(`Sensitivity increased to ${sensitivity.toFixed(1)}x`);
  }
  if (keyCode === DOWN_ARROW) {
    sensitivity -= 0.5;
    sensitivity = constrain(sensitivity, 0.5, 10);
    console.log(`Sensitivity decreased to ${sensitivity.toFixed(1)}x`);
  }
  
  // Letter keys
  if (key === ' ') { // Spacebar
    testMusicSystem();
  } else if (key === 'f' || key === 'F') {
    manualFirework(random(width), random(height/2), pitch || random(200, 800));
    console.log('Manual firework triggered!');
  } else if (key === 'r' || key === 'R') {
    resetMusicPatterns();
    console.log('Music patterns reset');
  } else if (key === '1' || key === 'H') {
    showUI = !showUI;
    console.log(`UI display ${showUI ? 'shown' : 'hidden'}`);
  } else if (key === '2' || key === 'M') {
    musicSystem.enabled = !musicSystem.enabled;
    console.log('Music toggled:', musicSystem.enabled ? 'ON' : 'OFF');
  } else if (key === '3' || key === 'N') {
    micEnabled = !micEnabled;
    console.log('Microphone toggled:', micEnabled ? 'ON' : 'OFF');
  }else if (key === '4' || key === 'V') {
    showVisuals = !showVisuals;
    console.log('Visuals toggled:', showVisuals ? 'ON' : 'OFF');
  }
}

function initializeGenerativeMusic() {
  console.log('Initializing generative music system...');
  
  // Check if p5.PolySynth is available
  if (typeof p5.PolySynth === 'undefined') {
    console.error('p5.PolySynth is not available - check p5.sound.js is loaded');
    return;
  }
  
  try {
    // Initialize multiple synthesizers for different musical layers
    musicSystem.bassSynth = new p5.PolySynth();
    console.log('Bass synth created');
    
    musicSystem.melodySynth = new p5.PolySynth();
    console.log('Melody synth created');
    
    musicSystem.harmonySynth = new p5.PolySynth();
    console.log('Harmony synth created');
    
    musicSystem.percussionSynth = new p5.PolySynth();
    console.log('Percussion synth created');
    
    // Configure each synthesizer with safe polyphony limits
    musicSystem.bassSynth.setADSR(0.05, 0.4, 0.4, 2.0); // Punchy bass
    musicSystem.melodySynth.setADSR(0.1, 0.2, 0.6, 1.0); // Melodic lead
    musicSystem.harmonySynth.setADSR(0.2, 0.3, 0.7, 2.5); // Soft harmony pads
    musicSystem.percussionSynth.setADSR(0.01, 0.1, 0.0, 0.1); // Percussive hits
    
    console.log('ADSR envelopes configured');
    
    // Limit the number of voices to prevent conflicts
    try {
      if (musicSystem.harmonySynth.maxVoices !== undefined) {
        musicSystem.harmonySynth.maxVoices = 6; // Limit harmony voices
        musicSystem.bassSynth.maxVoices = 3;
        musicSystem.melodySynth.maxVoices = 4;
        musicSystem.percussionSynth.maxVoices = 2;
        console.log('Voice limits set');
      }
    } catch (e) {
      console.log('Voice limiting not available in this p5.sound version');
    }
    
    // Initialize musical patterns
    generateInitialPatterns();
    console.log('Musical patterns generated');
    
    console.log('Advanced generative music system initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize music system:', error);
  }
}

function generateInitialPatterns() {
  // Start with simple patterns that will evolve
  musicSystem.bassPattern = [0, 0, 4, 4]; // Root and fifth
  musicSystem.melodySequence = [0, 2, 4, 2]; // Simple ascending pattern
  musicSystem.harmonyProgression = [
    [0, 2, 4], // I chord
    [5, 7, 9], // vi chord
    [3, 5, 7], // IV chord
    [0, 2, 4]  // I chord
  ];
}

function updateGenerativeMusic() {
  if (!musicSystem.enabled) return;
  
  let currentTime = millis();
  
  // Update musical complexity and activity based on recent firework events
  updateMusicActivity();
  
  // Different layers have different update rates
  let beatInterval = (60000 / musicSystem.tempo) / 4; // 16th note intervals
  
  // Bass line (plays on downbeats) - always plays to provide foundation
  if (currentTime - musicSystem.lastBassTime > beatInterval * 4) {
    playBassNote();
    musicSystem.lastBassTime = currentTime;
  }
  
  // Melody (varies based on activity)
  let melodyInterval = beatInterval * (4 - musicSystem.activity * 3); // More active = faster melody
  if (currentTime - musicSystem.lastMelodyTime > melodyInterval) {
    if (musicSystem.activity > 0.1 || currentTime % 4000 < 50) { // Play melody when active OR periodically
      playMelodyNote();
    }
    musicSystem.lastMelodyTime = currentTime;
  }
  
  // Harmony (longer intervals, builds atmosphere)
  if (currentTime - musicSystem.lastHarmonyTime > beatInterval * 8) {
    if (musicSystem.activity > 0.05 || currentTime % 6000 < 50) { // Play harmony when active OR periodically
      playHarmonyChord();
    }
    musicSystem.lastHarmonyTime = currentTime;
  }
  
  // Percussion (responds to sharp transients)
  if (shouldTriggerPercussion()) {
    playPercussionHit();
    musicSystem.lastPercussionTime = currentTime;
  }
  
  // Evolve patterns periodically
  if (currentTime % 8000 < 50) { // Every 8 seconds
    evolveMusicalPatterns();
  }
}

function updateMusicActivity() {
  // Calculate activity based on recent firework events
  let recentEvents = musicMapping.fireworkEvents.filter(event => 
    millis() - event.timestamp < 5000 // Last 5 seconds
  );
  
  // Update activity level
  musicSystem.activity = map(recentEvents.length, 0, 10, 0, 1);
  musicSystem.activity = constrain(musicSystem.activity, 0, 1);
  
  // Gradually increase complexity over time
  let sessionTime = millis() / 1000; // seconds
  musicSystem.complexity = map(sessionTime, 0, 120, 0.1, 1.0); // Build over 2 minutes
  musicSystem.complexity = constrain(musicSystem.complexity, 0.1, 1.0);
  
  // Adjust tempo based on activity
  let targetTempo = map(musicSystem.activity, 0, 1, 80, 140);
  musicSystem.tempo = lerp(musicSystem.tempo, targetTempo, 0.02); // Smooth tempo changes
}

function playBassNote() {
  try {
    let scaleNote = musicSystem.bassPattern[musicSystem.bassPosition];
    let octave = 2; // Low octave for bass
    let note = getScaleNote(scaleNote, octave);
    
    let velocity = map(musicSystem.activity, 0, 1, 0.1, 0.4);
    let duration = 0.5;
    
    musicSystem.bassSynth.play(note, velocity, 0, duration);
    lastMusicPlayTime = millis(); // Track when music was played
    
    // Advance bass pattern position
    musicSystem.bassPosition = (musicSystem.bassPosition + 1) % musicSystem.bassPattern.length;
  } catch (e) {
    console.log('Bass note error:', e.message);
  }
}

function playMelodyNote() {
  try {
    let scaleNote = musicSystem.melodySequence[musicSystem.melodyPosition];
    let octave = 4 + Math.floor(musicSystem.complexity); // Higher as complexity increases
    let note = getScaleNote(scaleNote, octave);
    
    let velocity = map(musicSystem.activity, 0, 1, 0.05, 0.3);
    let duration = 0.3;
    
    musicSystem.melodySynth.play(note, velocity, 0, duration);
    lastMusicPlayTime = millis(); // Track when music was played
    
    // Advance melody position
    musicSystem.melodyPosition = (musicSystem.melodyPosition + 1) % musicSystem.melodySequence.length;
  } catch (e) {
    console.log('Melody note error:', e.message);
  }
}

function playHarmonyChord() {
  try {
    let chord = musicSystem.harmonyProgression[musicSystem.harmonyPosition];
    let octave = 3;
    
    let velocity = map(musicSystem.activity, 0, 1, 0.05, 0.2);
    let duration = 2.0; // Long, atmospheric chords
    
    // Play chord notes with slight delays to avoid conflicts
    for (let i = 0; i < chord.length; i++) {
      let scaleNote = chord[i];
      let note = getScaleNote(scaleNote, octave);
      
      setTimeout(() => {
        try {
          musicSystem.harmonySynth.play(note, velocity, 0, duration);
          lastMusicPlayTime = millis(); // Track when music was played
        } catch (e) {
          console.log('Harmony note play error (safe to ignore):', e.message);
        }
      }, i * 50); // 50ms delay between notes
    }
    
    // Advance harmony position
    musicSystem.harmonyPosition = (musicSystem.harmonyPosition + 1) % musicSystem.harmonyProgression.length;
  } catch (e) {
    console.log('Harmony chord error:', e.message);
  }
}

function shouldTriggerPercussion() {
  // Trigger percussion on sharp volume peaks
  let currentTime = millis();
  
  if (currentTime - musicSystem.lastPercussionTime < 200) return false; // Minimum interval
  
  return soundEventActive && smoothLevel > 0.3;
}

function playPercussionHit() {
  try {
    // Use high, sharp tones for percussion
    let frequencies = [800, 1200, 1600, 2000];
    let freq = random(frequencies);
    
    let velocity = map(smoothLevel, 0, 1, 0.1, 0.6);
    let duration = 0.05; // Very short hits
    
    musicSystem.percussionSynth.play(freq, velocity, 0, duration);
    lastMusicPlayTime = millis(); // Track when music was played
  } catch (e) {
    console.log('Percussion hit error:', e.message);
  }
}

function getScaleNote(scaleNote, octave) {
  let baseFreq = 261.63; // C4
  let scale = musicSystem.scales[musicSystem.mode];
  
  // Handle negative scale notes (wrap around)
  while (scaleNote < 0) {
    scaleNote += scale.length;
    octave--;
  }
  
  let scaleIndex = scaleNote % scale.length;
  let extraOctaves = Math.floor(scaleNote / scale.length);
  
  let semitones = scale[scaleIndex] + (extraOctaves * 12);
  let frequency = baseFreq * Math.pow(2, (octave - 4) + semitones / 12);
  
  return frequency;
}

function evolveMusicalPatterns() {
  if (musicSystem.complexity < 0.3) return; // Don't evolve too early
  
  // Evolve bass pattern
  if (random() < 0.3) {
    let newNote = Math.floor(random(7)); // Random scale degree
    let randomIndex = Math.floor(random(musicSystem.bassPattern.length));
    musicSystem.bassPattern[randomIndex] = newNote;
  }
  
  // Evolve melody
  if (random() < 0.4) {
    let newNote = Math.floor(random(-3, 10)); // Wider range for melody
    let randomIndex = Math.floor(random(musicSystem.melodySequence.length));
    musicSystem.melodySequence[randomIndex] = newNote;
  }
  
  // Expand patterns if complexity is high
  if (musicSystem.complexity > 0.7 && random() < 0.2) {
    if (musicSystem.bassPattern.length < 8) {
      musicSystem.bassPattern.push(Math.floor(random(7)));
    }
    if (musicSystem.melodySequence.length < 12) {
      musicSystem.melodySequence.push(Math.floor(random(-3, 10)));
    }
  }
}

function recordFireworkEvent(firework) {
  let event = {
    timestamp: millis(),
    pitch: firework.pitch,
    intensity: firework.characteristics.intensity,
    pitchRange: firework.characteristics.pitchRange,
    x: firework.x,
    y: firework.y
  };
  
  musicMapping.fireworkEvents.push(event);
  musicMapping.eventHistory.push(event);
  
  // Keep memory manageable
  if (musicMapping.fireworkEvents.length > 20) {
    musicMapping.fireworkEvents.shift();
  }
  if (musicMapping.eventHistory.length > musicMapping.maxEventHistory) {
    musicMapping.eventHistory.shift();
  }
  
  // Update musical parameters based on this event
  respondToFireworkEvent(event);
}

function respondToFireworkEvent(event) {
  // Immediate musical response to firework
  if (!musicSystem.enabled) return;
  
  // Trigger a special melodic phrase based on pitch range
  setTimeout(() => {
    playFireworkMelody(event);
  }, 100); // Small delay to sync with firework explosion
  
  // Adjust key/mode based on pitch characteristics
  if (event.pitchRange === 'high' && random() < 0.3) {
    if (musicSystem.mode === 'major') {
      musicSystem.mode = 'mixolydian'; // Brighter
    }
  } else if (event.pitchRange === 'low' && random() < 0.3) {
    if (musicSystem.mode === 'major') {
      musicSystem.mode = 'minor'; // Darker
    }
  }
}

function playFireworkMelody(event) {
  // Special melodic phrase triggered by firework
  let pitchMap = {
    'low': [0, 1, 2],
    'midLow': [2, 3, 4],
    'midHigh': [4, 5, 6],
    'high': [5, 6, 7, 8]
  };
  
  let notes = pitchMap[event.pitchRange] || [0, 2, 4];
  let octave = 4;
  
  // Play a quick ascending phrase
  for (let i = 0; i < notes.length; i++) {
    setTimeout(() => {
      let note = getScaleNote(notes[i], octave);
      let velocity = map(event.intensity, 0, 1, 0.1, 0.4);
      musicSystem.melodySynth.play(note, velocity, 0, 0.2);
    }, i * 150); // Staggered timing
  }
}

// Control functions
function resetMusicPatterns() {
  generateInitialPatterns();
  musicSystem.complexity = 0.1;
  musicMapping.fireworkEvents = [];
  musicMapping.eventHistory = [];
}
