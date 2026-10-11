import { importMapsPlugin } from '@web/dev-server-import-maps';
import createConfig from 'tsds-web-test-runner/createConfig.mjs';

export default createConfig({
  concurrency: 1,
  concurrentBrowsers: 1,
  port: 9011,
  plugins: [
    importMapsPlugin({
      inject: {
        importMap: {
          imports: {
            backbone: '/test/data/backbone.mjs',
          },
        },
      },
    }),
  ],
});
