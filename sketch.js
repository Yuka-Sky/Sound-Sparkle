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
let spectralHistory = []; // History of spectrum data
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

function setup() {
  createCanvas(1400, 800);
  
  // Initialize microphone with enhanced settings
  mic = new p5.AudioIn();
  mic.start();
  
  // Initialize FFT for frequency analysis
  fft = new p5.FFT(0.8, frequencyBins);
  fft.setInput(mic);
  
  // Initialize ML5 pitch detection
  initializePitchDetection();
  

  
  // Display initialization info
  console.log('🎆 Sound Sparkle - Enhanced Audio Analysis & Fireworks initialized');
  console.log('🎵 Using FFT-based pitch detection with harmonic analysis');
  console.log('Controls:');
  console.log('- UP/DOWN arrows: Increase/decrease sensitivity');
  console.log('- F key: Manual firework trigger');
  console.log('- H key: Hide/show UI text displays');
  console.log('🎇 Make loud sounds (claps, shouts) to trigger fireworks!');
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
  
  // Get raw microphone level (0 to 1)
  let rawLevel = mic.getLevel();
  
  // Apply sensitivity amplification
  micLevel = rawLevel * sensitivity;
  

  
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
  
  // Smooth the level for more fluid animation
  smoothLevel = lerp(smoothLevel, micLevel, 0.15);
  
  // FFT Analysis
  spectrum = fft.analyze();
  
  // Store spectral data in history buffer
  updateSpectralHistory();
  
  // Always estimate pitch from FFT (ML5 is backup/comparison)
  estimatePitchFromFFT();
  
  // Store sound characteristics in buffer
  updateSoundBuffer();
  
  // Detect amplitude peaks for firework triggering (enhanced with temporal analysis)
  detectAmplitudePeaksWithTemporal();
  
  // Update and draw fireworks
  updateFireworks();
  drawFireworks();
  
  // Display the visual meter
  drawCircleMeter();
  
  // Draw frequency spectrum
  drawSpectrum();
  
  // Display level values and instructions
  displayInfo();
}

function drawBarMeter() {
  // Bar meter parameters
  let barWidth = 400;
  let barHeight = 50;
  let barX = (width - barWidth) / 2;
  let barY = height / 2;
  
  // Background bar
  fill(50);
  rect(barX, barY, barWidth, barHeight);
  
  // Active level bar
  let levelWidth = map(smoothLevel, 0, 1, 0, barWidth);
  
  // Color based on level intensity
  if (smoothLevel > 0.8) {
    fill(255, 50, 50); // Red for very high levels
  } else if (smoothLevel > 0.6) {
    fill(255, 100, 50); // Orange-red for high levels
  } else if (smoothLevel > 0.4) {
    fill(255, 200, 50); // Orange for medium-high levels
  } else if (smoothLevel > 0.2) {
    fill(100, 255, 100); // Light green for medium levels
  } else {
    fill(50, 200, 100); // Dark green for low levels
  }
  
  rect(barX, barY, levelWidth, barHeight);
  
  // Peak hold indicator
  if (peakHold > 0.1) {
    let peakX = barX + map(peakHold, 0, 1, 0, barWidth);
    stroke(255, 255, 0);
    strokeWeight(3);
    line(peakX, barY, peakX, barY + barHeight);
    noStroke();
  }
  
  // Border
  noFill();
  stroke(255);
  strokeWeight(2);
  rect(barX, barY, barWidth, barHeight);
  
  // Level markers
  stroke(100);
  strokeWeight(1);
  for (let i = 1; i <= 4; i++) {
    let markerX = barX + (barWidth / 5) * i;
    line(markerX, barY, markerX, barY + barHeight);
  }
}

function drawCircleMeter() {
  // Circle meter parameters
  let centerX = width / 2;
  let centerY = height / 2;
  let maxRadius = 150;
  
  // Background circle - more translucent
  noFill();
  stroke(50, 50, 50, 80); // Added alpha for translucency
  strokeWeight(20);
  circle(centerX, centerY, maxRadius * 2);
  
  // Active level arc
  let arcRadius = map(smoothLevel, 0, 1, 0, maxRadius);
  
  // Color based on level intensity - more translucent
  if (smoothLevel > 0.7) {
    stroke(255, 50, 50, 120); // Red for high levels
  } else if (smoothLevel > 0.4) {
    stroke(255, 200, 50, 120); // Orange for medium levels
  } else {
    stroke(50, 255, 100, 120); // Green for low levels
  }
  
  strokeWeight(20);
  circle(centerX, centerY, arcRadius * 2);
  
  // Inner glow effect - more subtle
  if (smoothLevel > 0.1) {
    stroke(255, 255, 255, 60);
    strokeWeight(5);
    circle(centerX, centerY, arcRadius * 2);
  }
  
  // Center dot - more translucent
  fill(255, 255, 255, 150);
  noStroke();
  circle(centerX, centerY, 10);
}

