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
        <section className="relative overflow-hidden rounded-[2rem] border border-[#2e303a] bg-[#090909] px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,136,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_24%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-[#2e303a] bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b8c0d2]">
                AI fitness planning for the full week
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#F7F7F7] sm:text-5xl lg:text-6xl">
                  Train smarter,
                  <span className="block text-[#00FF88]">fuel better,</span>
                  and stay consistent.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[#b7bcc9] sm:text-lg">
                  FitNova brings your workouts, diet planning, and coach guidance into one focused system so
                  progress feels clear instead of chaotic.
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

              <div className="grid gap-4 border-t border-[#1d2029] pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-3xl font-semibold text-[#F7F7F7]">3 core tools</p>
                  <p className="mt-1 text-sm text-[#8f97ab]">Workout plans, diet plans, coach chat.</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-[#F7F7F7]">Live tracking</p>
                  <p className="mt-1 text-sm text-[#8f97ab]">Mark sessions and meals as you complete them.</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-[#F7F7F7]">Goal-first</p>
                  <p className="mt-1 text-sm text-[#8f97ab]">Plans adapt to your target, routine, and pace.</p>
                </div>
              </div>
            </div>

            <Card variant="glass" className="overflow-hidden border-white/10 bg-white/5 p-0">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#8f97ab]">This week</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Focused performance plan</h2>
                  </div>
                  <div className="rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FF88]">
                    Active
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div className="rounded-2xl border border-[#2e303a] bg-[#0f1218] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Workout split</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-[#8f97ab]">4 days</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 text-sm">
                      <span className="text-[#dfe4ee]">Upper body strength</span>
                      <span className="text-[#00FF88]">Done</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 text-sm">
                      <span className="text-[#dfe4ee]">Lower body power</span>
                      <span className="text-[#f7f7f7]">Today</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 text-sm">
                      <span className="text-[#dfe4ee]">Conditioning and core</span>
                      <span className="text-[#8f97ab]">Upcoming</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#2e303a] bg-[#0f1218] p-4">
                    <p className="text-sm font-medium text-white">Nutrition target</p>
                    <p className="mt-3 text-3xl font-semibold text-[#F7F7F7]">2,250</p>
                    <p className="mt-1 text-sm text-[#8f97ab]">calories with balanced macros</p>
                  </div>
                  <div className="rounded-2xl border border-[#2e303a] bg-[#0f1218] p-4">
                    <p className="text-sm font-medium text-white">Coach insight</p>
                    <p className="mt-3 text-sm leading-7 text-[#b7bcc9]">
                      Recovery looks strong this week. Push intensity on training day two and keep protein
                      consistent.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
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
              <Card key={step.number} variant="default" className="space-y-4 border-[#232734] bg-[#0f1117] p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">{step.number}</p>
                <h3 className="text-xl font-semibold text-[#F7F7F7]">{step.title}</h3>
                <p className="text-sm leading-7 text-[#9ca3b5]">{step.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#2e303a] bg-[linear-gradient(135deg,#11131d_0%,#0b0b0b_55%,#0f2c22_100%)] px-6 py-10 text-center sm:px-8 sm:py-12">
          <div className="mx-auto max-w-3xl space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#00FF88]">Ready when you are</p>
            <h2 className="text-3xl font-semibold text-[#F7F7F7] sm:text-4xl">Start with one account and build a real routine.</h2>
            <p className="text-base leading-8 text-[#c6cbda]">
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
                    Open Dashboard
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
