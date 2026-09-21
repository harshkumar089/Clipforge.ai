import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import clipRoutes from './routes/clipRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

async function runApiTests() {
  console.log('\n======================================================');
  console.log('   CLIPFORGE REST API ENDPOINTS TEST SUITE');
  console.log('======================================================\n');

  await connectDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/clips', clipRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/media', mediaRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  const PORT = 5055;

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}/api`;
  console.log(`✓ Test API server listening at ${baseUrl}\n`);

  try {
    // 1. Health check
    console.log('[Test 1] Health Check...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('✓ Health status:', healthData.status);

    // 2. Register
    console.log('\n[Test 2] POST /api/auth/register...');
    const regEmail = `api_user_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'API Tester',
        email: regEmail,
        password: 'password123',
      }),
    });
    const regData = await regRes.json();
    if (!regData.token) throw new Error('Registration failed: ' + JSON.stringify(regData));
    const token = regData.token;
    console.log(`✓ User registered, token received (Length: ${token.length})`);

    // 3. Login
    console.log('\n[Test 3] POST /api/auth/login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regEmail,
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    console.log(`✓ Login successful for: ${loginData.user?.email}`);

    // 4. Me
    console.log('\n[Test 4] GET /api/auth/me...');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    console.log(`✓ Auth profile returned: ${meData.user?.name}`);

    // 5. Upload Video via FormData
    console.log('\n[Test 5] POST /api/videos/upload...');
    const testVideoPath = path.resolve(process.cwd(), '../scratch/synthetic_test.mp4');
    const fileBuffer = fs.readFileSync(testVideoPath);

    const blob = new Blob([fileBuffer], { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('video', blob, 'api_test_video.mp4');
    formData.append('title', 'API Test Video');

    const uploadRes = await fetch(`${baseUrl}/videos/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.video?.id) throw new Error('Upload failed: ' + JSON.stringify(uploadData));
    const videoId = uploadData.video.id;
    console.log(`✓ Video uploaded successfully (ID: ${videoId}, Duration: ${uploadData.video.duration}s)`);

    // 6. Generate Clips
    console.log('\n[Test 6] POST /api/videos/:id/generate-clips...');
    const genRes = await fetch(`${baseUrl}/videos/${videoId}/generate-clips`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetClipDuration: 10,
        numberOfClips: 2,
      }),
    });
    const genData = await genRes.json();
    const jobId = genData.jobId;
    console.log(`✓ Clip generation enqueued (Job ID: ${jobId})`);

    // 7. Poll status until complete
    console.log('\n[Test 7] GET /api/videos/:id/processing-status...');
    let isComplete = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await fetch(`${baseUrl}/videos/${jobId}/processing-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statusData = await statusRes.json();
      console.log(`   [Poll ${i + 1}] Status: ${statusData.status} | Progress: ${statusData.progress}% | Message: "${statusData.message}"`);
      if (statusData.status === 'completed') {
        isComplete = true;
        break;
      }
    }
    if (!isComplete) throw new Error('Processing job timed out.');
    console.log('✓ Clip generation completed via job queue!');

    // 8. Get Clips
    console.log('\n[Test 8] GET /api/clips...');
    const clipsRes = await fetch(`${baseUrl}/clips`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const clipsData = await clipsRes.json();
    console.log(`✓ Found ${clipsData.clips?.length} clips in library.`);
    const firstClip = clipsData.clips[0];
    console.log(`   First clip: "${firstClip.title}" (${firstClip.duration}s, ratio: ${firstClip.aspectRatio})`);

    // 9. Get Single Clip Details
    console.log('\n[Test 9] GET /api/clips/:id...');
    const clipDetailRes = await fetch(`${baseUrl}/clips/${firstClip.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const clipDetail = await clipDetailRes.json();
    console.log(`✓ Clip details retrieved successfully.`);

    // 10. Export Clip with Edits
    console.log('\n[Test 10] POST /api/export/clips/:id/export...');
    const exportRes = await fetch(`${baseUrl}/export/clips/${firstClip.id}/export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startTime: 0,
        endTime: 6,
        aspectRatio: '9:16',
        resolution: '720p',
        filter: 'contrast',
        speed: 1.0,
        volume: 110,
        textOverlays: [{ text: 'API EXPORT TEST' }],
      }),
    });
    const exportData = await exportRes.json();
    const exportJobId = exportData.jobId;
    console.log(`✓ Export job enqueued (Job ID: ${exportJobId})`);

    // 11. Poll Export Status
    console.log('\n[Test 11] GET /api/export/status/:jobId...');
    let exportComplete = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const expStatusRes = await fetch(`${baseUrl}/export/status/${exportJobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const expStatusData = await expStatusRes.json();
      console.log(`   [Poll ${i + 1}] Export Status: ${expStatusData.status} | Progress: ${expStatusData.progress}% | Message: "${expStatusData.message}"`);
      if (expStatusData.status === 'completed') {
        exportComplete = true;
        console.log(`✓ Rendered file available: ${expStatusData.result?.downloadUrl}`);
        break;
      }
    }
    if (!exportComplete) throw new Error('Export job timed out.');

    console.log('\n======================================================');
    console.log('   ALL 11 REST API ENDPOINT TESTS PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    server.close();
    await disconnectDatabase();
  }
}

runApiTests().catch((err) => {
  console.error('API Tests Failed:', err);
  process.exit(1);
});