function displayInfo() {
  // Only show UI text displays if showUI is true
  if (showUI) {
    // Display current levels and settings
    fill(255);
    textAlign(LEFT);
    textSize(12);
    
    // Left side - Audio Analysis
    text('AUDIO ANALYSIS', 20, 20);
    text(`Raw Level: ${(mic.getLevel() * sensitivity).toFixed(3)}`, 20, 40);
    text(`Processed Level: ${smoothLevel.toFixed(3)}`, 20, 55);
    text(`Peak Hold: ${peakHold.toFixed(3)}`, 20, 70);
    text(`Pitch: ${pitch.toFixed(1)} Hz`, 20, 85);
    text(`Sensitivity: ${sensitivity.toFixed(1)}x`, 20, 100);
    
    // Firework Statistics
    text('FIREWORK SYSTEM', 20, 135);
    text(`Active Fireworks: ${fireworks.length}`, 20, 155);
    text(`Active Particles: ${particles.length}`, 20, 170);
    text(`Sound Event: ${soundEventActive ? 'ANALYZING' : 'LISTENING'}`, 20, 185);
    text(`Buffer Size: ${soundBuffer.length}/${bufferSize}`, 20, 200);
    text(`Spectral Centroid: ${spectralHistory.length > 0 ? calculateSpectralCentroid(soundBuffer).toFixed(0) : '0'} Hz`, 20, 215);
    
    // Right side controls
    textAlign(RIGHT);
    textSize(12);
    text('CONTROLS', width - 20, 20);
    text('↑/↓: Sensitivity ±0.5', width - 20, 40);
    text('F: Manual firework', width - 20, 55);
    text('H: Toggle UI display', width - 20, 70);
  }
  
  // Center notifications
  textAlign(CENTER);
  

  
  // Pitch detection status
  if (pitch > 0) {
    fill(100, 255, 200);
    textSize(14);
    text(`Detected Pitch: ${pitch.toFixed(1)} Hz`, width / 2, height - 60);
  }

  // Instructions
  fill(150);
  textSize(12);
  text('Try clapping, shouting, or making sudden loud sounds!', width / 2, height - 40);
}

function keyPressed() {
  
  // Sensitivity controls
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
  

  
  // Manual firework trigger
  if (key === 'f' || key === 'F') {
    triggerFirework(random(width), random(height/2), pitch || random(200, 800));
    console.log('Manual firework triggered!');
  }
  
  // Toggle UI visibility
  if (key === 'h' || key === 'H') {
    showUI = !showUI;
    console.log(`UI display ${showUI ? 'shown' : 'hidden'}`);
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
    
    // Start analyzing this sound event
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
      
      triggerFireworkWithCharacteristics(x, y, soundCharacteristics);
      
      // Reset for next sound event
      soundEventActive = false;
      lastFireworkTime = millis();
      
      console.log(`Firework triggered! Characteristics:`, soundCharacteristics);
    }
  }
  
  previousLevel = micLevel;
}

// Update spectral history buffer
function updateSpectralHistory() {
  // Add current spectrum to history
  spectralHistory.push([...spectrum]);
  
  // Keep only recent history
  if (spectralHistory.length > bufferSize) {
    spectralHistory.shift();
  }
}

