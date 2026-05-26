import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="font-semibold text-slate-900">Church CMS</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
            >
              Start free trial
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
          Run your church on one platform.
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          People, groups, services, online giving, check-in, communication,
          and forms — built for churches, secure by design.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-white text-sm font-medium hover:bg-slate-800"
          >
            Start your 30-day trial
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-slate-900 text-sm font-medium hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {[
            { t: "People & Families", d: "Directory, custom fields, family links." },
            { t: "Groups", d: "Small groups, leaders, attendance." },
            { t: "Services & Worship", d: "Run sheets, song library, volunteers." },
            { t: "Giving", d: "Online donations, recurring, statements." },
            { t: "Events & Check-in", d: "Registrations, child check-in." },
            { t: "Communication", d: "Email & SMS campaigns." },
            { t: "Forms", d: "Public forms feeding into people." },
            { t: "Reporting", d: "Attendance, giving, growth." },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="font-medium text-slate-900">{f.t}</div>
              <div className="mt-1 text-sm text-slate-500">{f.d}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
