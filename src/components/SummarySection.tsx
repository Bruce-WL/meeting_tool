import React from 'react';
import { Target, Cpu, Palette, Sparkles, Users, Shield, LucideIcon } from 'lucide-react';
import { SummaryGroup } from '../types/meeting';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Target: Target,
  Cpu: Cpu,
  Palette: Palette,
  Sparkles: Sparkles,
  Users: Users,
  Shield: Shield,
};

const colorStyles: Record<
  string,
  {
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconText: string;
  }
> = {
  indigo: {
    border: 'border-indigo-100',
    bg: 'bg-indigo-50/70',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    iconBg: 'bg-white',
    iconText: 'text-indigo-600',
  },
  sky: {
    border: 'border-sky-100',
    bg: 'bg-sky-50/70',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700',
    iconBg: 'bg-white',
    iconText: 'text-sky-600',
  },
  amber: {
    border: 'border-amber-100',
    bg: 'bg-amber-50/70',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    iconBg: 'bg-white',
    iconText: 'text-amber-600',
  },
  emerald: {
    border: 'border-emerald-100',
    bg: 'bg-emerald-50/70',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    iconBg: 'bg-white',
    iconText: 'text-emerald-600',
  },
  rose: {
    border: 'border-rose-100',
    bg: 'bg-rose-50/70',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    iconBg: 'bg-white',
    iconText: 'text-rose-600',
  },
  violet: {
    border: 'border-violet-100',
    bg: 'bg-violet-50/70',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-700',
    iconBg: 'bg-white',
    iconText: 'text-violet-600',
  },
};

interface SummarySectionProps {
  overview?: string;
  groups: SummaryGroup[];
  showHeader?: boolean;
  details?: { key: string; description: string }[];
  boxed?: boolean;
}

const SummarySection: React.FC<SummarySectionProps> = ({ overview, groups, showHeader = true, details, boxed = true }) => {
  return (
    <div className="space-y-8">
      {boxed ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-8 shadow-sm">
          {showHeader && (
            <>
              <div className="flex items-center gap-3">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                <h2 className="text-xl font-bold text-gray-900">总结</h2>
              </div>

              {overview && (
                <p className="text-sm text-gray-600">{overview}</p>
              )}
            </>
          )}

          {groups.map((group, groupIdx) => (
            <div key={group.id || `group-${groupIdx}`} className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">{group.title}</h3>
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                {(group.modules || []).map((module, moduleIdx) => {
                  const IconComponent = iconMap[module.icon] || Target;
                  const styles = colorStyles[module.color] || colorStyles.indigo;

                  return (
                    <div
                      key={module.id || `module-${groupIdx}-${moduleIdx}`}
                      className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col ${styles.border} ${styles.bg}`}
                    >
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                            <IconComponent className={`w-5 h-5 ${styles.iconText}`} />
                          </div>
                          <h4 className="font-semibold text-gray-900">{module.title}</h4>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
                          {module.type}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-gray-200/80 mx-5"></div>

                      <div className="p-5 pt-4 flex-grow">
                        <ul className="space-y-3">
                          {module.points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                              <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {showHeader && (
            <>
              <div className="flex items-center gap-3">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                <h2 className="text-xl font-bold text-gray-900">总结</h2>
              </div>
              {overview && (
                <p className="text-sm text-gray-600">{overview}</p>
              )}
            </>
          )}

          <div className="space-y-8">
            {groups.map((group, groupIdx) => (
              <div key={group.id || `group-${groupIdx}`} className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">{group.title}</h3>
                <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                  {(group.modules || []).map((module, moduleIdx) => {
                    const IconComponent = iconMap[module.icon] || Target;
                    const styles = colorStyles[module.color] || colorStyles.indigo;

                    return (
                      <div
                        key={module.id || `module-${groupIdx}-${moduleIdx}`}
                        className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col ${styles.border} ${styles.bg}`}
                      >
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                              <IconComponent className={`w-5 h-5 ${styles.iconText}`} />
                            </div>
                            <h4 className="font-semibold text-gray-900">{module.title}</h4>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles.badgeBg} ${styles.badgeText}`}>
                            {module.type}
                          </span>
                        </div>

                        <div className="border-t border-dashed border-gray-200/80 mx-5"></div>

                        <div className="p-5 pt-4 flex-grow">
                          <ul className="space-y-3">
                            {module.points.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                                <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {details && details.length > 0 && (
        <div className="space-y-4">
          {details.map((detail, idx) => (
            <div key={`${detail.key}-${idx}`} className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{detail.key}</h4>
                <p className="text-sm text-gray-600 leading-relaxed mt-1">{detail.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SummarySection;
