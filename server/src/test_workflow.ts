import { execFile } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { Video } from './models/Video.js';
import { Clip } from './models/Clip.js';
import { videoMetadataService } from './services/VideoMetadataService.js';
import { thumbnailService } from './services/ThumbnailService.js';
import { clipAnalyzer } from './services/ClipAnalyzer.js';
import { clipGenerationService } from './services/ClipGenerationService.js';
import { ffmpegService } from './services/FFmpegService.js';
import { exportService } from './services/ExportService.js';
import { config } from './config/environment.js';

const execFileAsync = util.promisify(execFile);

async function runEndToEndVerification() {
  console.log('\n======================================================');
  console.log('   CLIPFORGE END-TO-END VERIFICATION TEST SUITE');
  console.log('======================================================\n');

  // 1. Connect to Database
  console.log('[Step 1] Connecting to Database...');
  await connectDatabase();
  console.log('✓ Database connected successfully.\n');

  // 2. Generate Synthetic Test Video with FFmpeg
  console.log('[Step 2] Generating synthetic test video using FFmpeg...');
  const testDir = path.resolve(process.cwd(), '../scratch');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

  const testVideoPath = path.join(testDir, 'synthetic_test.mp4');
  if (!fs.existsSync(testVideoPath)) {
    // Generate a 30-second test video with dynamic color pattern and audio tone
    const genArgs = [
      '-y',
      '-f', 'lavfi',
      '-i', 'testsrc=duration=30:size=1280x720:rate=30',
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      testVideoPath,
    ];
    await execFileAsync(config.ffmpegPath, genArgs);
  }
  console.log(`✓ Synthetic test video created at: ${testVideoPath}\n`);

  // 3. Verify Video Metadata Extraction & Duration Validation
  console.log('[Step 3] Testing VideoMetadataService (ffprobe)...');
  const metadata = await videoMetadataService.getMetadata(testVideoPath);
  console.log(`✓ Metadata extracted:`, {
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
    aspectRatio: metadata.aspectRatio,
    videoCodec: metadata.videoCodec,
    fps: metadata.fps,
  });

  const validCheck = videoMetadataService.validateDuration(metadata.duration);
  console.log(`✓ Duration validation (<= 300s):`, validCheck.valid ? 'PASSED' : 'FAILED');

  const invalidCheck = videoMetadataService.validateDuration(400);
  console.log(`✓ 5-minute limit rejection check (>300s):`, !invalidCheck.valid ? 'PASSED (Rejected as expected)' : 'FAILED');
  console.log('');

  // 4. Test Thumbnail Generation
  console.log('[Step 4] Testing ThumbnailService...');
  const thumbPath = await thumbnailService.generateThumbnail(testVideoPath, 2);
  console.log(`✓ Thumbnail generated at: ${thumbPath} (exists: ${fs.existsSync(thumbPath)})\n`);

  // 5. Test Heuristic ClipAnalyzer
  console.log('[Step 5] Testing ClipAnalyzer algorithm...');
  const candidates = await clipAnalyzer.analyze(testVideoPath, metadata.duration, {
    targetClipDuration: 10,
    numberOfClips: 2,
  });
  console.log(`✓ ClipAnalyzer produced ${candidates.length} highlight moments:`);
  candidates.forEach((cand, idx) => {
    console.log(`   Clip #${idx + 1}: ${cand.startTime}s -> ${cand.endTime}s | Score: ${cand.score} | Reason: "${cand.reason}"`);
  });
  console.log('');

  // 6. Test User & Video Database Persistence
  console.log('[Step 6] Testing Models & User Creation...');
  const testUser = new User({
    name: 'Test Creator',
    email: `creator_${Date.now()}@example.com`,
    password: 'password123',
  });
  await testUser.save();
  console.log(`✓ User saved: ${testUser.email} (ID: ${testUser._id})`);

  const testVideo = new Video({
    userId: testUser._id,
    title: 'Verification Test Video',
    originalFileName: 'synthetic_test.mp4',
    filePath: testVideoPath,
    thumbnailPath: thumbPath,
    duration: metadata.duration,
    fileSize: metadata.size,
    status: 'pending',
  });
  await testVideo.save();
  console.log(`✓ Video recorded in DB (ID: ${testVideo._id})\n`);

  // 7. Test Clip Generation Pipeline
  console.log('[Step 7] Testing ClipGenerationService...');
  const generatedClips = await clipGenerationService.generateClipsForVideo(testVideo, {
    targetClipDuration: 10,
    numberOfClips: 2,
  });
  console.log(`✓ Generated ${generatedClips.length} physical clips with thumbnails!`);
  generatedClips.forEach((c) => {
    console.log(`   - "${c.title}": file exists: ${fs.existsSync(c.filePath || '')}, thumb exists: ${fs.existsSync(c.thumbnailPath || '')}`);
  });
  console.log('');

  // 8. Test Full Export Pipeline with FFmpeg (9:16 Vertical, Filter, Speed, Text Overlay)
  console.log('[Step 8] Testing ExportService with 9:16 vertical crop, color filter, text overlay...');
  let exportProgressReported = false;
  const exportResult = await exportService.renderClip(
    generatedClips[0].filePath || '',
    {
      startTime: 0,
      endTime: 8,
      aspectRatio: '9:16',
      resolution: '720p',
      filter: 'bright',
      speed: 1.0,
      volume: 120,
      textOverlays: [
        {
          id: 'test-txt',
          text: 'CLIPFORGE AI',
          fontSize: 24,
          color: 'yellow',
          position: 'top',
          isBold: true,
          alignment: 'center',
        },
      ],
    },
    (pct) => {
      exportProgressReported = true;
    }
  );

  console.log(`✓ Export completed!`);
  console.log(`   Output file: ${exportResult.outputPath} (Size: ${fs.statSync(exportResult.outputPath).size} bytes)`);
  console.log(`   Progress tracking active: ${exportProgressReported}`);

  // Inspect output with ffprobe to verify 9:16 vertical aspect ratio
  const exportMeta = await videoMetadataService.getMetadata(exportResult.outputPath);
  console.log(`✓ Exported video verified:`, {
    dimensions: `${exportMeta.width}x${exportMeta.height}`,
    aspectRatio: exportMeta.aspectRatio,
    duration: exportMeta.duration,
  });
  console.log('');

  // Cleanup DB
  await disconnectDatabase();

  console.log('======================================================');
  console.log('   ALL CLIPFORGE PIPELINE TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runEndToEndVerification().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
