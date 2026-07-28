import { Container } from "@/components/shared/container";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <Container className="flex min-h-16 items-center justify-between gap-4 py-4 text-sm text-muted-foreground">
        <p>Edexcel Mathematics Platform</p>
        <p>Foundation build</p>
      </Container>
    </footer>
  );
}
