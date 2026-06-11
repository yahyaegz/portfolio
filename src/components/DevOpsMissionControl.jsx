import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import SplitTextReveal from './SplitTextReveal';
import SectionBackground from './SectionBackground';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
    { id: 'build',  label: 'Build',          icon: 'fa-hammer',           duration: 2400 },
    { id: 'test',   label: 'Test Suite',      icon: 'fa-flask',            duration: 3200 },
    { id: 'scan',   label: 'Security Scan',   icon: 'fa-shield-halved',    duration: 1800 },
    { id: 'docker', label: 'Docker Build',    icon: 'fa-docker',           duration: 2000 },
    { id: 'deploy', label: 'Deploy',          icon: 'fa-cloud-upload-alt', duration: 2800 },
];

const CLOUD_TARGETS = [
    { id: 'aws',    label: 'AWS EC2' },
    { id: 'azure',  label: 'Azure App Service' },
    { id: 'vercel', label: 'Vercel' },
];

const REGIONS = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

const LOG_LINES = {
    aws: {
        build:  [
            '> npm ci --prefer-offline',
            'added 847 packages in 12.4s',
            '> webpack --mode production --config webpack.prod.js',
            'asset main.bundle.js 892 KiB',
            'Hash: a4f3c891b2d7e5f8c3a1',
            'Version: webpack 5.91.0',
            'Time: 8412ms',
            'Build completed in 2.4s ✓',
        ],
        test: [
            'PASS  src/__tests__/auth.test.js',
            '  ✓ should validate JWT token (12ms)',
            '  ✓ should reject expired tokens (8ms)',
            'PASS  src/__tests__/api.test.js',
            '  ✓ GET /api/users returns 200 (34ms)',
            '  ✓ POST /api/auth validates payload (19ms)',
            'Test Suites: 12 passed, 12 total',
            'Tests:       47 passing, 0 failing',
            'Coverage: 94.2% Statements | 91.8% Branches',
        ],
        scan: [
            '[SonarQube] Analysis started...',
            '[SonarQube] Scanning source files...',
            'INFO: 0 blocker issues found',
            'INFO: 2 minor code smells (non-blocking)',
            '[Trivy] Scanning image for CVEs...',
            '[Trivy] Checking library/node:18-alpine',
            'Total: 0 CRITICAL, 0 HIGH, 1 LOW',
            'Security scan passed ✓',
        ],
        docker: [
            'Step 1/8 : FROM node:18-alpine',
            'Pulling from library/node:18-alpine',
            '18-alpine: Pulling from library/node',
            'Step 2/8 : WORKDIR /app',
            'Step 3/8 : COPY package*.json ./',
            'Step 4/8 : RUN npm ci --production',
            'Step 5/8 : COPY dist/ ./dist/',
            'Step 6/8 : EXPOSE 3000',
            'Step 7/8 : HEALTHCHECK CMD curl -f http://localhost:3000/health',
            'Step 8/8 : CMD ["node", "server.js"]',
            'Successfully built d4e891f2c3a7',
            'Successfully tagged app:2.0.0 ✓',
        ],
        deploy: [
            'Uploading artifacts to S3... ████████ 100%',
            'aws ecs register-task-definition --family app-task',
            'Updating ECS service: app-service',
            'Desired count: 2, Running: 2',
            'Waiting for service stability...',
            'aws elbv2 describe-target-health --check',
            '✓ Health check passed (12ms)',
            '✓ Target group healthy: 2/2 instances',
            '✓ Deployment complete!',
        ],
    },
    azure: {
        build: [
            '> npm ci --prefer-offline',
            'added 847 packages in 13.1s',
            '> vite build --mode production',
            'vite v5.2.11 building for production...',
            'dist/index.html                    1.42 kB',
            'dist/assets/index-Daj8z3p1.js   412.33 kB',
            'Build completed in 2.1s ✓',
        ],
        test: [
            'Running tests via Vitest...',
            '✓ src/tests/auth.spec.ts (12ms)',
            '✓ src/tests/database.spec.ts (31ms)',
            '✓ src/tests/api.spec.ts (27ms)',
            'Test Files  9 passed (9)',
            'Tests       41 passed (41)',
            'Duration    4.22s',
            'Coverage: 92.6% Statements',
        ],
        scan: [
            '[Defender for DevOps] Scan started',
            'Scanning for secrets in code...',
            'INFO: No secrets detected',
            '[OWASP Dependency-Check] Analysis...',
            'Dependency-Check: 0 vulnerabilities found',
            '[Snyk] Testing node_modules...',
            '✓ no vulnerable packages',
            'Security scan passed ✓',
        ],
        docker: [
            'Step 1/7 : FROM node:20-alpine AS builder',
            'Step 2/7 : WORKDIR /app',
            'Step 3/7 : COPY . .',
            'Step 4/7 : RUN npm ci && npm run build',
            'Step 5/7 : FROM nginx:alpine',
            'Step 6/7 : COPY --from=builder /app/dist /usr/share/nginx/html',
            'Step 7/7 : EXPOSE 80',
            'Successfully tagged myregistry.azurecr.io/app:2.0.0 ✓',
            'Pushing to Azure Container Registry...',
            'Push complete ✓',
        ],
        deploy: [
            'az webapp deployment source config-zip --src app.zip',
            'Uploading package to Azure Storage... 100%',
            'Updating App Service plan: P2v3',
            'Deployment slot: staging → production swap',
            'Running pre-swap validation...',
            'Azure App Service health check: 200 OK',
            '✓ Slot swap completed',
            '✓ Application running at https://app.azurewebsites.net',
        ],
    },
    vercel: {
        build: [
            'Vercel CLI 34.2.1',
            'Detected Framework: Next.js 14',
            '> next build',
            '✓ Compiled successfully',
            'Route (app)                 Size   First Load JS',
            '┌ ○ /                       5.4 kB        92.7 kB',
            '├ ○ /about                  3.2 kB        90.5 kB',
            '└ ○ /projects               4.8 kB        92.1 kB',
            'Build completed in 2.0s ✓',
        ],
        test: [
            'Running: jest --ci --coverage',
            'PASS __tests__/index.test.tsx',
            '  ✓ renders homepage correctly (21ms)',
            '  ✓ navigation links are present (9ms)',
            'PASS __tests__/api.test.ts',
            '  ✓ /api/contact returns 200 (14ms)',
            'Tests:   18 passing, 0 failing',
            'Coverage: 88.4% Statements',
        ],
        scan: [
            '[Vercel Security] Scanning dependencies...',
            'npm audit --audit-level=high',
            'found 0 vulnerabilities',
            'Checking environment variables...',
            'INFO: No exposed secrets detected',
            '[Lighthouse CI] Running audits...',
            'Performance: 98 | Accessibility: 100',
            'Security scan passed ✓',
        ],
        docker: [
            '# Vercel Edge Runtime — no Docker needed',
            'Building Serverless Functions...',
            'λ /api/contact (Node.js 20.x)',
            'λ /api/send-email (Node.js 20.x)',
            'Edge Functions: 3 functions built',
            'Creating deployment bundle...',
            'Bundle size: 1.2MB (gzipped: 340KB)',
            'Bundle created ✓',
        ],
        deploy: [
            'Deploying to Vercel Edge Network...',
            'Uploading static assets: 47 files',
            'Assigning to production alias...',
            'DNS propagation: us-east-1 ✓',
            'DNS propagation: eu-west-1 ✓',
            'DNS propagation: ap-southeast-1 ✓',
            '✓ Live at https://app.vercel.app',
            '✓ Deployment complete in 28s',
        ],
    },
};

