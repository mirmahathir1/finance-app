const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const inputLogo = path.join(__dirname, '..', 'public', 'logo.png');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Icon sizes to generate
const iconSizes = [
  16, 32, 48, 96, 128, 180, 192, 256, 384, 512
];

async function generateIcons() {
  try {
    // Validate input exists
    if (!fs.existsSync(inputLogo)) {
      throw new Error(`Logo file not found: ${inputLogo}`);
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    console.log('Generating icons...');

    // Generate PNG icons
    const pngPromises = iconSizes.map(async (size) => {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath}`);
    });

    await Promise.all(pngPromises);

    // Generate favicon.ico (multi-resolution)
    const faviconSizes = [16, 32, 48];
    const faviconBuffers = await Promise.all(
      faviconSizes.map(async (size) => {
        return await sharp(inputLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toBuffer();
      })
    );

    const icoBuffer = await toIco(faviconBuffers);
    const faviconPath = path.join(outputDir, 'favicon.ico');
    fs.writeFileSync(faviconPath, icoBuffer);
    console.log(`✓ Generated ${faviconPath}`);

    // Copy 180x180 as apple-touch-icon
    const appleTouchIcon = path.join(outputDir, 'icon-180x180.png');
    const appleTouchIconDest = path.join(outputDir, 'apple-touch-icon.png');
    if (fs.existsSync(appleTouchIcon)) {
      fs.copyFileSync(appleTouchIcon, appleTouchIconDest);
      console.log(`✓ Generated ${appleTouchIconDest}`);
    }

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
