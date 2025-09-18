// "use server";

// import puppeteer from "puppeteer";

// import { extractCurrency, extractDescription, extractPrice } from "../utils";

// export async function scrapeAmazonProduct(url: string) {
//   if (!url) return;

//   let browser;
//   try {
//     console.log("prdouctUrl:", url);
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//       ],
//     });

//     const page = await browser.newPage();

//     // Set user agent to appear more like a real browser
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
//     );

//     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

//     // await page.waitForSelector(".pdp-mod-product-badge-title", {
//     //   timeout: 15000,
//     // });
//     // SOLUTION 1: Use setTimeout with Promise (Recommended)
//     await new Promise((resolve) => setTimeout(resolve, 5000));

//     const productData = await page.evaluate(() => {
//       return {
//         title:
//           document
//             .querySelector(".pdp-mod-product-badge-title")
//             ?.textContent?.trim() ?? null,
//         // Fixed the price selector - it looks like multiple classes, use proper CSS selector
//         currentPrice:
          
//             document
//               .querySelector(
//                 ".notranslate.pdp-price.pdp-price_type_normal.pdp-price_color_orange.pdp-price_size_xl"
//               )
//               ?.textContent?.trim()
//           ?? null,
//         originalPrice:
         
//             document
//               .querySelector(
//                 ".notranslate.pdp-price.pdp-price_type_deleted.pdp-price_color_lightgray.pdp-price_size_xs"
//               )
//               ?.textContent?.trim()
//            ?? null,
//         discountRate:
         
//             document
//               .querySelector(".pdp-product-price__discount")
//               ?.textContent?.trim()
//            ?? null,
//         image:
//           document
//             .querySelector(".pdp-mod-common-image.gallery-preview-panel__image")
//             ?.getAttribute("src") ?? null,
//       };
//     });

//     console.log("product Data:", productData)

//     await browser.close();

//     // Construct data object with scraped information
//     const data = {
//       ...productData,
//       url,
//       //   currency: currency || '$',
//       //   image: imageUrls[0],
//       //   title,
//       //   currentPrice: Number(currentPrice) || Number(originalPrice),
//       //   originalPrice: Number(originalPrice) || Number(currentPrice),
//       priceHistory: [],
//       //   discountRate: Number(discountRate),
//       category: "category",
//       reviewsCount: 100,
//       stars: 4.5,
//       //   isOutOfStock: outOfStock,
//       //   description,
        // lowestPrice: Number(currentPrice) || Number(originalPrice),
        // highestPrice: Number(originalPrice) || Number(currentPrice),
        // averagePrice: Number(currentPrice) || Number(originalPrice),
//     };

//     return data;
//   } catch (error: any) {
//     console.log(error);
//   }
// }



"use server";

import puppeteer from "puppeteer";
import { extractCurrency, extractDescription, extractPrice } from "../utils";


interface ScrapedProduct {
  currentPrice: number;
  originalPrice: number;
  currency: string;
  discountRate: number;
  url: string;
  priceHistory: any[];
  category: string;
  reviewsCount: number;
  stars: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  title: string;
  image: string;
}




