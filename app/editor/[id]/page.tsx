export const dynamic = "force-dynamic";

import NewsletterEditor from "@/components/NewsletterEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditorNewsletterPage({ params }: Props) {
  const { id } = await params;
  return <NewsletterEditor newsletterId={id} />;
}
