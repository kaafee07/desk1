const fs = require('fs');
const path = require('path');

// Create simple PNG icons using Canvas API (if available) or fallback to copying SVG
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// For now, we'll create a simple HTML file that can generate the icons
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas" style="display: none;"></canvas>
    <script>
        const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Simple icon generation
        sizes.forEach(size => {
            canvas.width = size;
            canvas.height = size;
            
            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#8b5cf6');
            
            // Draw background with rounded corners
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(0, 0, size, size, size * 0.25);
            ctx.fill();
            
            // Draw office building
            const buildingSize = size * 0.5;
            const buildingX = (size - buildingSize) / 2;
            const buildingY = (size - buildingSize) / 2;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(buildingX, buildingY, buildingSize, buildingSize, buildingSize * 0.1);
            ctx.fill();
            
            // Draw windows
            const windowSize = buildingSize * 0.125;
            const windowSpacing = buildingSize * 0.1875;
            ctx.fillStyle = '#6366f1';
            
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 4; col++) {
                    const x = buildingX + windowSpacing + col * windowSpacing;
                    const y = buildingY + windowSpacing + row * windowSpacing;
                    ctx.beginPath();
                    ctx.roundRect(x, y, windowSize, windowSize, windowSize * 0.125);
                    ctx.fill();
                }
            }
            
            // Draw door
            const doorWidth = buildingSize * 0.25;
            const doorHeight = buildingSize * 0.3125;
            const doorX = buildingX + (buildingSize - doorWidth) / 2;
            const doorY = buildingY + buildingSize - doorHeight;
            
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.roundRect(doorX, doorY, doorWidth, doorHeight, doorWidth * 0.125);
            ctx.fill();
            
            // Draw door handle
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(doorX + doorWidth * 0.75, doorY + doorHeight * 0.5, doorWidth * 0.0625, 0, 2 * Math.PI);
            ctx.fill();
            
            // Download the image
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`icon-\${size}x\${size}.png\`;
                a.click();
                URL.revokeObjectURL(url);
            });
        });
    </script>
</body>
</html>
`;

// Create the HTML file
const scriptsDir = path.dirname(__filename);
const htmlPath = path.join(scriptsDir, 'icon-generator.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log('Icon generator HTML created at:', htmlPath);
console.log('Open this file in a browser to generate and download the icon files.');
console.log('Then move the downloaded PNG files to the public/icons/ directory.');
