import React from 'react';

export default function SectionBackground({ variant }) {
    // Wrapper handles the common absolute positioning, z-index, and screen-reader hiding
    const Wrapper = ({ children }) => (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
            {children}
        </div>
    );

    switch (variant) {
        case 'services':
            // Floating Hexagon Grid
            return (
                <Wrapper>
                    <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMDIiIHZpZXdCb3g9IjAgMCA2MCAxMDIiPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGcgZmlsbD0iIzEwYjk4MSIgZmlsbC1vcGFjaXR5PSIxIj48cGF0aCBkPSJNMzAgMjlsMTUtOGwxNSA4djE3bC0xNSA4LTE1LTh2LTE3em0wLTU4bDE1LThsMTUgOHYxN2wtMTUgOC0xNS04di0xN3ptMCA4N2wxNS04bDE1IDh2MTdsLTE1IDgtMTUtOHYtMTd6TTExIDEyLjVsMTUtOGwxNSA4djE3bC0xNSA4LTE1LTh2LTE3em0wIDg3bDE1LThsMTUgOHYxN2wtMTUgOC0xNS04di0xN3ptMC01OGwxNS04bDE1IDh2MTdsLTE1IDgtMTUtOHYtMTd6Ii8+PC9nPjwvZz48L3N2Zz4=')] animate-[hex-drift_60s_linear_infinite]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-secondary)]" />
                </Wrapper>
            );

        case 'skills':
            // Circuit Board Traces
            return (
                <Wrapper>
                    <svg className="absolute w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
                                <path d="M10 10h20v20h20M50 10v20h20v20M10 50h20v20h20M90 10v20h-20v20" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5,10" className="animate-[circuit-pulse_20s_linear_infinite]" />
                                <circle cx="10" cy="10" r="3" fill="#10b981" />
                                <circle cx="50" cy="50" r="3" fill="#10b981" />
                                <circle cx="90" cy="90" r="3" fill="#10b981" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#circuit)" />
                    </svg>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
                </Wrapper>
            );

        case 'code':
            // Matrix Rain (CSS)
            const cols = Array.from({ length: 40 });
            return (
                <Wrapper>
                    <div className="flex justify-between h-[200%] w-full opacity-5 font-mono text-emerald-500 text-sm overflow-hidden">
                        {cols.map((_, i) => (
                            <div 
                                key={i} 
                                className="animate-[matrix-fall_linear_infinite]"
                                style={{ 
                                    animationDuration: `${Math.random() * 5 + 5}s`, 
                                    animationDelay: `${Math.random() * -10}s` 
                                }}
                            >
                                {Array.from({ length: 30 }).map((_, j) => (
                                    <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]" />
                </Wrapper>
            );

        case 'projects':
            // Blueprint Grid
            return (
                <Wrapper>
                    <div className="absolute inset-0 opacity-[0.03]"
                         style={{
                             backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
                             backgroundSize: '40px 40px'
                         }}
                    />
                    <div className="absolute inset-0 opacity-[0.08]"
                         style={{
                             backgroundImage: `radial-gradient(circle, #06b6d4 2px, transparent 2.5px)`,
                             backgroundSize: '160px 160px',
                             backgroundPosition: '-2px -2px'
                         }}
                    />
                </Wrapper>
            );

        case 'ai-lab':
            // Neural Network Constellation
            return (
                <Wrapper>
                     <svg className="absolute w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="neural" width="200" height="200" patternUnits="userSpaceOnUse">
                                <path d="M50 50L150 150M150 50L50 150M100 0L100 200M0 100L200 100" stroke="#a855f7" strokeWidth="1" opacity="0.5" />
                                <circle cx="50" cy="50" r="4" fill="#06b6d4" className="animate-[node-pulse_3s_ease-in-out_infinite_alternate]" />
                                <circle cx="150" cy="150" r="6" fill="#a855f7" className="animate-[node-pulse_4s_ease-in-out_infinite_alternate]" style={{animationDelay: '1s'}} />
                                <circle cx="150" cy="50" r="5" fill="#10b981" className="animate-[node-pulse_3.5s_ease-in-out_infinite_alternate]" style={{animationDelay: '0.5s'}}/>
                                <circle cx="50" cy="150" r="4" fill="#06b6d4" className="animate-[node-pulse_2.5s_ease-in-out_infinite_alternate]" style={{animationDelay: '1.5s'}}/>
                                <circle cx="100" cy="100" r="8" fill="#a855f7" className="animate-[node-pulse_5s_ease-in-out_infinite_alternate]" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#neural)" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]" />
                </Wrapper>
            );

        case 'algorithms':
            // Binary Tree / Graph Nodes
            return (
                <Wrapper>
                    <svg className="absolute w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="algo" width="300" height="300" patternUnits="userSpaceOnUse">
                                <path d="M150 20 L50 120 M150 20 L250 120 M50 120 L10 220 M50 120 L90 220 M250 120 L210 220 M250 120 L290 220" stroke="#06b6d4" strokeWidth="2" fill="none" />
                                <circle cx="150" cy="20" r="8" fill="#10b981" />
                                <circle cx="50" cy="120" r="6" fill="#06b6d4" />
                                <circle cx="250" cy="120" r="6" fill="#06b6d4" />
                                <circle cx="10" cy="220" r="4" fill="#64748b" />
                                <circle cx="90" cy="220" r="4" fill="#64748b" />
                                <circle cx="210" cy="220" r="4" fill="#64748b" />
                                <circle cx="290" cy="220" r="4" fill="#64748b" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#algo)" />
                    </svg>
                </Wrapper>
            );

        case 'cv':
            // Document Lines
            return (
                <Wrapper>
                    <div className="absolute inset-0 opacity-[0.04]"
                         style={{
                             backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)`
                         }}
                    />
                    <div className="absolute top-0 bottom-0 left-[8%] w-[2px] bg-rose-500 opacity-10" />
                </Wrapper>
            );

        case 'devops':
            // Server Rack LEDs
            const leds = Array.from({ length: 150 });
            return (
                <Wrapper>
                    <div className="absolute inset-0 opacity-[0.15] flex flex-wrap gap-4 p-8 content-start justify-center">
                        {leds.map((_, i) => {
                            const color = Math.random() > 0.9 ? 'bg-rose-500' : Math.random() > 0.7 ? 'bg-amber-400' : 'bg-emerald-500';
                            return (
                                <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-sm ${color} animate-[led-blink_2s_infinite]`}
                                    style={{ animationDelay: `${Math.random() * 2}s`, animationDuration: `${Math.random() * 2 + 1}s` }}
                                />
                            );
                        })}
                    </div>
                </Wrapper>
            );

        case 'certifications':
            // Award Sparkle
            return (
                <Wrapper>
                    <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
                    <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent" />
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div 
                                key={i}
                                className="absolute w-1 h-1 bg-amber-400 rotate-45 animate-[sparkle-float_10s_linear_infinite]"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * -10}s`,
                                    animationDuration: `${Math.random() * 10 + 10}s`
                                }}
                            />
                        ))}
                    </div>
                </Wrapper>
            );

        case 'cta':
            // Pulse Rings
            return (
                <Wrapper>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-emerald-500 rounded-full animate-[radar-ping_4s_infinite]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500 rounded-full animate-[radar-ping_4s_infinite]" style={{animationDelay: '1s'}} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500 rounded-full animate-[radar-ping_4s_infinite]" style={{animationDelay: '2s'}} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-emerald-500 rounded-full animate-[radar-ping_4s_infinite]" style={{animationDelay: '3s'}} />
                    </div>
                </Wrapper>
            );

        case 'contact':
            // Connection Dots
            return (
                <Wrapper>
                     <div className="absolute inset-0 opacity-[0.05]"
                         style={{
                             backgroundImage: `radial-gradient(circle at center, #10b981 2px, transparent 2px), linear-gradient(135deg, transparent 49%, #10b981 49%, #10b981 51%, transparent 51%)`,
                             backgroundSize: '60px 60px, 60px 60px'
                         }}
                    />
                </Wrapper>
            );

        default:
            return null;
    }
}
