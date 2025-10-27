import { LICENSE_FEATURES } from '../lib/License.js';

export default function enableCommunityNodesCustomRegistry(license) {
  if (!license.hasFeature(LICENSE_FEATURES.COMMUNITY_NODES_CUSTOM_REGISTRY)) {
    throw new Error(`Custom community nodes registry requires feature ${LICENSE_FEATURES.COMMUNITY_NODES_CUSTOM_REGISTRY}.`);
  }
  console.log('Custom registry for community nodes enabled.');
}