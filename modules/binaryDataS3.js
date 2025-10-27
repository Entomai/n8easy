import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableBinaryDataS3(license) {
  if (!license.hasFeature(LICENSE_FEATURES.BINARY_DATA_S3)) {
    throw new Error(`S3 binary data requires feature ${LICENSE_FEATURES.BINARY_DATA_S3}.`);
  }
  console.log('Binary data storage on S3 enabled.');
}