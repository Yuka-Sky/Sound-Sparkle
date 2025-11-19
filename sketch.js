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

// FFT and pitch detection variables
let fft;
let pitchDetection;
let pitch = 0;
let confidence = 0;
let spectrum = [];
let frequencyBins = 64; // Number of frequency bins to analyze

// Enhanced temporal analysis for complex sounds
let soundBuffer = []; // Buffer to store recent sound characteristics
let bufferSize = 15; // Frames to analyze (250ms at 60fps)
let pitchHistory = []; // History of pitch values

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
let showUI = false; // Toggle for hiding/showing text displays

// Simple Generative Music System
let polySynth;
let musicEnabled = true;
let lastMusicTime = 0;
let musicInterval = 1000; // Base interval between notes

// Music scales mapped to pitch ranges
let musicScales = {
  low: [60, 62, 64, 67, 69], // C major pentatonic (low pitches)
  midLow: [62, 64, 66, 69, 71], // D dorian pentatonic
  midHigh: [64, 67, 69, 72, 74], // E minor pentatonic
  high: [67, 69, 71, 74, 76] // G major pentatonic (high pitches)
};

let currentScale = musicScales.low;
let baseTempo = 120; // Base BPM
let musicFrequencyThreshold = 90; // Hz - minimum frequency to trigger music
let musicEnergyThreshold = 0.12; // Minimum energy above threshold frequency (0.1-0.5 range)

// Initialize microphone, FFT, ML5 pitch detection, and music system
function setup() {
  createCanvas(1400, 800);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.8, frequencyBins);
  fft.setInput(mic);
  initializePitchDetection();
  initializeMusic();
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
        confidence = 1; // ML5 doesn't provide confidence directly
      } else {
        pitch = 0;
        confidence = 0;
      }
      getPitch(); // Continue getting pitch
    });
  }
}

function draw() {
  background(20, 25, 40); // Dark blue background
  let rawLevel = mic.getLevel();
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
  updateReactiveMusic();
  
  updateFireworks();
  drawFireworks();
  drawCircleMeter();
  drawSpectrum();
  
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
    
    text('REACTIVE MUSIC', 20, 240);
    text(`Music: ${musicEnabled ? 'ON' : 'OFF'}`, 20, 255);
    text(`Current Scale: ${getCurrentScaleName()}`, 20, 270);
    text(`Freq Threshold: ${musicFrequencyThreshold} Hz`, 20, 285);
    text(`Energy Threshold: ${musicEnergyThreshold.toFixed(3)}`, 20, 300);
    
    textAlign(RIGHT);
    textSize(12);
    text('CONTROLS', width - 20, 20);
    text('↑/↓: Sensitivity ±0.5', width - 20, 40);
    text('F: Manual firework', width - 20, 55);
    text('H: Toggle UI display', width - 20, 70);
    text('M: Toggle music', width - 20, 85);
    text('[ / ]: Music freq threshold', width - 20, 100);
    text('- / +: Music energy threshold', width - 20, 115);
  }
  
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

