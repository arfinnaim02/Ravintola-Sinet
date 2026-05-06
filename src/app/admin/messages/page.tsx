import { prisma } from "../../../lib/prisma";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / System
          </p>

          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Contact Messages
          </h1>

          <p className="mt-2 text-sm text-[#7b6255]">
            View customer questions, feedback and contact requests.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-black text-[#3b1f18]">
                Messages
              </h2>
              <p className="mt-1 text-sm text-[#7b6255]">
                {messages.length} message{messages.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
              No contact messages yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-display text-xl font-black text-[#3b1f18]">
                        {message.name}
                      </h3>

                      <a
                        href={`mailto:${message.email}`}
                        className="mt-1 block text-sm font-bold text-[#7b6255] underline underline-offset-4"
                      >
                        {message.email}
                      </a>
                    </div>

                    <p className="text-xs font-bold text-[#9c806b]">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>

                  <p className="mt-4 whitespace-pre-line rounded-2xl bg-white p-4 text-sm leading-7 text-[#7b6255]">
                    {message.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}