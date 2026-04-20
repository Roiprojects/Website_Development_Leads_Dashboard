import * as esbuild from 'esbuild';
import fs from 'fs';

await esbuild.build({ 
  entryPoints: ['backend/src/index.ts'], 
  bundle: true, 
  outfile: 'api/index.js', 
  platform: 'node', 
  target: 'node20', 
  format: 'cjs', 
  external: ['mock-aws-s3', 'aws-sdk', 'nock'] 
}).catch(() => process.exit(1));

fs.writeFileSync('api/package.json', JSON.stringify({ type: 'commonjs' }));
console.log('Backend bundled to api/index.js successfully!');