function keyPressed() {
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
  if (key === 'f' || key === 'F') {
    manualFirework(random(width), random(height/2), pitch || random(200, 800));
    console.log('Manual firework triggered!');
  }
  if (key === 'h' || key === 'H') {
    showUI = !showUI;
    console.log(`UI display ${showUI ? 'shown' : 'hidden'}`);
  }
  if (key === 'm' || key === 'M') {
    musicEnabled = !musicEnabled;
    console.log(`Reactive music ${musicEnabled ? 'enabled' : 'disabled'}`);
  }
  if (key === '[') {
    musicFrequencyThreshold = Math.max(20, musicFrequencyThreshold - 10);
    console.log(`Music frequency threshold: ${musicFrequencyThreshold} Hz`);
  }
  if (key === ']') {
    musicFrequencyThreshold = Math.min(200, musicFrequencyThreshold + 10);
    console.log(`Music frequency threshold: ${musicFrequencyThreshold} Hz`);
  }
  if (key === '-' || key === '_') {
    musicEnergyThreshold = Math.max(0.01, musicEnergyThreshold - 0.02);
    console.log(`Music energy threshold: ${musicEnergyThreshold.toFixed(3)}`);
  }
  if (key === '=' || key === '+') {
    musicEnergyThreshold = Math.min(0.5, musicEnergyThreshold + 0.02);
    console.log(`Music energy threshold: ${musicEnergyThreshold.toFixed(3)}`);
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
  
  // Update pitch history
  pitchHistory.push(pitch);
  if (pitchHistory.length > bufferSize) {
    pitchHistory.shift();
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
}

// Handle user interaction for microphone permission
function mousePressed() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}

// ============= SIMPLE REACTIVE MUSIC SYSTEM =============
// Maps user sound inputs to musical parameters

function initializeMusic() {
  // Create PolySynth with subtle settings
  polySynth = new p5.PolySynth();
  polySynth.setADSR(0.1, 0.3, 0.3, 1.5); // Gentle attack, moderate decay/sustain, long release
  console.log('Reactive music system initialized');
}

function updateReactiveMusic() {
  if (!musicEnabled || !mic) return;
  
  let currentTime = millis();
  
  // Check if enough time has passed for next note
  if (currentTime - lastMusicTime > musicInterval) {
    // Update musical parameters based on audio input
    updateMusicParameters();
    
    // Trigger a note based on current audio state
    if (shouldTriggerNote()) {
      playReactiveNote();
      lastMusicTime = currentTime;
    }
  }
}

function updateMusicParameters() {
  // Map detected pitch to scale choice
  if (pitchHistory.length > 0) {
    let avgPitch = pitchHistory.reduce((sum, p) => sum + p.frequency, 0) / pitchHistory.length;
    
    if (avgPitch < 150) {
      currentScale = musicScales.low;
    } else if (avgPitch < 300) {
      currentScale = musicScales.midLow;
    } else if (avgPitch < 600) {
      currentScale = musicScales.midHigh;
    } else {
      currentScale = musicScales.high;
    }
  }
  
  // Map amplitude to tempo changes
  let currentAmplitude = smoothLevel;
  if (soundBuffer.length > 0) {
    let avgAmplitude = soundBuffer.reduce((sum, val) => sum + val, 0) / soundBuffer.length;
    
    // Event frequency affects tempo (more events = faster music)
    let eventDensity = soundBuffer.filter(val => val > 0.1).length / soundBuffer.length;
    let tempoMultiplier = map(eventDensity, 0, 1, 0.5, 2.0); // Slower to faster
    
    // Calculate interval (lower = faster)
    musicInterval = (60000 / baseTempo) * tempoMultiplier;
    musicInterval = constrain(musicInterval, 1000, 3000); // Conservative bounds to prevent spam
  }
}

function shouldTriggerNote() {
  // Simple approach: Only trigger music when there's an actual sound event
  // Use the same logic that triggers fireworks since that's working perfectly
  
  // Only trigger if we're currently in a sound event (same as fireworks)
  if (!soundEventActive) {
    return false;
  }
  
  // Additional check: make sure it's not just low-frequency noise
  if (smoothLevel < 0.1) {
    return false;
  }
  
  // Debug occasionally (every 2 seconds)
  if (millis() % 2000 < 20) {
    console.log(`Music - SoundEvent: ${soundEventActive}, Smooth: ${smoothLevel.toFixed(3)}, Trigger: ${soundEventActive && smoothLevel >= 0.1}`);
  }
  
  return true; // If we get here, trigger the note
}

function playReactiveNote() {
  // Choose a random note from current scale
  let noteIndex = floor(random(currentScale.length));
  let midiNote = currentScale[noteIndex];
  
  // Map amplitude to velocity (volume)
  let currentAmplitude = smoothLevel;
  let velocity = map(currentAmplitude, 0, 1, 0.1, 0.5); // Keep it subtle
  
  // Convert MIDI to frequency and play
  let frequency = midiToFreq(midiNote);
  polySynth.play(frequency, velocity, 0, 0.3); // Short notes for subtlety
}

function getCurrentScaleName() {
  if (currentScale === musicScales.low) return 'Low (C Major)';
  if (currentScale === musicScales.midLow) return 'Mid-Low (D Dorian)';
  if (currentScale === musicScales.midHigh) return 'Mid-High (E Minor)';
  if (currentScale === musicScales.high) return 'High (G Major)';
  return 'Unknown';
}