// Update sound characteristics buffer
function updateSoundBuffer() {
  let soundFrame = {
    level: micLevel,
    pitch: pitch,
    timestamp: millis(),
    spectrum: [...spectrum]
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

// Analyze the complete sound event to determine firework characteristics
function analyzeSoundEvent() {
  if (soundBuffer.length === 0) {
    return {
      dominantPitch: pitch,
      pitchRange: 'mid',
      intensity: smoothLevel,
      spectralCentroid: 500,
      soundType: 'unknown'
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
  
  // Calculate spectral centroid (brightness of sound)
  let spectralCentroid = calculateSpectralCentroid(recentFrames);
  
  // Determine sound characteristics
  let dominantPitch = maxPitch > 0 ? maxPitch : avgPitch > 0 ? avgPitch : pitch;
  let intensity = Math.max(...recentFrames.map(f => f.level));
  
  // Classify sound type based on spectral evolution
  let soundType = classifySoundType(recentFrames, maxPitch, avgPitch, spectralCentroid);
  
  return {
    dominantPitch: dominantPitch,
    pitchRange: getPitchRange(dominantPitch),
    intensity: intensity,
    spectralCentroid: spectralCentroid,
    soundType: soundType,
    maxPitch: maxPitch,
    avgPitch: avgPitch
  };
}

// Calculate spectral centroid (measure of spectral brightness)
function calculateSpectralCentroid(frames) {
  if (frames.length === 0) return 500;
  
  let totalWeightedFreq = 0;
  let totalMagnitude = 0;
  let nyquist = 22050;
  
  // Use the most recent frame's spectrum
  let currentSpectrum = frames[frames.length - 1].spectrum;
  
  for (let i = 0; i < currentSpectrum.length; i++) {
    let frequency = (i * nyquist) / currentSpectrum.length;
    let magnitude = currentSpectrum[i];
    
    totalWeightedFreq += frequency * magnitude;
    totalMagnitude += magnitude;
  }
  
  return totalMagnitude > 0 ? totalWeightedFreq / totalMagnitude : 500;
}

// Classify the type of sound based on its characteristics
function classifySoundType(frames, maxPitch, avgPitch, spectralCentroid) {
  if (frames.length === 0) return 'unknown';
  
  let intensityRange = Math.max(...frames.map(f => f.level)) - Math.min(...frames.map(f => f.level));
  let pitchVariation = maxPitch - avgPitch;
  
  // Finger snap: high spectral centroid, large pitch variation, sharp intensity
  if (spectralCentroid > 1500 && pitchVariation > 200 && intensityRange > 0.3) {
    return 'snap';
  }
  // Clap: broad spectrum, sharp attack
  else if (spectralCentroid > 1000 && intensityRange > 0.4) {
    return 'clap';
  }
  // Whistle: stable high pitch, low intensity variation
  else if (maxPitch > 800 && pitchVariation < 100 && intensityRange < 0.2) {
    return 'whistle';
  }
  // Voice: moderate pitch range, sustained
  else if (maxPitch > 100 && maxPitch < 800 && frames.length > 5) {
    return 'voice';
  }
  
  return 'percussion';
}

// Get pitch range category
function getPitchRange(pitch) {
  if (pitch < 100) return 'low';
  else if (pitch < 300) return 'mid-low';
  else if (pitch < 500) return 'mid-high';
  else return 'high';
}

// Enhanced FFT-based pitch estimation
function estimatePitchFromFFT() {
  if (spectrum.length === 0) return pitch; // Return previous pitch if no data
  
  // Enhanced pitch detection with multiple methods
  let detectedPitch = 0;
  
  // Method 1: Peak frequency detection
  let peakFreq = findPeakFrequency();
  
  // Method 2: Harmonic analysis (more accurate for musical tones)
  let harmonicFreq = findFundamentalFrequency();
  
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
  
  // Focus on frequencies between 80Hz and 2000Hz (typical for human voice/claps)
  let nyquist = 22050; // Half of sample rate
  let binSize = nyquist / spectrum.length;
  let startBin = Math.floor(80 / binSize);
  let endBin = Math.floor(2000 / binSize);
  
  // Find peak with minimum amplitude threshold
  let threshold = 50; // Minimum amplitude to consider
  
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
    let bin = Math.floor(f / binSize);
    
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

// Trigger a new firework with enhanced characteristics
function triggerFireworkWithCharacteristics(x, y, characteristics) {
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

// Legacy function for manual triggers
function triggerFirework(x, y, pitchValue) {
  let characteristics = {
    dominantPitch: pitchValue || pitch,
    pitchRange: getPitchRange(pitchValue || pitch),
    intensity: smoothLevel,
    spectralCentroid: 500,
    soundType: 'manual'
  };
  
  triggerFireworkWithCharacteristics(x, y, characteristics);
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
    soundType: 'unknown',
    dominantPitch: firework.pitch
  };
  
  // Enhanced particle count with better minimum visibility
  let baseParticles = map(characteristics.intensity, 0, 1, 12, 50); // Better minimum for small sounds
  
  // Modify based on sound type
  let numParticles = baseParticles;
  if (characteristics.soundType === 'snap') {
    numParticles *= 1.5; // Snaps get more particles
  } else if (characteristics.soundType === 'whistle') {
    numParticles *= 0.7; // Whistles get fewer, more elegant particles
  }
  
  numParticles = Math.floor(numParticles);
  
  let colors = getEnhancedFireworkColors(characteristics);
  
  // Enhanced explosion size scaling
  let explosionScale = map(characteristics.intensity, 0, 1, 0.7, 1.8); // Better minimum scale for visibility
  let speedMultiplier = map(characteristics.intensity, 0, 1, 0.6, 1.6); // Better minimum speed
  let sizeMultiplier = map(characteristics.intensity, 0, 1, 0.8, 2.0); // Better minimum particle size
  
  for (let i = 0; i < numParticles; i++) {
    let angle = random(TWO_PI);
    
    // Base speed with intensity scaling
    let baseSpeed = random(1, 6);
    let speed = baseSpeed * speedMultiplier * explosionScale;
    
    // Different explosion patterns based on sound type
    if (characteristics.soundType === 'snap') {
      // Sharp, fast explosion for snaps
      speed *= 1.2;
      angle += random(-0.3, 0.3); // Moderate angle variation
    } else if (characteristics.soundType === 'whistle') {
      // Gentle, flowing explosion for whistles
      speed *= 0.7;
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
      soundType: characteristics.soundType,
      intensity: characteristics.intensity // Store for visual effects
    };
    
    particles.push(particle);
  }
}

// Get enhanced colors based on sound characteristics
function getEnhancedFireworkColors(characteristics) {
  let baseColors = getFireworkColors(characteristics.dominantPitch);
  
  // Modify colors based on sound type and spectral characteristics
  if (characteristics.soundType === 'snap') {
    // Finger snaps: bright, sharp colors with white highlights
    return [
      color(255, 255, 255), // White
      color(255, 200, 100), // Bright yellow-orange
      color(100, 200, 255), // Bright blue
      color(255, 100, 200), // Bright pink
      ...baseColors
    ];
  } else if (characteristics.soundType === 'clap') {
    // Claps: warm, energetic colors
    return [
      color(255, 100, 50),  // Orange-red
      color(255, 200, 0),   // Golden yellow
      color(255, 150, 100), // Warm orange
      ...baseColors
    ];
  } else if (characteristics.soundType === 'whistle') {
    // Whistles: ethereal, flowing colors
    return [
      color(150, 200, 255), // Light blue
      color(200, 150, 255), // Light purple
      color(255, 200, 200), // Light pink
      color(200, 255, 200)  // Light green
    ];
  } else if (characteristics.soundType === 'voice') {
    // Voice: rich, varied colors based on pitch
    return [
      ...baseColors,
      color(255, 180, 120), // Skin tone
      color(120, 180, 255)  // Voice blue
    ];
  }
  
  // Default enhanced colors for percussion/unknown
  return [
    ...baseColors,
    color(255, 255, 200), // Light yellow highlight
    color(200, 200, 255)  // Light blue highlight
  ];
}

// Legacy color function for backward compatibility
function getFireworkColors(pitchValue) {
  if (pitchValue === 0 || pitchValue < 80) {
    // Default colors for no pitch detected
    return [
      color(255, 100, 100), // Red
      color(100, 255, 100), // Green  
      color(100, 100, 255), // Blue
      color(255, 255, 100), // Yellow
      color(255, 100, 255)  // Magenta
    ];
  }
  
  // Enhanced pitch to color mapping
  if (pitchValue < 100) {
    // Low pitch - warm, deep colors
    return [color(255, 50, 0), color(255, 100, 0), color(200, 50, 50)];
  } else if (pitchValue < 300) {
    // Mid-low pitch - yellow/orange
    return [color(255, 200, 0), color(255, 150, 50), color(255, 100, 100)];
  } else if (pitchValue < 500) {
    // Mid-high pitch - green/blue transition
    return [color(0, 255, 100), color(100, 255, 200), color(0, 200, 255)];
  } else {
    // High pitch - cool, bright colors
    return [color(100, 150, 255), color(150, 100, 255), color(255, 100, 200)];
  }
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
    
    // Draw firework rocket
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
    
    // Main particle
    circle(p.x, p.y, p.size);
    
    // Add glow effect for larger particles (high intensity sounds)
    if (p.size > 4) {
      fill(red(p.color), green(p.color), blue(p.color), p.alpha * 0.3);
      circle(p.x, p.y, p.size * 1.8);
      
      // Extra outer glow for very large particles
      if (p.size > 8) {
        fill(red(p.color), green(p.color), blue(p.color), p.alpha * 0.1);
        circle(p.x, p.y, p.size * 2.5);
      }
    }
    
    // Enhanced sparkle effect - more frequent for high intensity particles
    let sparkleChance = p.intensity ? map(p.intensity, 0, 1, 0.05, 0.25) : 0.1;
    if (random() < sparkleChance) {
      stroke(255, 255, 255, p.alpha * 0.8);
      strokeWeight(map(p.size, 1, 15, 1, 3)); // Thicker sparkles for larger particles
      
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

// Draw frequency spectrum
function drawSpectrum() {
  if (spectrum.length > 0) {
    strokeWeight(1);
    noFill();
    
    // Draw spectrum bars
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

// Handle user interaction for microphone permission
function mousePressed() {
  // Ensure audio context is started (required by some browsers)
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}
