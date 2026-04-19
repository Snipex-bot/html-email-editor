export const dynamic = "force-dynamic";

import NewsletterEditor from "@/components/NewsletterEditor";

interface Props {
  params: { id: string };
}

export default function EditorNewsletterPage({ params }: Props) {
  return <NewsletterEditor newsletterId={params.id} />;
}
