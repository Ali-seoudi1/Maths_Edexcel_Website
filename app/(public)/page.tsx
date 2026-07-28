import { Container } from "@/components/shared/container";
import { PageHeader } from "@/components/shared/page-header";

export default function PublicHomePage() {
  return (
    <Container className="py-16">
      <PageHeader
        eyebrow="Public"
        title="Edexcel Mathematics Platform"
        description="Public page placeholder."
      />
    </Container>
  );
}
