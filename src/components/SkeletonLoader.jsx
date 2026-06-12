import React from 'react';

export default function SkeletonLoader() {
    return (
        <div className="section-dark min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    <span className="text-accent font-semibold text-lg">Loading...</span>
                </div>
                <div className="flex gap-2 justify-center">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-2 w-2 rounded-full bg-accent animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

