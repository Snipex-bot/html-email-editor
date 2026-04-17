export interface LibraryBlock {
  id: string;
  name: string;
  type: string;
  description: string;
  html: string;
}

export interface Client {
  id: string;
  name: string;
  color: string;
}

export interface ActiveBlock {
  instanceId: string;
  blockId: string;
  name: string;
  type: string;
  rawTemplate: string;
  variables: Record<string, string>;
}
