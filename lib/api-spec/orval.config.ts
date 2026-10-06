/**
 * lib/api-spec/orval.config.ts
 *
 * Fixed ts(2353): removed 'prettier' from output options —
 * it does not exist in orval's OutputOptions type.
 */
import { defineConfig, type InputTransformerFn } from 'orval';
import path from 'path';

const root = path.resolve(__dirname, '..', '..');
const apiClientReactSrc = path.resolve(root, 'lib', 'api-client-react', 'src');
const apiZodSrc = path.resolve(root, 'lib', 'api-zod', 'src');

const titleTransformer: InputTransformerFn = (config) => {
  config.info ??= {};
  config.info.title = 'Api';
  return config;
};

export default defineConfig({
  'api-client-react': {
    input: {
      target: './openapi.yaml',
      override: { transformer: titleTransformer },
    },
    output: {
      workspace: apiClientReactSrc,
      target: 'generated',
      client: 'react-query',
      mode: 'split',
      baseUrl: '/api',
      clean: true,
      // prettier removed — not a valid OutputOptions key in this orval version
      override: {
        fetch: { includeHttpResponseReturnType: false },
        mutator: {
          path: path.resolve(apiClientReactSrc, 'custom-fetch.ts'),
          name: 'customFetch',
        },
      },
    },
  },
  zod: {
    input: {
      target: './openapi.yaml',
      override: { transformer: titleTransformer },
    },
    output: {
      workspace: apiZodSrc,
      client: 'zod',
      target: 'generated',
      schemas: { path: 'generated/types', type: 'typescript' },
      mode: 'split',
      clean: true,
      // prettier removed — not a valid OutputOptions key in this orval version
      override: {
        zod: {
          coerce: {
            query: ['boolean', 'number', 'string'],
            param: ['boolean', 'number', 'string'],
            body: ['bigint', 'date'],
            response: ['bigint', 'date'],
          },
        },
        useDates: true,
        useBigInt: true,
      },
    },
  },
});