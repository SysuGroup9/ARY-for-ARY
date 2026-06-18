import { WorkPageView } from "@/app/_components/public/work-page";
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
    <WorkPageView
      author={work.author}
      codeSnippet={work.codeSnippet}
      excerpt={work.excerpt}
      raceSlug={work.raceSlug}
      raceTitle={work.raceTitle}
      score={work.score}
      title={work.title}
    />
  );
}
