const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  try {
    const inputPath = path.join(__dirname, '../public/images/logoRukapay2.png');
    const outputPath = path.join(__dirname, '../app/favicon.png');
    
    // Create 32x32 favicon
    await sharp(inputPath)
      .resize(32, 32, { fit: 'contain', background: { r: 8, g: 22, b: 61, alpha: 1 } })
      .png()
      .toFile(outputPath);
    
    console.log('✅ Favicon generated successfully!');
    console.log('📁 Output:', outputPath);
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
  }
}

generateFavicon();
