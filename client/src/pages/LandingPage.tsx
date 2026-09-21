import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  Sparkles,
  Zap,
  Smartphone,
  Type,
  Sliders,
  Check,
  ChevronDown,
  ArrowRight,
  Play,
  Film,
  Layers,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar.js';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does ClipForge detect the best clips from my video?',
      a: 'ClipForge analyzes audio peaks, speech energy, pacing, and visual transitions across your video to automatically find high-impact moments that grab viewer attention in the first 3 seconds.',
    },
    {
      q: 'Are text overlays and effects burned into the final exported video?',
      a: 'Yes, when you export, ClipForge uses server-side FFmpeg rendering to bake your chosen text overlays, stickers, transitions, and filters directly into the exported MP4.',
    },
    {
      q: 'What video formats and durations are supported?',
      a: 'ClipForge natively supports MP4, MOV, WebM, and AVI files up to 5 minutes (300 seconds) long and up to 100MB in size.',
    },
    {
      q: 'Can I reframe my landscape video into vertical 9:16 format?',
      a: 'Yes! ClipForge provides one-click 9:16 vertical re-framing with a clean blurred ambient background so your content looks native on TikTok, Instagram Reels, and YouTube Shorts.',
    },
    {
      q: 'Can I customize clip length and number of generated clips?',
      a: 'Absolutely. You can choose target durations of 10s, 15s, 20s, or 30s and specify whether you want 1, 3, 5, or 10 highlight clips.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9fe] dark:bg-[#090514] text-slate-900 dark:text-purple-100 flex flex-col selection:bg-purple-100 selection:text-purple-900 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Ambient purple glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-purple-300/35 dark:bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-300/25 dark:bg-indigo-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/90 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(168,85,247,0.25)] animate-pulse-subtle">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
            Next-Generation AI Video Clipper
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1] transition-colors">
            Turn Long Videos Into <br />
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.3)]">
              Scroll-Stopping Clips.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-purple-200/70 max-w-2xl mx-auto leading-relaxed transition-colors">
            Upload a video. Find the best moments. Create polished short-form clips in minutes ready for TikTok, Reels, and YouTube Shorts.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-purple-500/25 dark:shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <span>Start Clipping Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white dark:bg-purple-950/40 hover:bg-purple-50/70 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 text-slate-700 dark:text-purple-200 hover:text-purple-700 dark:hover:text-white font-semibold text-base flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.12)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Metrics summary pill */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-purple-200/80 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Up to 5GB Video Uploads
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-purple-600" /> 4K Ultra HD & 1080p Export
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-purple-600" /> 9:16 Vertical Auto-Reframing
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-purple-600" /> Server-side FFmpeg Engine
            </span>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-purple-200/50 via-purple-100/20 to-transparent dark:from-purple-900/40 dark:via-purple-950/20 dark:to-transparent shadow-[0_0_50px_rgba(168,85,247,0.25)] border border-purple-100 dark:border-purple-800/60">
            <div className="rounded-xl overflow-hidden border border-purple-100 dark:border-purple-800/60 bg-white dark:bg-[#110a26] shadow-2xl relative">
              <div className="h-10 bg-purple-50/70 dark:bg-[#180f32] border-b border-purple-100 dark:border-purple-900/50 px-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <div className="ml-4 text-xs font-mono text-slate-400 dark:text-purple-400/50">clipforge.io/dashboard/editor</div>
              </div>

              {/* Visual preview composition */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-3 text-left">
                  <div className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                    AI Highlight Detected
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Peak Dialogue & Visual Shift</h3>
                  <p className="text-xs text-slate-600 dark:text-purple-200/70 leading-relaxed transition-colors">
                    ClipForge analyzed sound energy, voice density, and camera changes to isolate this 18.2s viral candidate.
                  </p>
                  <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 flex items-center justify-between text-xs font-mono shadow-[0_0_12px_rgba(168,85,247,0.1)]">
                    <span className="text-slate-500 dark:text-purple-300/60">Score: 94%</span>
                    <span className="text-purple-700 dark:text-purple-300 font-bold">Optimal Reel Format</span>
                  </div>
                </div>

                {/* Simulated vertical phone center */}
                <div className="relative mx-auto w-52 aspect-[9/16] rounded-3xl bg-slate-900 border-4 border-purple-200 dark:border-purple-700/80 overflow-hidden shadow-[0_0_35px_rgba(168,85,247,0.35)] flex flex-col justify-between p-3">
                  <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
                  <div className="text-center py-6">
                    <div className="inline-block px-3 py-1 rounded bg-amber-400 text-zinc-950 font-black text-xs uppercase mb-2 shadow">
                      VIRAL HOOK
                    </div>
                    <div className="text-xs font-bold text-white leading-snug">
                      "When you focus on consistency every day, everything changes."
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400 text-center font-mono">00:08 / 00:18</div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 flex items-center gap-3 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
                    <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">9:16 Re-Framing</div>
                      <div className="text-[11px] text-slate-500 dark:text-purple-300/60">Blurred ambient backdrop</div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 flex items-center gap-3 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
                    <Type className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Text & 110+ Fonts</div>
                      <div className="text-[11px] text-slate-500 dark:text-purple-300/60">Custom styles & animations</div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 flex items-center gap-3 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
                    <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">1080p MP4 Export</div>
                      <div className="text-[11px] text-slate-500 dark:text-purple-300/60">Native FFmpeg backend</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-purple-100/80 dark:border-purple-900/50 bg-white/60 dark:bg-[#0c071d]/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
              Simple 3-Step Process
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">How ClipForge Works</h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-purple-300/70">
              Transform hours of editing work into three effortless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Long Video',
                desc: 'Upload any video up to 5 minutes in MP4, MOV, WebM, or AVI. We validate metadata and prep it for scanning.',
                icon: Film,
              },
              {
                step: '02',
                title: 'AI Clip Extraction',
                desc: 'Our ClipAnalyzer evaluates scene changes, audio volume, and silence to automatically produce 10–30s highlight clips.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Edit & Export',
                desc: 'Trim boundaries, switch to 9:16 vertical, customize text overlays, color filters, speed, and download your 1080p clip.',
                icon: Scissors,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="glass-card p-8 rounded-2xl border border-purple-100/90 dark:border-purple-900/40 bg-white dark:bg-[#120a26]/90 shadow-sm shadow-purple-500/5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-[0_0_28px_rgba(168,85,247,0.25)] transition-all relative group"
                >
                  <div className="text-4xl font-black text-purple-200 dark:text-purple-800/80 group-hover:text-purple-300 dark:group-hover:text-purple-600 transition-colors mb-4">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-6 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-purple-200/70 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 border-t border-purple-100/80 dark:border-purple-900/50 bg-gradient-to-b from-[#faf9fe] to-white dark:from-[#090514] dark:to-[#0e0822] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
              Feature Stack
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">Engineered for Creators</h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-purple-300/60 transition-colors">
              Everything you need to turn long webinars, podcasts, and streams into high-converting shorts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Automatic Clip Detection',
                desc: 'Smart heuristic detection scans speech energy and visual scene cuts without manual scrubbing.',
                icon: Sparkles,
              },
              {
                title: 'Smart Video Trimming',
                desc: 'Interactive dual-handle scrubber lets you dial in the exact start and end timestamps down to the sub-second.',
                icon: Scissors,
              },
              {
                title: 'Vertical Social Formats',
                desc: 'Effortlessly switch between 9:16 vertical, 1:1 square, and 16:9 widescreen with ambient blur fill.',
                icon: Smartphone,
              },
              {
                title: 'Text Overlays & 110+ Fonts',
                desc: 'Select from 110+ Google Fonts, custom color palettes, outlines, shadows, and animations.',
                icon: Type,
              },
              {
                title: 'Fast 1080p MP4 Export',
                desc: 'Server-side FFmpeg pipeline encodes high-definition 720p or 1080p MP4s with real-time export status.',
                icon: Zap,
              },
              {
                title: 'Background Music & Filters',
                desc: 'Import audio overlay tracks with speech ducking, adjust speed (0.5x–2x), and apply 12 cinematic filters.',
                icon: Sliders,
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass-card p-6 rounded-2xl border border-purple-100/90 dark:border-purple-900/40 bg-white dark:bg-[#120a26]/90 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 mb-4 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 transition-colors">{f.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-purple-200/70 leading-relaxed transition-colors">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section id="formats" className="py-16 border-t border-purple-100/80 dark:border-purple-900/50 bg-purple-50/30 dark:bg-[#0c071d]/40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Supported Video Formats</h3>
          <p className="text-xs text-slate-500 dark:text-purple-300/70 max-w-lg mx-auto mb-8">
            Upload files up to 5 minutes in duration and 100MB in size. ClipForge automatically extracts streams and verifies metadata.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['MP4 (H.264 / AAC)', 'MOV (Apple QuickTime)', 'WebM (VP8 / VP9)', 'AVI (Audio Video Interleave)'].map((fmt) => (
              <div key={fmt} className="px-5 py-2.5 rounded-xl bg-white dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs font-mono font-medium text-slate-700 dark:text-purple-200 shadow-sm">
                {fmt}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-[#090514] border-t border-purple-100/80 dark:border-purple-900/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
              Plans & Pricing
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-purple-300/60 transition-colors">
              Start free today and upgrade as your channel audience expands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: 'forever free',
                desc: 'Perfect for exploring automated clipping',
                features: ['Up to 5 min videos', '3 clips per video', '720p HD export', 'Custom text overlays'],
                cta: 'Start Free',
                primary: false,
              },
              {
                name: 'Creator Pro',
                price: '$19',
                period: 'per month',
                desc: 'For active YouTubers, podcasters & streamers',
                features: ['Up to 5GB video uploads', 'Up to 10 clips per video', '4K Ultra HD & 1080p export', '110+ Google Fonts & styles', '9:16 vertical auto-reframe', 'Audio overlay mixing'],
                cta: 'Upgrade to Pro',
                primary: true,
              },
              {
                name: 'Agency',
                price: '$49',
                period: 'per month',
                desc: 'For content teams and editing agencies',
                features: ['4K 60fps master rendering', 'Priority queue rendering', 'Bulk export workflows', 'Custom watermarks', 'Dedicated support'],
                cta: 'Contact Sales',
                primary: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-8 rounded-2xl border transition-all ${
                  plan.primary
                    ? 'border-2 border-purple-500 bg-gradient-to-b from-purple-50/50 to-white dark:from-[#211142] dark:to-[#120a26] shadow-[0_0_35px_rgba(168,85,247,0.3)] relative'
                    : 'border-purple-100 dark:border-purple-900/40 bg-white dark:bg-[#120a26]/80 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-200 dark:hover:border-purple-700'
                }`}
              >
                {plan.primary && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md shadow-purple-500/25">
                    Most Popular
                  </div>
                )}
                <div className="text-lg font-bold text-slate-900 dark:text-white transition-colors">{plan.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white transition-colors">{plan.price}</span>
                  <span className="text-xs text-slate-400 dark:text-purple-300/60">/{plan.period}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-purple-300/60 transition-colors">{plan.desc}</p>

                <div className="my-6 border-t border-purple-100 dark:border-purple-800/60" />

                <div className="space-y-3 mb-8">
                  {plan.features.map((feat, fi) => (
                    <div key={fi} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-purple-200/90">
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center transition-all ${
                    plan.primary
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/25'
                      : 'bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-purple-100/80 dark:border-purple-900/50 bg-purple-50/20 dark:bg-[#0c071d]/60 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
              Got Questions?
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-purple-100/90 dark:border-purple-800/60 bg-white dark:bg-[#120a26] shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 dark:text-purple-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-purple-600 dark:text-purple-300' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 dark:text-purple-200/80 leading-relaxed border-t border-purple-100 dark:border-purple-900/50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-purple-100/80 dark:border-purple-900/50 bg-white dark:bg-[#0c071d] py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">ClipForge</span>
            <span className="text-xs text-slate-400 dark:text-purple-300/60 ml-2">© 2026 ClipForge Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-purple-300/70 font-medium">
            <a href="#how-it-works" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
