import { MarkdownParser } from "./markdown-parser";

async function main(): Promise<void> {
  const markdown = `
# BGP Troubleshooting Guide

## Neighbor Investigation

1. Review the BGP neighbor state and session logs.
2. Verify the configured peer address.
3. Check network connectivity between the peers.

## Session Recovery

1. Confirm the remote peer is reachable.
2. Review the BGP session logs.
3. Reset the BGP session if required.
`;

  const parser = new MarkdownParser();

  const result =
    await parser.parse(
      Buffer.from(markdown),
      "bgp-guide.md",
    );

  console.dir(result, {
    depth: null,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});