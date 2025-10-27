import { LICENSE_FEATURES } from '../lib/License.js';

export default function showNonProdBanner(license) {
  if (!license.hasFeature(LICENSE_FEATURES.SHOW_NON_PROD_BANNER)) {
    console.log('No non-production banner to show.');
    return;
  }
  console.log('*** This is a non-production environment ***');
}