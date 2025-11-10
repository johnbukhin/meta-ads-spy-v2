// API Endpoint: /api/extract-ad-image
// Add this file to your existing meta-ads-spy-v2/api/ directory

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
    // Enable CORS for n8n
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        // Health check endpoint
        res.status(200).json({ 
            status: 'OK', 
            service: 'Facebook Ad Image Extractor', 
            timestamp: new Date().toISOString(),
            environment: 'Vercel',
            version: '1.0.0'
        });
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST to extract images.' });
        return;
    }

    const startTime = Date.now();
    const { url, includeBase64 = false, timeout = 45000 } = req.body;
    
    console.log(`[${new Date().toISOString()}] Image extraction request for:`, url?.substring(0, 100) + '...');
    
    // Validate input URL
    if (!url || !url.includes('facebook.com/ads/archive/render_ad')) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid Facebook ad URL. Must contain "facebook.com/ads/archive/render_ad"',
            processingTime: Date.now() - startTime
        });
    }

    let browser = null;

    try {
        console.log('🚀 Launching browser for image extraction...');
        
        // Configure Chromium for Vercel serverless environment
        await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');

        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            timeout: timeout
        });

        const page = await browser.newPage();
        
        // Set realistic browser headers
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        // Set extra HTTP headers to avoid detection
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        });
        
        console.log('🌐 Navigating to Facebook ad URL...');
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: timeout 
        });

        console.log('⏳ Waiting for page to fully render...');
        await new Promise(resolve => setTimeout(resolve, 6000)); // Increased wait time

        console.log('🔍 Extracting images from rendered page...');
        const images = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
                .map(img => {
                    // Get computed style to check visibility
                    const style = window.getComputedStyle(img);
                    return {
                        src: img.src,
                        alt: img.alt || '',
                        width: img.naturalWidth || img.width || 0,
                        height: img.naturalHeight || img.height || 0,
                        className: img.className || '',
                        visible: style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0',
                        parentTagName: img.parentElement?.tagName || ''
                    };
                })
                .filter(img => 
                    img.src && 
                    img.visible && // Only include visible images
                    !img.src.includes('data:') && 
                    !img.src.includes('static.xx.fbcdn.net/rsrc.php') && // Filter out UI icons
                    !img.src.includes('icon') &&
                    !img.src.includes('logo') &&
                    (img.width > 150 || img.height > 150) && // Filter for larger images
                    (img.src.includes('scontent') || img.src.includes('fbcdn') || img.src.includes('lookaside'))
                )
                .sort((a, b) => (b.width * b.height) - (a.width * a.height)); // Sort by size
        });

        console.log(`📸 Found ${images.length} potential ad images`);
        
        if (images.length > 0) {
            console.log('Top 3 images by size:');
            images.slice(0, 3).forEach((img, i) => {
                console.log(`  ${i + 1}. ${img.width}x${img.height} - ${img.src.substring(0, 60)}...`);
            });
        }

        if (images.length === 0) {
            // Take a screenshot for debugging if no images found
            let debugScreenshot = null;
            try {
                const screenshotBuffer = await page.screenshot({ 
                    encoding: 'base64',
                    type: 'png',
                    fullPage: false
                });
                debugScreenshot = `data:image/png;base64,${screenshotBuffer}`;
            } catch (screenshotError) {
                console.log('Could not take debug screenshot:', screenshotError.message);
            }

            await browser.close();
            return res.status(404).json({
                success: false,
                error: 'No ad images found on the page. The page may require login or the ad may have been removed.',
                processingTime: Date.now() - startTime,
                debugScreenshot: debugScreenshot // Include screenshot for debugging
            });
        }

        // Get the largest/best image
        const bestImage = images[0]; // Already sorted by size

        console.log(`✅ Selected best image: ${bestImage.src.substring(0, 80)}... (${bestImage.width}x${bestImage.height})`);

        const result = {
            success: true,
            imageUrl: bestImage.src,
            dimensions: { 
                width: bestImage.width, 
                height: bestImage.height 
            },
            totalImagesFound: images.length,
            allImages: images.slice(0, 10).map(img => ({ // Return top 10 for reference
                url: img.src,
                dimensions: { width: img.width, height: img.height },
                alt: img.alt
            })),
            originalUrl: url,
            processingTime: Date.now() - startTime
        };

        await browser.close();
        console.log(`🎉 Image extraction completed successfully in ${result.processingTime}ms`);
        res.status(200).json(result);

    } catch (error) {
        console.error('❌ Error during image extraction:', error.message);
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError.message);
            }
        }
        res.status(500).json({
            success: false,
            error: `Extraction failed: ${error.message}`,
            originalUrl: url,
            processingTime: Date.now() - startTime
        });
    }
}