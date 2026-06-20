import { WorkPageView } from "@/app/_components/public/work-page";
import { aryStyles } from "@/app/_components/ary-shared";
import { getWorkBySlug } from "@/lib/services/public-routes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ workSlug: string }>;
}

export default async function WorkPage({ params }: Props) {
  const { workSlug } = await params;
  const work = await getWorkBySlug(workSlug);

  if (!work) {
    notFound();
  }

  return (
    <main>
      <WorkPageView
        author={work.author}
        awards={work.awards}
        demoUrl={work.demoUrl}
        evidenceSummaries={work.evidenceSummaries}
        excerpt={work.excerpt}
        judgeComments={work.judgeComments}
        raceSlug={work.raceSlug}
        raceTitle={work.raceTitle}
        repoUrl={work.repoUrl}
        score={work.score}
        techNotes={work.techNotes}
        title={work.title}
        videoUrl={work.videoUrl}
      />
      <style>{aryStyles}</style>
    </main>
  );
}
