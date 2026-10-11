import { type ButtonHTMLAttributes, type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  useHealthCheck,
  getHealthCheckQueryKey,
  useGetDashboard,
  getGetDashboardQueryKey,
  useGetProfile,
  getGetProfileQueryKey,
  useUpdateProfile,
  useGetTasks,
  getGetTasksQueryKey,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useGetProjects,
  getGetProjectsQueryKey,
  useGetSavedProjects,
  getGetSavedProjectsQueryKey,
  useSaveProject,
  useRemoveSavedProject,
  useGetInternships,
  getGetInternshipsQueryKey,
} from '@workspace/api-client-react';
import type { Task } from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowDownRight, ArrowRight, Bookmark, BriefcaseBusiness, Check, CheckCircle2,
  ChevronRight, Circle, Compass, Cpu, GraduationCap, LayoutDashboard, LoaderCircle,
  Menu, Pencil, Plus, Search, Sparkles, Target, Trash2, X, Zap,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Learning tasks', icon: CheckCircle2 },
  { href: '/projects', label: 'Project ideas', icon: Cpu },
  { href: '/internships', label: 'Opportunities', icon: BriefcaseBusiness },
  { href: '/profile', label: 'My profile', icon: GraduationCap },
];

function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

function PageTitle({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><div className="eyebrow mb-2">{kicker}</div><h1 className="font-display text-[32px] font-bold leading-tight tracking-[-.045em] text-[#23453f] sm:text-[40px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c73]">{description}</p></div>
    {action}
  </div>;
}

function InlineNotice({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'error' }) {
  return <div role="status" className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${tone === 'success' ? 'border-[#a7c9b7] bg-[#e9f3e9] text-[#285a4b]' : 'border-[#e6b4a8] bg-[#fff0ea] text-[#8e4234]'}`}>{tone === 'success' ? <Check size={16} /> : <X size={16} />}{children}</div>;
}

function LoadingState({ label = 'Gathering your workspace…' }: { label?: string }) {
  return <div className="space-y-4" aria-label={label}><div className="h-28 animate-pulse rounded-2xl bg-[#e8e4d6]" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-[#e8e4d6]" /><div className="h-36 animate-pulse rounded-2xl bg-[#e8e4d6]" /></div></div>;
}

function QueryError({ onRetry, label = 'We couldn’t load this right now.' }: { onRetry: () => void; label?: string }) {
  return <div className="surface rounded-2xl p-8 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#f5e4d9] text-[#9b583b]"><ArrowDownRight size={20} /></div><h3 className="font-display text-lg font-bold text-[#23453f]">A small connection hiccup</h3><p className="mt-1 text-sm text-[#718078]">{label}</p><Button className="btn-secondary mt-4" onClick={onRetry} data-testid="button-retry">Try again</Button></div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60000 } });
  const activeLabel = navItems.find(item => item.href === location)?.label ?? 'Your workspace';
  return <div className="app-shell flex">
    <aside className="sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col px-5 py-6 md:flex">
      <Link href="/" className="mb-10 flex items-center gap-3 rounded-xl px-2 text-inherit no-underline" data-testid="link-brand">
        <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#e5a66f] text-[#193d39]"><span className="font-display text-lg font-bold">S</span></div>
        <span><span className="font-display block text-[20px] font-bold leading-none tracking-[-.05em]">skilltank</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.19em] text-[#b7c6b5]">Build your next</span></span>
      </Link>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#91aaa0]">Your workspace</div>
      <nav className="space-y-1.5" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold no-underline ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{location === href && <ChevronRight className="ml-auto" size={15} />}</Link>)}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.055] p-4">
        <div className="mb-3 flex items-center gap-2 text-[#e8ac76]"><Sparkles size={15} /><span className="text-[10px] font-bold uppercase tracking-[.16em]">A little momentum</span></div>
        <p className="text-[13px] leading-5 text-[#ecede2]">Small, steady practice builds the kind of confidence interviews can’t shake.</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[#9cb2a5]"><span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-[#e4a17c]' : 'bg-[#8dc49e]'}`} />{health.isError ? 'Connection needs a retry' : 'Workspace connected'}</div>
      </div>
    </aside>
    <div className="min-w-0 flex-1 md:ml-[248px]">
      <header className="sticky top-0 z-20 border-b border-[#c8d0c1]/60 bg-[#f5f2e9]/90 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="content-wrap flex h-11 items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="focus-ring grid h-10 w-10 place-items-center rounded-xl text-[#254b43] md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} data-testid="button-mobile-menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
            <span className="font-display text-sm font-semibold text-[#31574d] md:hidden">skilltank</span>
            <span className="hidden text-xs font-medium text-[#829087] md:block">Student workspace <span className="mx-2 text-[#bdc5b8]">/</span><span className="text-[#405c53]">{activeLabel}</span></span>
          </div>
          <Link href="/profile" className="flex items-center gap-2 rounded-full border border-[#cbd3c6] bg-[#fbf9f1] py-1 pl-1 pr-3 text-xs font-semibold text-[#35574d] no-underline hover:bg-white" data-testid="link-profile-shortcut"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#d8e2d2] font-display text-xs font-bold text-[#31574d]">ST</div><span className="hidden sm:inline">Student profile</span><ChevronRight size={14} /></Link>
        </div>
      </header>
      {menuOpen && <div className="fixed inset-0 z-40 bg-[#123632] p-6 text-[#f4f0e6] md:hidden">
        <div className="mb-8 flex items-center justify-between"><span className="font-display text-xl font-bold">skilltank</span><button className="focus-ring rounded-lg p-2" onClick={() => setMenuOpen(false)} aria-label="Close navigation" data-testid="button-close-menu"><X /></button></div>
        <nav className="space-y-2">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-semibold no-underline ${location === href ? 'bg-[#e5a66f] text-[#193d39]' : 'text-[#e3e8db]'}`} data-testid={`mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={18} />{label}<ChevronRight className="ml-auto" size={16} /></Link>)}</nav>
      </div>}
      <main className="mobile-pad px-4 py-7 sm:px-6 md:px-8 md:py-9"><div className="content-wrap">{children}</div></main>
      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#c9d0c3] bg-[#faf8ef]/95 px-2 py-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-semibold no-underline ${location === href ? 'text-[#1e5b51]' : 'text-[#829087]'}`} data-testid={`bottom-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={18} strokeWidth={location === href ? 2.4 : 1.8} /><span>{label === 'Learning tasks' ? 'Tasks' : label === 'Project ideas' ? 'Projects' : label === 'Opportunities' ? 'Internships' : label === 'My profile' ? 'Profile' : 'Home'}</span></Link>)}
      </nav>
    </div>
  </div>;
}

