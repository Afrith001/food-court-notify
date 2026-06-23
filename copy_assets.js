import fs from 'fs';
import path from 'path';

const srcBanner = 'C:\\Users\\Mohammed\\.gemini\\antigravity-ide\\brain\\54f25698-cfab-4c68-9543-955a79a9fea9\\hero_banner_1782139774943.png';
const srcSpecial = 'C:\\Users\\Mohammed\\.gemini\\antigravity-ide\\brain\\54f25698-cfab-4c68-9543-955a79a9fea9\\todays_special_1782139920051.png';

const destDir = 'c:\\Users\\Mohammed\\OneDrive\\Desktop\\food-court-connect-53-main\\food-court-connect-53-main\\public';

try {
  fs.copyFileSync(srcBanner, path.join(destDir, 'hero_banner.png'));
  fs.copyFileSync(srcSpecial, path.join(destDir, 'todays_special.png'));
  console.log('Assets copied successfully!');
} catch (err) {
  console.error('Error copying assets:', err);
}
