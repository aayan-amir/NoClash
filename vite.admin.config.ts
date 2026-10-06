import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { SemesterFileSchema } from './src/core/schema';

function localDataWriterPlugin(): Plugin {
  return {
    name: 'local-data-writer',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/save-timetable') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const json = JSON.parse(body);
              const result = SemesterFileSchema.safeParse(json);
              if (!result.success) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, errors: result.error.issues }));
                return;
              }

              const semester = result.data;
              const targetPath = path.resolve(
                __dirname,
                'public',
                'data',
                `semester-${semester.semester.id}.json`
              );

              fs.writeFileSync(targetPath, JSON.stringify(semester, null, 2), 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  message: `Saved to ${targetPath}`,
                  dataVersion: semester.dataVersion,
                })
              );
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  message: err instanceof Error ? err.message : String(err),
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  root: 'admin',
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react(), tailwindcss(), localDataWriterPlugin()],
  esbuild: {
    target: 'es2022',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  build: {
    target: 'es2022',
  },
  server: {
    host: true,
    port: 5174,
  },
});
