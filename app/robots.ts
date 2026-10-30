import {absoluteUrl} from '@/lib/seo';
// Always crawlable: the storefront must be indexable even while sales are in preview.
// Private/transactional areas stay out of the index.
export default function robots(){return {
  rules:[{userAgent:'*',allow:['/','/api/images/'],disallow:['/admin','/account','/api/','/cart','/checkout']}],
  sitemap:absoluteUrl('/sitemap.xml'),
}}