const ERROR_LINES = [
    '✗ FAILED at stage: Security Scan',
    'Error: CVE-2024-48949 detected in dependency "elliptic@6.5.3"',
    'Severity: HIGH | CVSS: 7.4',
    'Affected package: node_modules/elliptic',
    'Fix available: elliptic@6.5.7',
    'Pipeline aborted. Fix vulnerabilities and retry.',
];

const LOG_COLORS = {
    BUILD:   '#06b6d4',
    TEST:    '#10b981',
    SCAN:    '#eab308',
    DOCKER:  '#60a5fa',
    DEPLOY:  '#a78bfa',
    ERROR:   '#f43f5e',
    SUCCESS: '#10b981',
};

const STAGE_TAG_MAP = { build: 'BUILD', test: 'TEST', scan: 'SCAN', docker: 'DOCKER', deploy: 'DEPLOY' };

const SERVICES_BASE = [
    { name: 'App Server',     status: 'Online', latency: 12,  region: 'us-east-1' },
    { name: 'PostgreSQL',     status: 'Online', latency: 3,   region: 'us-east-1' },
    { name: 'Redis Cache',    status: 'Online', latency: 1,   region: 'us-east-1' },
    { name: 'CDN',            status: 'Online', latency: 0,   region: 'global'    },
    { name: 'Message Queue',  status: 'Online', latency: 8,   region: 'us-east-1' },
];

// ─── SVG Gauge ────────────────────────────────────────────────────────────────

