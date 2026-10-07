import type {
  Protocol,
  QueryHistoryItem,
  RetrievalResult,
} from "@/types";

export const protocols: Protocol[] = [
  {
    id: "bgp",
    name: "BGP",
  },
  {
    id: "ospf",
    name: "OSPF",
  },
  {
    id: "mpls",
    name: "MPLS",
  },
  {
    id: "isis",
    name: "ISIS",
  },
  {
    id: "bfd",
    name: "BFD",
  },
];

export const recentQueries: QueryHistoryItem[] = [
  {
    id: "mock-1",
    query:
      "BGP neighbor is stuck in Active state. What should I check next?",
    createdAt:
      new Date().toISOString(),
  },
  {
    id: "mock-2",
    query:
      "Verify the configured peer address.",
    createdAt:
      new Date().toISOString(),
  },
  {
    id: "mock-3",
    query:
      "Check network connectivity between the peers.",
    createdAt:
      new Date().toISOString(),
  },
];

export const mockRetrievalResult: RetrievalResult = {
  status: "ready",

  relevance: null,

  answer: null,

  explanation: null,

  queryHistoryId: null,

  source: null,

  previousStep: null,

  currentStep: null,

  nextStep: null,
};