export async function scrapeAmazonProduct(url: string): Promise<ScrapedProduct | null>  {
  if (!url) return null;

  let browser;
  try {
    console.log("productUrl:", url);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    // Set user agent to appear more like a real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 60000 
    });

   
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Debug: Check what elements are actually available
    await page.evaluate(() => {
      console.log('=== DEBUG: Available price elements ===');
      
      
      const priceElements = document.querySelectorAll('[class*="price"]');
      priceElements.forEach((el, index) => {
        console.log(`Price Element ${index}:`, el.className, '→', el.textContent?.trim());
      });
      
      // Find all elements with 'pdp-product-price' in class name
      const pdpPriceElements = document.querySelectorAll('[class*="pdp-product-price"]');
      pdpPriceElements.forEach((el, index) => {
        console.log(`PDP Price Element ${index}:`, el.className, '→', el.textContent?.trim());
      });
    });

    const productData = await page.evaluate(() => {
      // Helper function to try multiple selectors
      const tryMultipleSelectors = (selectors: string[]): string | null => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          const text = element?.textContent?.trim();
          if (text && text !== '') {
            console.log(`Found with selector "${selector}": ${text}`);
            return text;
          }
        }
        return null;
      };

      // Multiple possible selectors for current price
      const currentPriceSelectors = [
        // original selectors
        ".notranslate.pdp-price.pdp-price_type_normal.pdp-price_color_orange.pdp-price_size_xl",
        // Alternative selectors based on common Daraz patterns
        ".pdp-product-price .pdp-price",
        ".pdp-product-price .notranslate",
        ".pdp-price_color_orange",
        ".pdp-price_type_normal",
        // More generic selectors
        '[class*="pdp-price"][class*="orange"]',
        '[class*="pdp-price"][class*="normal"]',
        '.pdp-product-price span[class*="price"]',
        // Fallback selectors
        '[class*="current-price"]',
        '[class*="sale-price"]',
        '.price-current',
        // Even more generic
        '[class*="price"]:not([class*="deleted"]):not([class*="original"])'
      ];

      // Multiple possible selectors for original price
      const originalPriceSelectors = [
        // original selector
        ".notranslate.pdp-price.pdp-price_type_deleted.pdp-price_color_lightgray.pdp-price_size_xs",
        // Alternative selectors
        ".pdp-price_type_deleted",
        ".pdp-price_color_lightgray",
        '[class*="pdp-price"][class*="deleted"]',
        '[class*="original-price"]',
        '[class*="was-price"]',
        '.price-original',
        '.origin-block .pdp-price',
        // Generic strikethrough price
        '[style*="text-decoration: line-through"]',
        '[class*="strike"]'
      ];

      // Multiple possible selectors for discount
      const discountSelectors = [
        // original selector
        ".pdp-product-price__discount",
        // Alternative selectors
        '[class*="discount"]',
        '[class*="save"]',
        '[class*="off"]',
        '.pdp-product-price .discount',
        '.sale-badge',
        '.discount-badge'
      ];

      const title = document.querySelector(".pdp-mod-product-badge-title")?.textContent?.trim() ?? null;
      const currentPrice = tryMultipleSelectors(currentPriceSelectors);
      const originalPrice = tryMultipleSelectors(originalPriceSelectors);
      const discountRate = tryMultipleSelectors(discountSelectors);
      
      // Try to get image with multiple selectors
      const imageSelectors = [
        ".pdp-mod-common-image.gallery-preview-panel__image",
        ".gallery-preview-panel__image",
        ".pdp-mod-common-image",
        '[class*="gallery-preview"] img',
        '.item-gallery img',
        '.product-image img'
      ];
      
      let image = null;
      for (const selector of imageSelectors) {
        const imgElement = document.querySelector(selector);
        if (imgElement) {
          image = imgElement.getAttribute('src') || imgElement.getAttribute('data-src');
          if (image) break;
        }
      }

      return {
        title,
        currentPrice,
        originalPrice,
        discountRate,
        image,
       
      };
    });

    console.log("Scraped Data:", productData);

    await browser.close();

  
    const data = {
      ...productData,
        currentPrice: Number(extractPrice({ text: () => productData.currentPrice ?? "" })),
        originalPrice: Number(extractPrice({ text: () => productData.originalPrice ?? "" })),
        currency: extractCurrency({text: ()=> productData.originalPrice ?? ""}),
        discountRate: Number(productData?.discountRate?.replace(/[-%]/g, "")),
      url,
      priceHistory: [],
      category: "category",
      reviewsCount: 100,
      stars: 4.5,
      lowestPrice: Number(extractPrice({ text: () => productData.currentPrice ?? "" })) || Number(extractPrice({ text: () => productData.originalPrice ?? "" })),
      highestPrice: Number(extractPrice({ text: () => productData.originalPrice ?? "" })) || Number(extractPrice({ text: () => productData.currentPrice ?? "" })),
      averagePrice: Number(extractPrice({ text: () => productData.currentPrice ?? "" })) || Number(extractPrice({ text: () => productData.originalPrice ?? "" })),
      title: productData.title ?? "",
      image: productData.image ?? "",
    //   isOutOfStock: outOfStock,
    //   description,
    };

    console.log("Final Data:", data);
    return data;

  } catch (error: any) {
    console.log("Scraping Error:", error.message);
    if (browser) {
      await browser.close();
    }
    return null;
  }
}