function ArcGauge({ label, value, max = 100, color = '#10b981', unit = '%' }) {
    const r = 42;
    const cx = 56;
    const cy = 56;
    const startAngle = -220;
    const endAngle = 40;
    const totalArc = endAngle - startAngle;
    const pct = Math.min(1, value / max);
    const arcLen = pct * totalArc;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const trackEnd = { x: cx + r * Math.cos(toRad(endAngle)), y: cy + r * Math.sin(toRad(endAngle)) };
    const trackStart = { x: cx + r * Math.cos(toRad(startAngle)), y: cy + r * Math.sin(toRad(startAngle)) };
    const fillEnd = {
        x: cx + r * Math.cos(toRad(startAngle + arcLen)),
        y: cy + r * Math.sin(toRad(startAngle + arcLen)),
    };

    const describeArc = (sx, sy, ex, ey, large) =>
        `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;

    const trackPath = describeArc(trackStart.x, trackStart.y, trackEnd.x, trackEnd.y, 1);
    const fillLarge = arcLen > 180 ? 1 : 0;
    const fillPath = pct > 0
        ? describeArc(trackStart.x, trackStart.y, fillEnd.x, fillEnd.y, fillLarge)
        : '';

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="112" height="80" viewBox="0 0 112 80">
                <path d={trackPath} fill="none" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
                {fillPath && (
                    <path
                        d={fillPath}
                        fill="none"
                        stroke={color}
                        strokeWidth="7"
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
                    />
                )}
                <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize="14" fontWeight="800" fontFamily="monospace">
                    {value.toFixed(1)}{unit}
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">
                    {label}
                </text>
            </svg>
        </div>
    );
}

// ─── SVG Git Graph ────────────────────────────────────────────────────────────

function GitGraph({ completedCount }) {
    const nodes = [
        { x: 40,  y: 40, color: '#475569', label: 'init',      branch: 'main' },
        { x: 100, y: 40, color: '#475569', label: 'feat/login', branch: 'main' },
        { x: 160, y: 70, color: '#06b6d4', label: 'branch',     branch: 'feat' },
        { x: 220, y: 70, color: '#06b6d4', label: 'dev',        branch: 'feat' },
        { x: 280, y: 40, color: '#10b981', label: 'merge',      branch: 'main' },
        { x: 340, y: 40, color: '#eab308', label: 'v2.0.0',     branch: 'tag'  },
    ];

    const edges = [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 1, to: 4 },
        { from: 4, to: 5 },
    ];

    const visibleCount = Math.round((completedCount / STAGES.length) * nodes.length);

    return (
        <div className="overflow-x-auto">
            <svg width="400" height="110" viewBox="0 0 400 110" className="mx-auto">
                {/* Edges */}
                {edges.map((e, i) => {
                    const from = nodes[e.from];
                    const to = nodes[e.to];
                    const visible = e.from < visibleCount && e.to < visibleCount;
                    return (
                        <line
                            key={i}
                            x1={from.x} y1={from.y}
                            x2={to.x} y2={to.y}
                            stroke={visible ? '#334155' : '#1e293b'}
                            strokeWidth="2"
                            strokeDasharray={visible ? '0' : '4 4'}
                            style={{ transition: 'stroke 0.4s' }}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((n, i) => {
                    const visible = i < visibleCount;
                    const isTag = n.branch === 'tag';
                    return (
                        <g key={i} style={{ transition: 'opacity 0.4s', opacity: visible ? 1 : 0.2 }}>
                            {isTag ? (
                                <polygon
                                    points={`${n.x},${n.y - 9} ${n.x + 8},${n.y} ${n.x},${n.y + 9} ${n.x - 8},${n.y}`}
                                    fill={visible ? n.color : '#1e293b'}
                                    stroke={visible ? `${n.color}80` : 'transparent'}
                                    strokeWidth="2"
                                    style={{ filter: visible ? `drop-shadow(0 0 6px ${n.color}99)` : 'none', transition: 'all 0.4s' }}
                                />
                            ) : (
                                <circle
                                    cx={n.x} cy={n.y} r="8"
                                    fill={visible ? n.color : '#1e293b'}
                                    stroke={visible ? `${n.color}60` : '#1e293b'}
                                    strokeWidth="2"
                                    style={{ filter: visible ? `drop-shadow(0 0 5px ${n.color}80)` : 'none', transition: 'all 0.4s' }}
                                />
                            )}
                            <text
                                x={n.x} y={n.branch === 'feat' ? n.y + 22 : n.y - 16}
                                textAnchor="middle"
                                fill={visible ? '#94a3b8' : '#334155'}
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="600"
                                style={{ transition: 'fill 0.4s' }}
                            >
                                {n.label}
                            </text>
                        </g>
                    );
                })}

                {/* Branch labels */}
                <text x="24" y="20" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="700">main</text>
                <text x="148" y="100" fill="#06b6d4" fontSize="8" fontFamily="monospace" fontWeight="700">feat/login</text>
            </svg>
        </div>
    );
}

// ─── Pipeline Stage Card ──────────────────────────────────────────────────────

function StageCard({ stage, status, elapsed, isActive }) {
    const borderColor = {
        idle:    'var(--border-color)',
        running: '#06b6d4',
        passed:  '#10b981',
        failed:  '#f43f5e',
    }[status];

    const iconColor = {
        idle:    '#475569',
        running: '#06b6d4',
        passed:  '#10b981',
        failed:  '#f43f5e',
    }[status];

    const progress = status === 'running' ? Math.min(100, (elapsed / stage.duration) * 100) : status === 'passed' ? 100 : 0;

    return (
        <motion.div
            layout
            className="relative flex flex-col gap-2 rounded-xl p-3.5 border overflow-hidden"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor,
                boxShadow: status === 'running'
                    ? '0 0 12px #06b6d440'
                    : status === 'passed'
                    ? '0 0 8px #10b98130'
                    : status === 'failed'
                    ? '0 0 12px #f43f5e40'
                    : 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
        >
            {/* Progress bar fill bg */}
            {status === 'running' && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `linear-gradient(90deg, #06b6d408 0%, transparent 100%)` }}
                />
            )}

            {/* Icon + label row */}
            <div className="flex items-center gap-2.5">
                <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-sm"
                    style={{
                        backgroundColor: `${iconColor}18`,
                        color: iconColor,
                        transition: 'color 0.3s, background-color 0.3s',
                    }}
                >
                    {status === 'running' ? (
                        <motion.i
                            className={`fa-solid fa-spinner`}
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        />
                    ) : status === 'passed' ? (
                        <i className="fa-solid fa-check" />
                    ) : status === 'failed' ? (
                        <i className="fa-solid fa-xmark" />
                    ) : (
                        <i className={`fa-solid ${stage.icon}`} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary truncate">{stage.label}</p>
                    <p className="text-[10px] font-mono" style={{ color: iconColor, transition: 'color 0.3s' }}>
                        {status === 'idle' && 'waiting...'}
                        {status === 'running' && `${(elapsed / 1000).toFixed(1)}s`}
                        {status === 'passed' && `${(stage.duration / 1000).toFixed(1)}s`}
                        {status === 'failed' && 'FAILED'}
                    </p>
                </div>
                {status === 'running' && (
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: status === 'failed' ? '#f43f5e' : status === 'passed' ? '#10b981' : '#06b6d4',
                        transition: 'background-color 0.3s',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'linear' }}
                />
            </div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DevOpsMissionControl() {
    const { language } = useLanguage();

    // ── Tab & Cloud Target
    const [activeTab, setActiveTab] = useState('pipeline');
    const [cloudTarget, setCloudTarget] = useState('aws');

    // ── Pipeline State
    const [pipelineStatus, setPipelineStatus] = useState('idle');  // idle | running | done | failed
    const [activeStage, setActiveStage] = useState(-1);
    const [stageStatuses, setStageStatuses] = useState(STAGES.map(() => 'idle'));
    const [stageElapsed, setStageElapsed] = useState(STAGES.map(() => 0));
    const [simulateFailure, setSimulateFailure] = useState(false);
    const [retryFromStage, setRetryFromStage] = useState(-1);
    const [completedCount, setCompletedCount] = useState(0);

    // ── Logs State
    const [logs, setLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('ALL');
    const logsEndRef = useRef(null);
    const logIdRef = useRef(0);

    // ── Infrastructure State
    const [cpu, setCpu] = useState(8.2);
    const [mem, setMem] = useState(35.1);
    const uptime = 99.94;
    const [services, setServices] = useState(SERVICES_BASE.map(s => ({ ...s })));
    const [region, setRegion] = useState('us-east-1');

    // ── Pipeline timer refs
    const stageTimerRef = useRef(null);
    const elapsedTimerRef = useRef(null);

    // ── Helper: push a log line
    const pushLog = useCallback((tag, message) => {
        setLogs(prev => [
            ...prev,
            { id: logIdRef.current++, tag, message, time: new Date().toLocaleTimeString().slice(0, 8) },
        ]);
    }, []);

    // ── Helper: drip log lines for a stage
    const dripLines = useCallback((lines, tag, startDelay = 0) => {
        lines.forEach((line, i) => {
            setTimeout(() => {
                pushLog(tag, line);
            }, startDelay + i * 140);
        });
    }, [pushLog]);

    // ── Infrastructure drift
    useEffect(() => {
        const iv = setInterval(() => {
            setCpu(prev => {
                const drift = (Math.random() - 0.5) * 3;
                return Math.max(4, Math.min(95, prev + drift));
            });
            setMem(prev => {
                const drift = (Math.random() - 0.5) * 2;
                return Math.max(28, Math.min(80, prev + drift));
            });
            setServices(prev => prev.map(s => ({
                ...s,
                latency: s.latency === 0 ? 0 : Math.max(0, s.latency + Math.floor((Math.random() - 0.5) * 4)),
            })));
        }, 1800);
        return () => clearInterval(iv);
    }, []);

    // ── Pipeline stage runner
    const runStage = useCallback((stageIndex, fromRetry = false) => {
        if (stageIndex >= STAGES.length) return;

        const stage = STAGES[stageIndex];
        const tag = STAGE_TAG_MAP[stage.id];
        const lines = LOG_LINES[cloudTarget]?.[stage.id] ?? [];

        setActiveStage(stageIndex);
        setStageStatuses(prev => {
            const next = [...prev];
            next[stageIndex] = 'running';
            return next;
        });

        // Infra spikes
        if (stage.id === 'build') setCpu(72);
        if (stage.id === 'test') setMem(62);
        if (stage.id === 'docker') setCpu(65);

        // Drip log lines
        dripLines(lines, tag);

        // Elapsed ticker
        const startTime = Date.now();
        elapsedTimerRef.current = setInterval(() => {
            setStageElapsed(prev => {
                const next = [...prev];
                next[stageIndex] = Date.now() - startTime;
                return next;
            });
        }, 50);

        // Stage completion
        stageTimerRef.current = setTimeout(() => {
            clearInterval(elapsedTimerRef.current);

            // Should we fail?
            const failStages = [2, 3];
            const shouldFail = simulateFailure && failStages.includes(stageIndex) && !fromRetry;
            if (shouldFail) {
                setStageStatuses(prev => {
                    const next = [...prev];
                    next[stageIndex] = 'failed';
                    return next;
                });
                setRetryFromStage(stageIndex);
                setPipelineStatus('failed');
                setActiveStage(-1);
                dripLines(ERROR_LINES, 'ERROR', 200);
                // Settle infra
                setTimeout(() => { setCpu(prev => Math.max(8, prev - 40)); setMem(prev => Math.max(35, prev - 20)); }, 600);
                return;
            }

            // Passed
            setStageStatuses(prev => {
                const next = [...prev];
                next[stageIndex] = 'passed';
                return next;
            });
            setCompletedCount(stageIndex + 1);

            // Settle infra after build/test/docker
            if (['build', 'test', 'docker'].includes(stage.id)) {
                setTimeout(() => {
                    setCpu(prev => Math.max(8, prev - 35));
                    setMem(prev => Math.max(35, prev - 18));
                }, 400);
            }

            if (stageIndex + 1 < STAGES.length) {
                // Small gap between stages
                setTimeout(() => runStage(stageIndex + 1), 400);
            } else {
                // All done
                setPipelineStatus('done');
                setActiveStage(-1);
                pushLog('SUCCESS', `🚀 Successfully deployed to ${CLOUD_TARGETS.find(t => t.id === cloudTarget)?.label}! v2.0.0`);
            }
        }, stage.duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cloudTarget, simulateFailure, dripLines, pushLog]);

    const startPipeline = useCallback(() => {
        if (pipelineStatus === 'running') return;
        // Reset all
        clearTimeout(stageTimerRef.current);
        clearInterval(elapsedTimerRef.current);
        setStageStatuses(STAGES.map(() => 'idle'));
        setStageElapsed(STAGES.map(() => 0));
        setActiveStage(-1);
        setRetryFromStage(-1);
        setCompletedCount(0);
        setPipelineStatus('running');
        setLogs([]);
        logIdRef.current = 0;
        pushLog('BUILD', `Pipeline triggered → target: ${CLOUD_TARGETS.find(t => t.id === cloudTarget)?.label}`);
        setTimeout(() => runStage(0), 300);
    }, [pipelineStatus, cloudTarget, runStage, pushLog]);

    const retryPipeline = useCallback(() => {
        if (retryFromStage < 0) return;
        clearTimeout(stageTimerRef.current);
        clearInterval(elapsedTimerRef.current);
        setStageStatuses(prev => {
            const next = [...prev];
            next[retryFromStage] = 'idle';
            return next;
        });
        setStageElapsed(prev => {
            const next = [...prev];
            next[retryFromStage] = 0;
            return next;
        });
        setPipelineStatus('running');
        setRetryFromStage(-1);
        pushLog('BUILD', `Retrying from stage: ${STAGES[retryFromStage].label}...`);
        setTimeout(() => runStage(retryFromStage, true), 300);
    }, [retryFromStage, runStage, pushLog]);

    const resetPipeline = useCallback(() => {
        clearTimeout(stageTimerRef.current);
        clearInterval(elapsedTimerRef.current);
        setStageStatuses(STAGES.map(() => 'idle'));
        setStageElapsed(STAGES.map(() => 0));
        setActiveStage(-1);
        setRetryFromStage(-1);
        setCompletedCount(0);
        setPipelineStatus('idle');
        setLogs([]);
        logIdRef.current = 0;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeout(stageTimerRef.current);
            clearInterval(elapsedTimerRef.current);
        };
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Filtered logs
    const visibleLogs = logFilter === 'ALL'
        ? logs
        : logs.filter(l => l.tag === logFilter);

    // ── CPU color
    const cpuColor = cpu > 75 ? '#f43f5e' : cpu > 50 ? '#eab308' : '#10b981';
    const memColor = mem > 70 ? '#f43f5e' : mem > 55 ? '#eab308' : '#06b6d4';

    const tabs = [
        { id: 'pipeline',  label: 'Pipeline',       icon: 'fa-code-branch'   },
        { id: 'logs',      label: 'Logs',            icon: 'fa-terminal'      },
        { id: 'infra',     label: 'Infrastructure',  icon: 'fa-server'        },
    ];

    const regionServices = services.map(s => ({
        ...s,
        region: s.region === 'global' ? 'global' : region,
    }));

    return (
        <section id="devops-control" className="section-alt py-12 md:py-20">
            <SectionBackground variant="devops" />
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                {/* ── Section Header ── */}
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.span
                        className="inline-block text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full border mb-5"
                        style={{
                            color: '#10b981',
                            borderColor: '#10b98140',
                            backgroundColor: '#10b98110',
                        }}
                        whileInView={{ opacity: [0, 1], y: [10, 0] }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {'< DevOps Mission Control />'}
                    </motion.span>

                    <h2 className="text-3xl md:text-4xl font-black text-primary mb-4 leading-tight">
                        <SplitTextReveal>DevOps </SplitTextReveal>
                        <span className="text-accent">
                            <SplitTextReveal stagger={0.06}>Mission Control</SplitTextReveal>
                        </span>
                    </h2>

                    <p className="text-muted text-sm md:text-base max-w-xl mx-auto">
                        Watch a full CI/CD pipeline execute in real time — from commit to cloud.
                    </p>
                </motion.div>

                {/* ── Cloud Target Selector ── */}
                <motion.div
                    className="flex items-center justify-center gap-2 mb-8"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    <span className="text-xs font-bold text-muted uppercase tracking-widest mr-1">Target:</span>
                    {CLOUD_TARGETS.map(ct => (
                        <button
                            key={ct.id}
                            onClick={() => {
                                if (pipelineStatus !== 'running') {
                                    setCloudTarget(ct.id);
                                    resetPipeline();
                                }
                            }}
                            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
                            style={{
                                backgroundColor: cloudTarget === ct.id ? '#10b981' : 'var(--bg-card)',
                                color: cloudTarget === ct.id ? '#fff' : 'var(--text-primary)',
                                border: `1px solid ${cloudTarget === ct.id ? '#10b981' : 'var(--border-color)'}`,
                                boxShadow: cloudTarget === ct.id ? '0 0 12px #10b98140' : 'none',
                            }}
                        >
                            {ct.label}
                        </button>
                    ))}
                </motion.div>

                {/* ── Tab Pills ── */}
                <motion.div
                    className="flex items-center justify-center gap-2 mb-6"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200"
                            style={{
                                backgroundColor: activeTab === tab.id ? '#10b98120' : 'var(--bg-card)',
                                color: activeTab === tab.id ? '#10b981' : 'var(--text-primary)',
                                border: `1px solid ${activeTab === tab.id ? '#10b98160' : 'var(--border-color)'}`,
                            }}
                        >
                            <i className={`fa-solid ${tab.icon} text-[10px]`} />
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">

                    {/* ════════════════════════ TAB: PIPELINE ════════════════════════ */}
                    {activeTab === 'pipeline' && (
                        <motion.div
                            key="pipeline"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-5"
                        >
                            {/* Stage Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {STAGES.map((stage, i) => (
                                    <StageCard
                                        key={stage.id}
                                        stage={stage}
                                        status={stageStatuses[i]}
                                        elapsed={stageElapsed[i]}
                                        isActive={activeStage === i}
                                    />
                                ))}
                            </div>

                            {/* Success Banner */}
                            <AnimatePresence>
                                {pipelineStatus === 'done' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.94 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.94 }}
                                        className="rounded-xl p-4 flex items-center gap-3 border"
                                        style={{
                                            backgroundColor: '#10b98112',
                                            borderColor: '#10b98150',
                                            boxShadow: '0 0 24px #10b98128',
                                        }}
                                    >
                                        <span className="text-2xl">🚀</span>
                                        <div>
                                            <p className="font-black text-sm" style={{ color: '#10b981' }}>
                                                Deployed to {CLOUD_TARGETS.find(t => t.id === cloudTarget)?.label}! v2.0.0
                                            </p>
                                            <p className="text-xs text-muted">All {STAGES.length} stages passed • Pipeline healthy</p>
                                        </div>
                                        <motion.span
                                            className="ml-auto text-xs font-bold px-3 py-1 rounded-full"
                                            style={{ backgroundColor: '#10b98120', color: '#10b981' }}
                                            animate={{ opacity: [1, 0.6, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.8 }}
                                        >
                                            LIVE
                                        </motion.span>
                                    </motion.div>
                                )}

                                {/* Failure Banner */}
                                {pipelineStatus === 'failed' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.94 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.94 }}
                                        className="rounded-xl p-4 flex items-center gap-3 border"
                                        style={{
                                            backgroundColor: '#f43f5e12',
                                            borderColor: '#f43f5e50',
                                            boxShadow: '0 0 20px #f43f5e20',
                                        }}
                                    >
                                        <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f43f5e', fontSize: '1.2rem' }} />
                                        <div>
                                            <p className="font-black text-sm" style={{ color: '#f43f5e' }}>
                                                Pipeline Failed at {STAGES[retryFromStage]?.label}
                                            </p>
                                            <p className="text-xs text-muted">CVE detected — fix vulnerabilities and retry</p>
                                        </div>
                                        <button
                                            onClick={retryPipeline}
                                            className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full transition"
                                            style={{ backgroundColor: '#f43f5e20', color: '#f43f5e', border: '1px solid #f43f5e50' }}
                                        >
                                            <i className="fa-solid fa-rotate-right mr-1.5" />
                                            Retry
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Git Graph */}
                            <div
                                className="rounded-xl border p-4"
                                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                            >
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
                                    <i className="fa-solid fa-code-branch mr-1.5" />
                                    Git Graph
                                </p>
                                <GitGraph completedCount={completedCount} />
                            </div>

                            {/* Controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={startPipeline}
                                    disabled={pipelineStatus === 'running'}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#10b981',
                                        color: '#fff',
                                        boxShadow: pipelineStatus !== 'running' ? '0 0 16px #10b98150' : 'none',
                                    }}
                                >
                                    {pipelineStatus === 'running' ? (
                                        <>
                                            <motion.i
                                                className="fa-solid fa-spinner"
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                            />
                                            Running…
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-play" />
                                            Deploy
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={resetPipeline}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                    }}
                                >
                                    <i className="fa-solid fa-arrow-rotate-left" />
                                    Reset
                                </button>

                                <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
                                    <div
                                        className="relative w-9 h-5 rounded-full transition-colors duration-200"
                                        style={{ backgroundColor: simulateFailure ? '#f43f5e' : '#1e293b' }}
                                        onClick={() => setSimulateFailure(v => !v)}
                                    >
                                        <motion.div
                                            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"
                                            animate={{ x: simulateFailure ? 16 : 0 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-muted">Simulate Failure</span>
                                </label>
                            </div>
                        </motion.div>
                    )}

                    {/* ════════════════════════ TAB: LOGS ════════════════════════ */}
                    {activeTab === 'logs' && (
                        <motion.div
                            key="logs"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-4"
                        >
                            {/* Filter Chips */}
                            <div className="flex flex-wrap items-center gap-2">
                                {['ALL', 'BUILD', 'TEST', 'SCAN', 'DOCKER', 'DEPLOY', 'ERROR'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setLogFilter(f)}
                                        className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                                        style={{
                                            backgroundColor: logFilter === f
                                                ? (LOG_COLORS[f] ?? '#10b981') + '22'
                                                : 'var(--bg-card)',
                                            color: logFilter === f
                                                ? (LOG_COLORS[f] ?? '#10b981')
                                                : '#64748b',
                                            border: `1px solid ${logFilter === f ? (LOG_COLORS[f] ?? '#10b981') + '60' : 'var(--border-color)'}`,
                                        }}
                                    >
                                        {f}
                                        {f !== 'ALL' && (
                                            <span className="ml-1 opacity-60">
                                                ({logs.filter(l => l.tag === f).length})
                                            </span>
                                        )}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setLogs([])}
                                    className="ml-auto px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                                    style={{
                                        backgroundColor: 'var(--bg-card)',
                                        color: '#64748b',
                                        border: '1px solid var(--border-color)',
                                    }}
                                >
                                    <i className="fa-solid fa-trash mr-1" />
                                    Clear
                                </button>
                            </div>

                            {/* Terminal */}
                            <div
                                className="rounded-xl border overflow-hidden"
                                style={{ borderColor: '#1e293b' }}
                            >
                                {/* Terminal titlebar */}
                                <div
                                    className="flex items-center gap-2 px-4 py-2.5 border-b"
                                    style={{ backgroundColor: '#0a1120', borderColor: '#1e293b' }}
                                >
                                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-slate-500 font-mono ml-2">
                                        pipeline.log — {CLOUD_TARGETS.find(t => t.id === cloudTarget)?.label}
                                    </span>
                                    {pipelineStatus === 'running' && (
                                        <span className="ml-auto flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            <span className="text-[10px] text-emerald-400 font-mono font-bold">LIVE</span>
                                        </span>
                                    )}
                                </div>

                                {/* Log lines */}
                                <div
                                    className="font-mono text-[11px] leading-relaxed p-4 overflow-y-auto"
                                    style={{
                                        backgroundColor: '#050a14',
                                        height: '400px',
                                        scrollBehavior: 'smooth',
                                    }}
                                >
                                    {visibleLogs.length === 0 ? (
                                        <p className="text-slate-600 italic">
                                            {logs.length === 0
                                                ? '# No logs yet. Click Deploy to start the pipeline...'
                                                : '# No lines matching the selected filter.'}
                                        </p>
                                    ) : (
                                        visibleLogs.map((log, i) => (
                                            <motion.div
                                                key={log.id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex gap-2 py-0.5 border-b"
                                                style={{ borderColor: '#0f172a' }}
                                            >
                                                <span className="text-slate-600 flex-shrink-0 select-none">[{log.time}]</span>
                                                <span
                                                    className="font-black flex-shrink-0 select-none"
                                                    style={{ color: LOG_COLORS[log.tag] ?? '#94a3b8', minWidth: '54px' }}
                                                >
                                                    [{log.tag}]
                                                </span>
                                                <span
                                                    className="break-all"
                                                    style={{
                                                        color: log.tag === 'ERROR'
                                                            ? '#f43f5e'
                                                            : log.tag === 'SUCCESS'
                                                            ? '#10b981'
                                                            : '#cbd5e1',
                                                        fontWeight: log.tag === 'SUCCESS' ? '700' : '400',
                                                    }}
                                                >
                                                    {log.message}
                                                </span>
                                            </motion.div>
                                        ))
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>

                            {/* Quick stats bar */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Total Lines', value: logs.length, color: '#94a3b8' },
                                    { label: 'Errors',      value: logs.filter(l => l.tag === 'ERROR').length,   color: '#f43f5e' },
                                    { label: 'Warnings',    value: logs.filter(l => l.tag === 'SCAN').length,    color: '#eab308' },
                                ].map(stat => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl border p-3 text-center"
                                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                                    >
                                        <p className="text-lg font-black tabular-nums" style={{ color: stat.color }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-[10px] text-muted font-semibold uppercase tracking-wide">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ════════════════════════ TAB: INFRASTRUCTURE ════════════════════════ */}
                    {activeTab === 'infra' && (
                        <motion.div
                            key="infra"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-5"
                        >
                            {/* Region Selector */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-muted uppercase tracking-widest">Region:</span>
                                {REGIONS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRegion(r)}
                                        className="px-3 py-1 rounded-full text-[11px] font-bold transition-all"
                                        style={{
                                            backgroundColor: region === r ? '#06b6d420' : 'var(--bg-card)',
                                            color: region === r ? '#06b6d4' : '#64748b',
                                            border: `1px solid ${region === r ? '#06b6d460' : 'var(--border-color)'}`,
                                        }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            {/* Gauge Arcs */}
                            <div
                                className="rounded-2xl border p-5"
                                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                            >
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">
                                    <i className="fa-solid fa-gauge-high mr-1.5" />
                                    System Metrics
                                </p>
                                <div className="grid grid-cols-3 gap-4 justify-items-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <ArcGauge
                                            label="CPU"
                                            value={cpu}
                                            max={100}
                                            color={cpuColor}
                                            unit="%"
                                        />
                                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: cpuColor }}>
                                            {cpu > 75 ? 'HIGH' : cpu > 50 ? 'MODERATE' : 'NORMAL'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <ArcGauge
                                            label="Memory"
                                            value={mem}
                                            max={100}
                                            color={memColor}
                                            unit="%"
                                        />
                                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: memColor }}>
                                            {mem > 70 ? 'HIGH' : mem > 55 ? 'MODERATE' : 'NORMAL'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <ArcGauge
                                            label="Uptime"
                                            value={uptime}
                                            max={100}
                                            color="#10b981"
                                            unit="%"
                                        />
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                                            HEALTHY
                                        </span>
                                    </div>
                                </div>

                                {/* Mini sparkline-style bars */}
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-muted font-semibold">CPU Usage</span>
                                            <span className="font-mono" style={{ color: cpuColor }}>{cpu.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: cpuColor }}
                                                animate={{ width: `${cpu}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-muted font-semibold">Memory</span>
                                            <span className="font-mono" style={{ color: memColor }}>{mem.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: memColor }}
                                                animate={{ width: `${mem}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Health Table */}
                            <div
                                className="rounded-2xl border overflow-hidden"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <div
                                    className="px-5 py-3 border-b flex items-center justify-between"
                                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-circle-check text-accent text-sm" />
                                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Service Health</span>
                                    </div>
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: '#10b98118', color: '#10b981' }}
                                    >
                                        {regionServices.filter(s => s.status === 'Online').length}/{regionServices.length} Online
                                    </span>
                                </div>

                                <div style={{ backgroundColor: 'var(--bg-primary)' }}>
                                    {/* Table Header */}
                                    <div
                                        className="grid grid-cols-4 px-5 py-2 border-b text-[10px] font-bold uppercase tracking-widest text-muted"
                                        style={{ borderColor: 'var(--border-color)' }}
                                    >
                                        <span>Service</span>
                                        <span>Status</span>
                                        <span>Latency</span>
                                        <span>Region</span>
                                    </div>

                                    {/* Rows */}
                                    {regionServices.map((svc, i) => (
                                        <motion.div
                                            key={svc.name}
                                            className="grid grid-cols-4 px-5 py-3 border-b text-xs items-center"
                                            style={{ borderColor: 'var(--border-color)' }}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06, duration: 0.3 }}
                                        >
                                            <span className="font-semibold text-primary">{svc.name}</span>

                                            <span className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                </span>
                                                <span className="text-accent font-semibold">{svc.status}</span>
                                            </span>

                                            <span className="font-mono text-muted">
                                                {svc.latency === 0 ? (
                                                    <span style={{ color: '#10b981' }}>{'< 1ms'}</span>
                                                ) : (
                                                    <span style={{ color: svc.latency > 20 ? '#eab308' : '#10b981' }}>
                                                        {svc.latency}ms
                                                    </span>
                                                )}
                                            </span>

                                            <span className="font-mono text-muted text-[10px]">{svc.region}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Deployment Timeline Summary */}
                            <div
                                className="rounded-2xl border p-5 space-y-3"
                                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                            >
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                                    <i className="fa-solid fa-timeline mr-1.5" />
                                    Deployment Summary
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Last Deploy',    value: '2m ago',  icon: 'fa-clock',        color: '#10b981' },
                                        { label: 'Build Time',     value: '12.4s',   icon: 'fa-hammer',       color: '#06b6d4' },
                                        { label: 'Coverage',       value: '94.2%',   icon: 'fa-vial',         color: '#8b5cf6' },
                                        { label: 'Rollbacks',      value: '0',       icon: 'fa-rotate-left',  color: '#eab308' },
                                    ].map(stat => (
                                        <div
                                            key={stat.label}
                                            className="rounded-xl border p-3 text-center"
                                            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                                        >
                                            <i className={`fa-solid ${stat.icon} text-sm mb-1.5 block`} style={{ color: stat.color }} />
                                            <p className="text-base font-black tabular-nums" style={{ color: stat.color }}>
                                                {stat.value}
                                            </p>
                                            <p className="text-[10px] text-muted font-semibold uppercase tracking-wide mt-0.5">
                                                {stat.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </section>
    );
}
