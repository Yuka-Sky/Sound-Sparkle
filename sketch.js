// Variables for microphone and audio processing
let mic;
let micLevel = 0;
let smoothLevel = 0;
let meterType = 'circle'; // 'bar' or 'circle'

// Enhanced sensitivity and calibration variables
let sensitivity = 3.0; // Amplification factor
let maxRecordedLevel = 0; // Track the maximum level seen
let autoCalibrate = true; // Auto-adjust sensitivity
let calibrationTime = 0; // Timer for calibration period
let dynamicRange = 0.5; // Dynamic range adjustment
let peakHold = 0; // Peak hold value
let peakDecay = 0.95; // How fast peaks decay

function setup() {
  createCanvas(800, 600);
  
  // Initialize microphone with enhanced settings
  mic = new p5.AudioIn();
  mic.start();
  
  // Set initial calibration period
  calibrationTime = millis();
  
  // Optional: Display instructions
  console.log('Sound Sparkle - Enhanced Microphone initialized');
  console.log('Controls:');
  console.log('- SPACEBAR: Toggle between bar and circle meter');
  console.log('- UP/DOWN arrows: Increase/decrease sensitivity');
  console.log('- R key: Reset calibration');
  console.log('- A key: Toggle auto-calibration');
  console.log('Make some noise to see the enhanced visual meter respond!');
}

function draw() {
  background(20, 25, 40); // Dark blue background
  
  // Get raw microphone level (0 to 1)
  let rawLevel = mic.getLevel();
  
  // Apply sensitivity amplification
  micLevel = rawLevel * sensitivity;
  
  // Auto-calibration: adjust sensitivity based on input range
  if (autoCalibrate) {
    updateCalibration(rawLevel);
  }
  
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
  
  // Display the visual meter
  if (meterType === 'bar') {
    drawBarMeter();
  } else {
    drawCircleMeter();
  }
  
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
  
  // Background circle
  noFill();
  stroke(50);
  strokeWeight(20);
  circle(centerX, centerY, maxRadius * 2);
  
  // Active level arc
  let arcRadius = map(smoothLevel, 0, 1, 0, maxRadius);
  
  // Color based on level intensity
  if (smoothLevel > 0.7) {
    stroke(255, 50, 50); // Red for high levels
  } else if (smoothLevel > 0.4) {
    stroke(255, 200, 50); // Orange for medium levels
  } else {
    stroke(50, 255, 100); // Green for low levels
  }
  
  strokeWeight(20);
  circle(centerX, centerY, arcRadius * 2);
  
  // Inner glow effect
  if (smoothLevel > 0.1) {
    stroke(255, 255, 255, 100);
    strokeWeight(5);
    circle(centerX, centerY, arcRadius * 2);
  }
  
  // Center dot
  fill(255);
  noStroke();
  circle(centerX, centerY, 10);
}

function displayInfo() {
  // Display current levels and settings
  fill(255);
  textAlign(LEFT);
  textSize(14);
  
  // Left side info
  text(`Raw Level: ${(mic.getLevel() * sensitivity).toFixed(3)}`, 20, 30);
  text(`Processed Level: ${smoothLevel.toFixed(3)}`, 20, 50);
  text(`Peak Hold: ${peakHold.toFixed(3)}`, 20, 70);
  text(`Sensitivity: ${sensitivity.toFixed(1)}x`, 20, 90);
  text(`Max Recorded: ${maxRecordedLevel.toFixed(3)}`, 20, 110);
  text(`Auto-Calibration: ${autoCalibrate ? 'ON' : 'OFF'}`, 20, 130);
  text(`Meter Type: ${meterType}`, 20, 150);
  
  // Right side controls
  textAlign(RIGHT);
  text('Controls:', width - 20, 30);
  text('SPACEBAR: Toggle meter type', width - 20, 50);
  text('↑/↓: Sensitivity ±0.5', width - 20, 70);
  text('R: Reset calibration', width - 20, 90);
  text('A: Toggle auto-calibration', width - 20, 110);
  
  // Center notifications
  textAlign(CENTER);
  
  // Peak indicator
  if (smoothLevel > 0.8) {
    fill(255, 50, 50);
    textSize(24);
    text('🔥 PEAK! 🔥', width / 2, 120);
  }
  
  // Calibration status
  if (autoCalibrate && (millis() - calibrationTime) < 5000) {
    fill(255, 255, 0);
    textSize(16);
    text('Calibrating... Make some noise!', width / 2, height - 60);
  }
  
  // Low signal warning
  if (maxRecordedLevel < 0.1 && (millis() - calibrationTime) > 3000) {
    fill(255, 100, 100);
    textSize(16);
    text('Low signal detected - try increasing sensitivity (↑)', width / 2, height - 40);
  }
}

function keyPressed() {
  // Toggle between bar and circle meter
  if (key === ' ') { // Spacebar
    meterType = (meterType === 'bar') ? 'circle' : 'bar';
    console.log(`Switched to ${meterType} meter`);
  }
  
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
  
  // Reset calibration
  if (key === 'r' || key === 'R') {
    resetCalibration();
    console.log('Calibration reset');
  }
  
  // Toggle auto-calibration
  if (key === 'a' || key === 'A') {
    autoCalibrate = !autoCalibrate;
    console.log(`Auto-calibration ${autoCalibrate ? 'enabled' : 'disabled'}`);
    if (autoCalibrate) {
      calibrationTime = millis();
    }
  }
}

// Auto-calibration function
function updateCalibration(rawLevel) {
  // During the first 5 seconds, automatically adjust sensitivity
  if (millis() - calibrationTime < 5000) {
    // If we're getting very quiet signals, increase sensitivity
    if (maxRecordedLevel < 0.2 && rawLevel > 0.01) {
      sensitivity = min(sensitivity * 1.02, 8.0);
    }
    // If we're getting very loud signals, decrease sensitivity
    else if (rawLevel * sensitivity > 0.9) {
      sensitivity = max(sensitivity * 0.98, 1.0);
    }
  }
  
  // Continuous auto-adjustment (more gentle)
  else {
    // Gradually adjust dynamic range based on recent activity
    if (rawLevel * sensitivity > 0.8) {
      dynamicRange = min(dynamicRange * 1.01, 1.0);
    } else if (maxRecordedLevel < 0.3) {
      dynamicRange = max(dynamicRange * 0.999, 0.3);
    }
  }
}

// Reset calibration function
function resetCalibration() {
  maxRecordedLevel = 0;
  peakHold = 0;
  calibrationTime = millis();
  dynamicRange = 0.5;
  sensitivity = 3.0;
  console.log('Calibration values reset to defaults');
}

// Handle user interaction for microphone permission
function mousePressed() {
  // Ensure audio context is started (required by some browsers)
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}
