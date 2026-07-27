import type { Meta, StoryObj } from "@storybook/react-vite";

interface TokenSwatch {
  description: string;
  name: string;
}

const semanticTokens: TokenSwatch[] = [
  { name: "--color-bg-body", description: "Page background" },
  { name: "--color-bg-surface", description: "Elevated surface" },
  { name: "--color-text-primary", description: "Primary text" },
  { name: "--color-text-secondary", description: "Secondary text" },
  { name: "--color-primary", description: "Brand accent" },
  { name: "--color-border-default", description: "Default border" },
  { name: "--color-status-success", description: "Success status" },
];

function TokenReference(): JSX.Element {
  return (
    <section style={{ color: "var(--color-text-primary)", maxWidth: 760 }}>
      <h1>Design tokens</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Switch the global theme toolbar to inspect the same semantic variables in light and dark
        mode.
      </p>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {semanticTokens.map((token) => (
          <article
            key={token.name}
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              aria-label={token.name}
              role="img"
              style={{
                background: `var(${token.name})`,
                border: "1px solid var(--color-border-default)",
                borderRadius: 6,
                height: 64,
                marginBottom: 8,
              }}
            />
            <code>{token.name}</code>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 0 }}>
              {token.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

const meta: Meta<typeof TokenReference> = {
  title: "Tokens/Reference",
  component: TokenReference,
};

export default meta;
type Story = StoryObj<typeof TokenReference>;

export const SemanticReference: Story = {};