function Dashboard() {
  const queryClient = useQueryClient();
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.isError || !dashboard.data) return <QueryError onRetry={() => queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() })} />;
  const summary = dashboard.data;
  const greeting = summary.profile.name ? summary.profile.name.split(' ')[0] : 'there';
  const percent = Math.min(100, Math.max(0, summary.completionRate));
  return <div className="appear">
    <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><div className="eyebrow mb-2">Your progress, in one place</div><h1 className="font-display text-[34px] font-bold leading-tight tracking-[-.055em] text-[#23453f] sm:text-[43px]">Good to see you, {greeting}.</h1><p className="mt-2 text-sm text-[#708077]">One focused step today makes tomorrow feel closer.</p></div>
      <Link href="/tasks" className="btn-primary inline-flex w-fit items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold no-underline" data-testid="link-add-task"><Plus size={17} />Add a learning task</Link>
    </div>
    <section className="relative mb-6 overflow-hidden rounded-[26px] bg-[#214f48] p-6 text-[#f5f1e5] sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-1 top-4 h-44 w-44 rounded-full border border-white/10" />
      <div className="relative grid gap-8 md:grid-cols-[1.15fr_.85fr] md:items-center">
        <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#dce5d8]"><Target size={13} className="text-[#e7a66f]" />Your learning rhythm</div><h2 className="font-display max-w-lg text-[26px] font-semibold leading-tight tracking-[-.04em] sm:text-[32px]">Progress is built one finished thing at a time.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#c8d8cb]">You’ve completed {summary.completedTasks} of {summary.totalTasks} learning tasks. Keep your next step close and doable.</p><Link href="/tasks" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f0b982] no-underline hover:text-[#ffd2a7]" data-testid="link-view-tasks">See your task list <ArrowRight size={15} /></Link></div>
        <div className="rounded-2xl border border-white/10 bg-[#173f3b]/60 p-5 sm:p-6">
          <div className="flex items-end justify-between"><div><span className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#b2c8ba]">Tasks completed</span><div className="mt-2 font-display text-5xl font-bold tracking-[-.06em]">{percent}<span className="text-2xl text-[#e9ad76]">%</span></div></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e7a66f] text-[#214f48]"><Zap size={22} /></div></div>
          <div className="progress-track mt-5 h-2 overflow-hidden rounded-full"><div className="progress-fill h-full rounded-full" style={{ width: `${percent}%` }} /></div>
          <div className="mt-2 flex justify-between text-[11px] text-[#b8c8bc]"><span>{summary.completedTasks} complete</span><span>{summary.activeTasks} still in progress</span></div>
        </div>
      </div>
    </section>
    <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Learning tasks', value: summary.totalTasks, sub: `${summary.activeTasks} active`, icon: CheckCircle2, tint: 'bg-[#e1ebdc] text-[#39685b]' },
        { label: 'Completed', value: summary.completedTasks, sub: 'steps behind you', icon: Check, tint: 'bg-[#f4e5d4] text-[#a8673e]' },
        { label: 'Saved projects', value: summary.savedProjects, sub: 'ideas to explore', icon: Bookmark, tint: 'bg-[#e9e3ed] text-[#6d5d7a]' },
        { label: 'Internship ideas', value: summary.internshipCount, sub: 'sample opportunities', icon: BriefcaseBusiness, tint: 'bg-[#e3e9e4] text-[#496c61]' },
      ].map(({ label, value, sub, icon: Icon, tint }, index) => <div key={label} className={`surface appear rounded-2xl p-4 sm:p-5 delay-${index + 1}`}><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#77847a]">{label}</span><div className={`grid h-8 w-8 place-items-center rounded-xl ${tint}`}><Icon size={16} /></div></div><div className="metric-number mt-3 text-3xl font-bold text-[#274b43]">{value}</div><div className="mt-1 text-[11px] text-[#899289]">{sub}</div></div>)}
    </section>
    <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <section className="surface rounded-[22px] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div><div className="eyebrow">Keep the thread</div><h2 className="font-display mt-1 text-xl font-bold tracking-[-.03em] text-[#294c43]">Recent learning tasks</h2></div><Link href="/tasks" className="inline-flex items-center gap-1 text-xs font-bold text-[#3a6b5d] no-underline" data-testid="link-all-tasks">All tasks <ArrowRight size={14} /></Link></div>
        {summary.recentTasks.length ? <div className="divide-y divide-[#e2e3d7]">{summary.recentTasks.slice(0, 5).map(task => <TaskPreview key={task.id} task={task} />)}</div> : <EmptyState icon={<Target size={19} />} title="Your first step is waiting" copy="Add a small learning task and give your week a direction." link="/tasks" linkText="Plan a task" />}
      </section>
      <section className="relative overflow-hidden rounded-[22px] bg-[#e9e5d5] p-5 sm:p-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-[#92a59a]/30" /><div className="relative"><div className="eyebrow">A good next move</div><h2 className="font-display mt-2 max-w-[250px] text-[23px] font-bold leading-tight tracking-[-.04em] text-[#254941]">Turn an interest into something you can show.</h2><p className="mt-3 text-sm leading-6 text-[#6b7a70]">Pick a project idea that stretches one skill you already have.</p><Link href="/projects" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#214f48] px-4 py-2.5 text-sm font-semibold text-[#f5f1e5] no-underline hover:bg-[#173f3b]" data-testid="link-project-ideas">Browse ideas <ArrowRight size={15} /></Link><div className="mt-8 flex items-center gap-3 border-t border-[#cbd0c0] pt-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d3dfcf] text-[#366257]"><Compass size={17} /></div><div><div className="text-xs font-bold text-[#34574e]">{summary.profile.branch || 'Engineering'} · {summary.profile.year || 'Your year'}</div><div className="mt-0.5 text-[10px] text-[#718077]">Your learning context</div></div><Link href="/profile" className="ml-auto text-xs font-bold text-[#507668] no-underline" data-testid="link-edit-profile">Edit</Link></div></div>
      </section>
    </div>
  </div>;
}

function TaskPreview({ task }: { task: Task }) {
  return <div className="task-row flex items-center gap-3 py-3.5" data-testid={`task-preview-${task.id}`}><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${task.completed ? 'bg-[#dceade] text-[#3f775d]' : 'bg-[#eee9dc] text-[#819087]'}`}>{task.completed ? <Check size={15} /> : <Circle size={14} />}</div><div className="min-w-0 flex-1"><div className={`truncate text-sm font-semibold ${task.completed ? 'text-[#839087] line-through' : 'text-[#34544b]'}`}>{task.title}</div><div className="mt-1 text-[10px] text-[#8c968b]">{task.category || 'General'} · {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div></div><ChevronRight size={15} className="text-[#9aa49a]" /></div>;
}

function EmptyState({ icon, title, copy, link, linkText }: { icon: ReactNode; title: string; copy: string; link?: string; linkText?: string }) {
  return <div className="rounded-2xl border border-dashed border-[#cbd2c4] bg-[#f7f5ec]/70 px-6 py-9 text-center"><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-[#e4eadf] text-[#4b7567]">{icon}</div><h3 className="font-display text-base font-bold text-[#34574d]">{title}</h3><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#7a887e]">{copy}</p>{link && <Link href={link} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#3d705f] no-underline" data-testid="link-empty-action">{linkText}<ArrowRight size={13} /></Link>}</div>;
}

function TasksPage() {
  const qc = useQueryClient();
  const query = useGetTasks({ query: { queryKey: getGetTasksQueryKey() } });
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const refresh = () => { qc.invalidateQueries({ queryKey: getGetTasksQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); };
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    if (!title.trim()) return;
    create.mutate({ data: { title: title.trim(), category: category.trim() || undefined } }, { onSuccess: () => { setTitle(''); setCategory(''); setNotice('Task added to your learning list.'); refresh(); }, onError: () => setError('That task could not be added. Please try again.') });
  };
  const changeComplete = (task: Task) => update.mutate({ id: task.id, data: { completed: !task.completed } }, { onSuccess: () => { setNotice(task.completed ? 'Task moved back to in progress.' : 'Nice work — task completed.'); refresh(); }, onError: () => setError('Task status did not update. Try again.') });
  const saveEdit = (event: FormEvent) => { event.preventDefault(); if (!editing || !editing.title.trim()) return; update.mutate({ id: editing.id, data: { title: editing.title.trim(), category: editing.category.trim() } }, { onSuccess: () => { setEditing(null); setNotice('Your task has been updated.'); refresh(); }, onError: () => setError('The task could not be updated. Please try again.') }); };
  const deleteTask = (task: Task) => { if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return; remove.mutate({ id: task.id }, { onSuccess: () => { setNotice('Task removed from your list.'); refresh(); }, onError: () => setError('Task could not be deleted. Please try again.') }); };
  if (query.isLoading) return <LoadingState label="Loading your tasks" />;
  if (query.isError || !query.data) return <QueryError onRetry={() => query.refetch()} />;
  const tasks = query.data;
  const visible = tasks.filter(t => filter === 'all' || (filter === 'active' ? !t.completed : t.completed));
  return <div className="appear">
    <PageTitle kicker="Make the next step visible" title="Learning tasks" description="Keep practice and placement prep moving with small, clear actions." action={<div className="rounded-xl border border-[#d3d6c9] bg-[#faf8ef] px-3 py-2 text-xs font-semibold text-[#526b5f]">{tasks.filter(t => t.completed).length} of {tasks.length} done</div>} />
    {notice && <InlineNotice>{notice}</InlineNotice>}{error && <InlineNotice tone="error">{error}</InlineNotice>}
    <section className="surface mb-6 rounded-[22px] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-xl bg-[#e4eadf] text-[#3d705f]"><Plus size={17} /></div><div><h2 className="font-display text-base font-bold text-[#34554c]">Add a learning task</h2><p className="text-[11px] text-[#829087]">Choose a next step you can actually finish.</p></div></div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <input aria-label="Task title" data-testid="input-task-title" maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Solve two array problems" className="focus-ring h-11 rounded-xl border border-[#d3d8ca] bg-[#fbfaf4] px-3 text-sm text-[#294d44] placeholder:text-[#a0a99e]" />
        <input aria-label="Category" data-testid="input-task-category" maxLength={80} value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (optional)" className="focus-ring h-11 rounded-xl border border-[#d3d8ca] bg-[#fbfaf4] px-3 text-sm text-[#294d44] placeholder:text-[#a0a99e]" />
        <Button type="submit" disabled={!title.trim() || create.isPending} className="btn-primary h-11" data-testid="button-create-task">{create.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}Add task</Button>
      </form>
    </section>
    <section className="surface rounded-[22px] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="eyebrow">Your practice list</div><h2 className="font-display mt-1 text-xl font-bold text-[#34554c]">The work that adds up</h2></div><div className="flex rounded-xl bg-[#eeecdf] p-1">{(['all', 'active', 'completed'] as const).map(value => <button key={value} onClick={() => setFilter(value)} className={`focus-ring rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize ${filter === value ? 'bg-[#fffdf6] text-[#315c50] shadow-sm' : 'text-[#89958b]'}`} data-testid={`filter-${value}`}>{value}</button>)}</div></div>
      {visible.length === 0 ? tasks.length === 0 ? <EmptyState icon={<Target size={19} />} title="Start with one useful thing" copy="A task can be a coding drill, a concept to revisit, or one step toward a project." /> : <EmptyState icon={<CheckCircle2 size={19} />} title={`No ${filter} tasks`} copy="Switch the view to see another part of your learning list." /> :
        <div className="divide-y divide-[#e4e4d8]">{visible.map(task => <div key={task.id} className="task-row flex items-center gap-3 py-3.5" data-testid={`task-row-${task.id}`}>
          <button onClick={() => changeComplete(task)} aria-label={task.completed ? 'Mark task active' : 'Mark task complete'} className={`focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-full ${task.completed ? 'bg-[#dceade] text-[#3f775d]' : 'border border-[#c5cec1] text-[#90a094] hover:border-[#4c806e] hover:text-[#4c806e]'}`} data-testid={`button-complete-${task.id}`}>{task.completed ? <Check size={15} /> : <Circle size={15} />}</button>
          {editing?.id === task.id ? <form onSubmit={saveEdit} className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_170px_auto_auto]"><input autoFocus value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} aria-label="Edit task title" className="focus-ring h-9 min-w-0 rounded-lg border border-[#d3d8ca] bg-[#fbfaf4] px-2 text-sm" /><input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} aria-label="Edit task category" className="focus-ring h-9 min-w-0 rounded-lg border border-[#d3d8ca] bg-[#fbfaf4] px-2 text-sm" /><Button type="submit" disabled={update.isPending} className="btn-primary !px-3 !py-2" data-testid={`button-save-edit-${task.id}`}>Save</Button><Button type="button" className="btn-secondary !px-3 !py-2" onClick={() => setEditing(null)} data-testid={`button-cancel-edit-${task.id}`}>Cancel</Button></form> :
            <><div className="min-w-0 flex-1"><div className={`truncate text-sm font-semibold ${task.completed ? 'text-[#88938a] line-through' : 'text-[#34544b]'}`}>{task.title}</div><div className="mt-1 text-[10px] text-[#90998d]">{task.category || 'General'} <span className="mx-1.5">·</span>{new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div></div><button className="focus-ring rounded-lg p-2 text-[#819187] hover:bg-[#ebe9dc] hover:text-[#315c50]" onClick={() => setEditing(task)} aria-label={`Edit ${task.title}`} data-testid={`button-edit-${task.id}`}><Pencil size={15} /></button><button className="focus-ring rounded-lg p-2 text-[#9e8578] hover:bg-[#f5e8e0] hover:text-[#9d4f3b]" onClick={() => deleteTask(task)} aria-label={`Delete ${task.title}`} data-testid={`button-delete-${task.id}`}><Trash2 size={15} /></button></>}
        </div>)}</div>}
    </section>
  </div>;
}

function ProjectsPage() {
  const qc = useQueryClient();
  const projects = useGetProjects({ query: { queryKey: getGetProjectsQueryKey() } });
  const saved = useGetSavedProjects({ query: { queryKey: getGetSavedProjectsQueryKey() } });
  const save = useSaveProject();
  const remove = useRemoveSavedProject();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All levels');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  if (projects.isLoading || saved.isLoading) return <LoadingState label="Loading sample project ideas" />;
  if (projects.isError || saved.isError || !projects.data || !saved.data) return <QueryError label="Project ideas are taking a moment to load." onRetry={() => { projects.refetch(); saved.refetch(); }} />;
  const savedIds = new Set(saved.data.map(item => item.id));
  const levels = ['All levels', ...Array.from(new Set(projects.data.map(p => p.level))).sort()];
  const filtered = projects.data.filter(p => (level === 'All levels' || p.level === level) && `${p.title} ${p.description} ${p.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const invalidate = () => { qc.invalidateQueries({ queryKey: getGetSavedProjectsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); };
  const toggleSave = (id: string) => {
    setError(''); setNotice('');
    if (savedIds.has(id)) remove.mutate({ projectId: id }, { onSuccess: () => { setNotice('Project removed from your saved ideas.'); invalidate(); }, onError: () => setError('Could not remove this saved idea. Try again.') });
    else save.mutate({ data: { projectId: id } }, { onSuccess: () => { setNotice('Project saved for later.'); invalidate(); }, onError: () => setError('Could not save this idea. Try again.') });
  };
  return <div className="appear">
    <PageTitle kicker="Build something worth talking about" title="Project ideas" description="Sample project prompts to turn your skills into evidence. Save the ones you want to explore." action={<span className="inline-flex items-center gap-2 rounded-full border border-[#d2d8c9] bg-[#eff1e6] px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#527164]"><Sparkles size={13} />Sample catalog</span>} />
    {notice && <InlineNotice>{notice}</InlineNotice>}{error && <InlineNotice tone="error">{error}</InlineNotice>}
    <div className="surface mb-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
      <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85938a]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas or skills" aria-label="Search project ideas" data-testid="input-project-search" className="focus-ring h-10 w-full rounded-xl border border-[#d8dccf] bg-[#fbfaf3] pl-9 pr-3 text-sm placeholder:text-[#9ca69b]" /></div>
      <div className="flex items-center gap-2"><span className="text-[11px] font-semibold text-[#839086]">Level</span><select value={level} onChange={e => setLevel(e.target.value)} aria-label="Filter by level" data-testid="select-project-level" className="focus-ring h-10 rounded-xl border border-[#d8dccf] bg-[#fbfaf3] px-3 text-xs font-semibold text-[#47675b]">{levels.map(item => <option key={item}>{item}</option>)}</select></div>
      <div className="rounded-xl bg-[#e9e8dc] px-3 py-2 text-xs font-semibold text-[#567064]">{saved.data.length} saved</div>
    </div>
    {!filtered.length ? <EmptyState icon={<Search size={19} />} title="No matching ideas" copy="Try a broader search or another skill level." /> :
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((project, index) => {
        const isSaved = savedIds.has(project.id);
        return <article key={project.id} className={`surface appear flex min-h-[255px] flex-col rounded-[22px] p-5 delay-${(index % 3) + 1}`} data-testid={`project-card-${project.id}`}>
          <div className="mb-4 flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#e2eadd] text-[#3f7061]"><Cpu size={19} /></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#f0e7d7] px-2.5 py-1 text-[10px] font-bold text-[#8e6744]">{project.level}</span><button onClick={() => toggleSave(project.id)} disabled={save.isPending || remove.isPending} aria-label={isSaved ? 'Remove saved project' : 'Save project'} className={`focus-ring grid h-8 w-8 place-items-center rounded-full transition-colors ${isSaved ? 'bg-[#e5a66f] text-[#244a42]' : 'bg-[#eeece1] text-[#74857a] hover:bg-[#e5a66f] hover:text-[#244a42]'}`} data-testid={`button-save-project-${project.id}`}><Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} /></button></div></div>
          <h2 className="font-display text-[19px] font-bold leading-tight tracking-[-.025em] text-[#2c5046]">{project.title}</h2><p className="mt-2 text-xs leading-5 text-[#75847a]">{project.description}</p>
          <div className="mt-auto pt-5"><div className="mb-3 flex flex-wrap gap-1.5">{project.skills.map(skill => <span key={skill} className="rounded-full border border-[#d8ded2] bg-[#f4f5eb] px-2.5 py-1 text-[10px] font-semibold text-[#587064]">{skill}</span>)}</div><div className="flex items-center justify-between border-t border-[#e1e3d8] pt-3"><span className="text-[9px] font-bold uppercase tracking-[.15em] text-[#9a9e8f]">Sample project idea</span><button onClick={() => toggleSave(project.id)} disabled={save.isPending || remove.isPending} className="focus-ring inline-flex items-center gap-1 text-[11px] font-bold text-[#3e705f]" data-testid={`button-save-label-${project.id}`}>{isSaved ? 'Saved' : 'Save idea'}<ArrowRight size={13} /></button></div></div>
        </article>;
      })}</div>}
  </div>;
}

function InternshipsPage() {
  const qc = useQueryClient();
  const query = useGetInternships({ query: { queryKey: getGetInternshipsQueryKey() } });
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All types');
  if (query.isLoading) return <LoadingState label="Loading sample opportunities" />;
  if (query.isError || !query.data) return <QueryError label="Sample opportunities couldn’t be loaded." onRetry={() => qc.invalidateQueries({ queryKey: getGetInternshipsQueryKey() })} />;
  const types = ['All types', ...Array.from(new Set(query.data.map(i => i.type))).sort()];
  const list = query.data.filter(i => (type === 'All types' || type === i.type) && `${i.title} ${i.company} ${i.skills.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="appear">
    <PageTitle kicker="Explore what could fit" title="Internship ideas" description="Browse sample opportunities and notice which skills show up in the work you want to do." action={<span className="inline-flex items-center gap-2 rounded-full border border-[#d2d8c9] bg-[#eff1e6] px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#527164]"><BriefcaseBusiness size={13} />Sample catalog</span>} />
    <div className="surface mb-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85938a]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, companies, or skills" aria-label="Search opportunities" data-testid="input-internship-search" className="focus-ring h-10 w-full rounded-xl border border-[#d8dccf] bg-[#fbfaf3] pl-9 pr-3 text-sm placeholder:text-[#9ca69b]" /></div><div className="flex items-center gap-2"><span className="text-[11px] font-semibold text-[#839086]">Type</span><select value={type} onChange={e => setType(e.target.value)} aria-label="Filter by type" data-testid="select-internship-type" className="focus-ring h-10 rounded-xl border border-[#d8dccf] bg-[#fbfaf3] px-3 text-xs font-semibold text-[#47675b]">{types.map(item => <option key={item}>{item}</option>)}</select></div></div>
    {!list.length ? <EmptyState icon={<Search size={19} />} title="No matching opportunities" copy="Try a different role, skill, or opportunity type." /> : <div className="space-y-3">{list.map((item, i) => <article key={item.id} className={`surface appear grid gap-4 rounded-[22px] p-5 delay-${(i % 3) + 1} sm:grid-cols-[1fr_auto] sm:items-start`} data-testid={`internship-card-${item.id}`}><div className="flex gap-4"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-[15px] ${i % 2 ? 'bg-[#f2e4d5] text-[#a56942]' : 'bg-[#deeadf] text-[#3c705e]'}`}><BriefcaseBusiness size={19} /></div><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold leading-tight tracking-[-.025em] text-[#2c5046]">{item.title}</h2><span className="rounded-full bg-[#ecebdf] px-2.5 py-1 text-[10px] font-bold text-[#6d8074]">{item.type}</span></div><div className="text-xs font-semibold text-[#6e8075]">{item.company}</div><p className="mt-3 max-w-2xl text-xs leading-5 text-[#78867c]">{item.note}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.skills.map(skill => <span key={skill} className="rounded-full border border-[#d8ded2] bg-[#f4f5eb] px-2.5 py-1 text-[10px] font-semibold text-[#587064]">{skill}</span>)}</div></div></div><div className="flex items-center gap-2 self-end sm:flex-col sm:items-end"><span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#9a9e8f]">Sample opportunity</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#f0eadd] text-[#7e8a80]"><ArrowRight size={15} /></span></div></article>)}</div>}
    <p className="mt-5 rounded-xl border border-[#dfddcf] bg-[#f5f2e7] px-4 py-3 text-[11px] leading-5 text-[#77857a]">These are sample listings for exploration, not live vacancies or application links.</p>
  </div>;
}

function ProfilePage() {
  const qc = useQueryClient();
  const profile = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (profile.data && !initialized) {
      setName(profile.data.name);
      setBranch(profile.data.branch);
      setYear(profile.data.year);
      setInterests(profile.data.interests.join(', '));
      setInitialized(true);
    }
  }, [profile.data, initialized]);
  if (profile.isLoading) return <LoadingState label="Loading your profile" />;
  if (profile.isError || !profile.data) return <QueryError label="Your profile couldn’t be loaded." onRetry={() => qc.invalidateQueries({ queryKey: getGetProfileQueryKey() })} />;
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    const interestList = interests.split(',').map(i => i.trim()).filter(Boolean).slice(0, 20);
    updateProfile.mutate({ data: { name: name.trim(), branch: branch.trim(), year: year.trim(), interests: interestList } }, {
      onSuccess: () => { setNotice('Profile saved. Your dashboard now reflects your details.'); qc.invalidateQueries({ queryKey: getGetProfileQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); },
      onError: () => setError('Your changes were not saved. Please try again.'),
    });
  };
  return <div className="appear">
    <PageTitle kicker="Make this workspace yours" title="Student profile" description="A little context helps you keep learning choices connected to where you want to go." />
    {notice && <InlineNotice>{notice}</InlineNotice>}{error && <InlineNotice tone="error">{error}</InlineNotice>}
    <div className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
      <section className="relative overflow-hidden rounded-[24px] bg-[#214f48] p-6 text-[#f5f1e5] sm:p-7">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" /><div className="absolute -right-2 top-0 h-24 w-24 rounded-full border border-white/10" />
        <div className="relative"><div className="grid h-16 w-16 place-items-center rounded-[21px] bg-[#e5a66f] font-display text-2xl font-bold text-[#214f48]">{(name.trim() || 'S').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()}</div><div className="mt-5 text-[10px] font-bold uppercase tracking-[.17em] text-[#b9cec0]">Your learning identity</div><h2 className="font-display mt-1 text-[25px] font-bold leading-tight tracking-[-.04em]">{name || 'Student name'}</h2><p className="mt-1 text-sm text-[#d0dbcf]">{branch || 'Engineering branch'}{year ? ` · ${year}` : ''}</p><div className="mt-6 border-t border-white/15 pt-5"><div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#b9cec0]">Interests</div>{interests.trim() ? <div className="mt-3 flex flex-wrap gap-2">{interests.split(',').map(s => s.trim()).filter(Boolean).map(s => <span key={s} className="rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-xs text-[#edf0e4]">{s}</span>)}</div> : <p className="mt-2 text-xs text-[#c6d3c8]">Add a few topics that keep you curious.</p>}</div><div className="mt-8 flex items-center gap-2 text-xs text-[#e7ac77]"><Sparkles size={15} />Your path, at your pace.</div></div>
      </section>
      <section className="surface rounded-[24px] p-5 sm:p-7">
        <div className="mb-6"><div className="eyebrow">Profile details</div><h2 className="font-display mt-1 text-xl font-bold text-[#34554c]">What are you working toward?</h2><p className="mt-1 text-xs text-[#829087]">Only your profile fields are updated when you save.</p></div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#50675c]">Your name</span><input value={name} onChange={e => setName(e.target.value)} maxLength={100} aria-label="Your name" data-testid="input-profile-name" placeholder="Name" className="focus-ring h-11 w-full rounded-xl border border-[#d3d8ca] bg-[#fbfaf4] px-3 text-sm text-[#294d44] placeholder:text-[#a0a99e]" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-bold text-[#50675c]">Branch</span><input value={branch} onChange={e => setBranch(e.target.value)} maxLength={80} aria-label="Branch" data-testid="input-profile-branch" placeholder="e.g. Computer Science" className="focus-ring h-11 w-full rounded-xl border border-[#d3d8ca] bg-[#fbfaf4] px-3 text-sm text-[#294d44] placeholder:text-[#a0a99e]" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-[#50675c]">Year of study</span><input value={year} onChange={e => setYear(e.target.value)} maxLength={40} aria-label="Year of study" data-testid="input-profile-year" placeholder="e.g. 3rd year" className="focus-ring h-11 w-full rounded-xl border border-[#d3d8ca] bg-[#fbfaf4] px-3 text-sm text-[#294d44] placeholder:text-[#a0a99e]" /></label></div>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#50675c]">Interests</span><textarea value={interests} onChange={e => setInterests(e.target.value)} aria-label="Interests" data-testid="input-profile-interests" maxLength={1200} rows={3} placeholder="Separate topics with commas — e.g. embedded systems, web development" className="focus-ring w-full resize-y rounded-xl border border-[#d3d8ca] bg-[#fbfaf4] px-3 py-3 text-sm text-[#294d44] placeholder:text-[#a0a99e]" /><span className="mt-1 block text-[10px] text-[#879289]">Use commas between interests, up to 20.</span></label>
          <div className="flex flex-col-reverse gap-3 border-t border-[#e3e4d9] pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] text-[#89958b]">Your profile is saved to your student workspace.</span><Button type="submit" disabled={updateProfile.isPending} className="btn-primary" data-testid="button-save-profile">{updateProfile.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}Save profile</Button></div>
        </form>
      </section>
    </div>
  </div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/tasks" component={TasksPage} />
    <Route path="/projects" component={ProjectsPage} />
    <Route path="/internships" component={InternshipsPage} />
    <Route path="/profile" component={ProfilePage} />
    <Route component={NotFound} />
  </Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
