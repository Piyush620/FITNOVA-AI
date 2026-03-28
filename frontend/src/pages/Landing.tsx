  import React from 'react';
  import { useNavigate } from 'react-router-dom';
  import { Button, Card } from '../components/Common';
  import { MainLayout } from '../components/Layout';
  import { useAuth } from '../hooks/useAuth';

  const features = [
    {
      eyebrow: 'Workout Engine',
      title: 'Plans that adapt to your level',
      description:
        'Generate progressive routines based on your goal, training days, equipment, and recovery pace.',
    },
    {
      eyebrow: 'Nutrition Coach',
      title: 'Meals built around real preferences',
      description:
        'Create practical diet plans with calorie targets, food preferences, and a budget that fits your routine.',
    },
    {
      eyebrow: 'AI Guidance',
      title: 'Coach support when you need it',
      description:
        'Ask questions, review progress, and get training guidance without leaving the app.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create your profile',
      description: 'Set your experience level, goals, and starting point in a few quick inputs.',
    },
    {
      number: '02',
      title: 'Generate a plan',
      description: 'Use the AI planner to create a workout split and meal plan tailored to your week.',
    },
    {
      number: '03',
      title: 'Track every session',
      description: 'Mark workouts and meals complete so your dashboard reflects real progress.',
    },
    {
      number: '04',
      title: 'Adjust as you improve',
      description: 'Refine the plan with the coach as your goals, schedule, or performance changes.',
    },
  ];

  export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
      <MainLayout>
        <div className="w-full space-y-16 sm:space-y-20">
          <section className="theme-landing-hero relative overflow-hidden rounded-[2rem] border px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.16),transparent_24%)]" />
            <div className="pointer-events-none absolute right-[-6rem] top-[-4rem] h-56 w-56 rounded-full border border-white/10 opacity-50" />
            <div className="pointer-events-none absolute bottom-[-5rem] left-[42%] h-44 w-44 rounded-full border border-[#00FF88]/20" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-10 xl:gap-12">
            <div className="space-y-7 lg:pr-3 xl:pr-4">
                <div className="theme-landing-pill inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                  Smart training and nutrition, all week
                </div>

              <div className="space-y-4">
                <h1 className="theme-landing-title max-w-[11ch] text-[clamp(2.9rem,6.3vw,5.4rem)] font-black leading-[0.94] tracking-[-0.045em]">
                  Build a
                  <span className="theme-landing-gradient block bg-clip-text text-transparent">
                    stronger weekly
                  </span>
                  fitness system.
                </h1>
                <p className="theme-landing-copy max-w-xl text-base leading-8 sm:text-lg">
                  FitNova brings workouts, meal planning, and coach guidance into one focused dashboard so
                  your next action is always clear and your progress stays visible.
                </p>
              </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {isAuthenticated ? (
                    <>
                      <Button size="lg" className="sm:min-w-44" onClick={() => navigate('/dashboard')}>
                        Open Dashboard
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="sm:min-w-44"
                        onClick={() => navigate('/diet')}
                      >
                        View Diet Plans
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" className="sm:min-w-44" onClick={() => navigate('/signup')}>
                        Start Free
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="sm:min-w-44"
                        onClick={() => navigate('/login')}
                      >
                        Sign In
                      </Button>
                    </>
                  )}
                </div>

                <div className="theme-landing-divider grid gap-4 border-t pt-6 sm:grid-cols-3">
                <div className="theme-landing-metric min-w-0 rounded-2xl p-4">
                  <p className="theme-landing-stat text-3xl font-semibold">3 core engines</p>
                  <p className="theme-landing-copy-soft mt-1 text-sm">Workouts, diet plans, and coach intelligence.</p>
                </div>
                  <div className="theme-landing-metric min-w-0 rounded-2xl p-4">
                    <p className="theme-landing-stat text-3xl font-semibold">Live tracking</p>
                    <p className="theme-landing-copy-soft mt-1 text-sm">Turn every completed meal and session into visible momentum.</p>
                  </div>
                  <div className="theme-landing-metric min-w-0 rounded-2xl p-4">
                    <p className="theme-landing-stat text-3xl font-semibold">Goal-first</p>
                    <p className="theme-landing-copy-soft mt-1 text-sm">Plans bend around your target, routine, age, and pace.</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="theme-landing-glow absolute inset-x-8 -top-6 h-32 rounded-full blur-3xl" />
                <Card variant="glass" className="theme-landing-showcase relative overflow-hidden border-white/10 bg-white/5 p-0">
                  <div className="relative min-h-[520px] overflow-hidden">
                    <div className="theme-landing-showcase-shell absolute inset-0" />
                    <div className="noise-overlay absolute inset-0" />
                    <div className="theme-landing-showcase-orb-left pointer-events-none absolute left-[-2rem] top-12 h-64 w-64 rounded-full border opacity-60" />
                    <div className="theme-landing-showcase-orb-right pointer-events-none absolute right-[-3rem] top-[-1rem] h-56 w-56 rounded-full border opacity-70" />
                    <div className="theme-landing-showcase-line-strong pointer-events-none absolute left-[12%] top-[22%] h-px w-[46%] rotate-[34deg]" />
                    <div className="theme-landing-showcase-line-soft pointer-events-none absolute left-[-3%] top-[42%] h-px w-[78%] -rotate-[34deg]" />
                    <div className="theme-landing-showcase-frame pointer-events-none absolute right-[8%] top-[16%] h-[240px] w-[240px] rounded-[36px] border backdrop-blur-sm" />

                    <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
                      <div className="theme-media-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                        AI Command View
                      </div>
                      <div className="theme-status-pill rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                        Live
                      </div>
                    </div>

                    <div className="absolute inset-x-5 bottom-5 space-y-4">
                      <div className="theme-media-panel rounded-[1.6rem] border p-5 backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="theme-media-copy text-sm font-medium">This week</p>
                            <h2 className="theme-media-heading mt-1 text-2xl font-semibold">Focused performance plan</h2>
                          </div>
                          <div className="theme-status-pill rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                            Active
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                          <p className="theme-media-copy text-xs uppercase tracking-[0.2em]">Split</p>
                          <p className="theme-media-heading mt-2 text-xl font-semibold">4 days</p>
                          <p className="theme-media-copy mt-1 text-sm">Strength + conditioning</p>
                        </div>
                        <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                          <p className="theme-media-copy text-xs uppercase tracking-[0.2em]">Nutrition</p>
                          <p className="theme-media-heading mt-2 text-xl font-semibold">2,250 kcal</p>
                          <p className="theme-media-copy mt-1 text-sm">Balanced macro push</p>
                        </div>
                        <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                          <p className="theme-media-copy text-xs uppercase tracking-[0.2em]">Coach cue</p>
                          <p className="theme-media-heading mt-2 text-xl font-semibold">Push day 2</p>
                          <p className="theme-media-copy mt-1 text-sm">Recovery trend looks strong</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="theme-media-panel rounded-2xl border p-4 backdrop-blur">
                          <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Pipeline</p>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="theme-landing-progress-track h-2 flex-1 rounded-full">
                              <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,#00FF88_0%,#cab8ff_100%)]" />
                            </div>
                            <span className="theme-landing-progress-value text-sm font-semibold">68%</span>
                          </div>
                          <p className="theme-media-copy mt-2 text-sm">Plan generation, meals, and coaching all in one flow.</p>
                        </div>
                        <div className="theme-media-panel theme-media-panel-accent rounded-2xl border p-4 backdrop-blur">
                          <p className="theme-media-copy text-xs uppercase tracking-[0.18em]">Response time</p>
                          <p className="theme-media-heading mt-2 text-2xl font-semibold">Under 2 min</p>
                          <p className="theme-media-accent-copy mt-2 text-sm leading-6">
                            Move from sign-up to a usable weekly plan without digging through menus.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">Why it works</p>
                <h2 className="text-3xl font-semibold text-[#F7F7F7] sm:text-4xl">A tighter system, not random tools</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-[#9ca3b5] sm:text-base">
                Every screen should help you either plan, execute, or review. That is the product direction the UI is
                now following.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={feature.title} variant="gradient" className="space-y-5 p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-semibold text-[#F7F7F7]">
                    0{index + 1}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FF88]">{feature.eyebrow}</p>
                    <h3 className="text-2xl font-semibold text-[#F7F7F7]">{feature.title}</h3>
                  </div>
                  <p className="text-base leading-8 text-[#b7bcc9]">{feature.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card variant="glass" className="space-y-4 border-white/10 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">Built for momentum</p>
              <h2 className="text-3xl font-semibold text-[#F7F7F7]">See what to do next without digging around.</h2>
              <p className="text-base leading-8 text-[#b7bcc9]">
                The experience should feel calm and decisive. Clean spacing, stronger hierarchy, and clear actions make
                the app easier to trust and easier to use every day.
              </p>
              <div className="rounded-2xl border border-[#2e303a] bg-[#0f1218] p-5">
                <p className="text-sm font-medium text-white">What this means in practice</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[#a9b0c2]">
                  <li>Real plan creation and tracking instead of static mock sections.</li>
                  <li>Buttons that behave consistently across all pages.</li>
                  <li>Layouts that keep content aligned on both desktop and mobile.</li>
                </ul>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map((step) => (
                <Card key={step.number} variant="default" className="space-y-4 border-[#232734] bg-[linear-gradient(180deg,#11131b_0%,#0f1117_100%)] p-7 transition-transform duration-300 hover:-translate-y-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">{step.number}</p>
                  <h3 className="text-xl font-semibold text-[#F7F7F7]">{step.title}</h3>
                  <p className="text-sm leading-7 text-[#9ca3b5]">{step.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="theme-landing-cta relative overflow-hidden rounded-[2rem] border px-6 py-10 text-center sm:px-8 sm:py-12">
            <div className="theme-landing-cta-glow pointer-events-none absolute inset-0" />
            <div className="mx-auto max-w-3xl space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">Ready when you are</p>
              <h2 className="theme-landing-cta-title text-3xl font-semibold sm:text-4xl">Start with one account and build a real routine.</h2>
              <p className="theme-landing-cta-copy text-base leading-8">
                Create your first plan, track progress in real time, and let the coach help you stay consistent.
              </p>
              <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
                {isAuthenticated ? (
                  <>
                    <Button size="lg" className="sm:min-w-48" onClick={() => navigate('/dashboard')}>
                      Open Dashboard
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="sm:min-w-48"
                      onClick={() => navigate('/coach')}
                    >
                      Ask AI Coach
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" className="sm:min-w-48" onClick={() => navigate('/signup')}>
                      Create Account
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="sm:min-w-48"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </MainLayout>
    );
  };
