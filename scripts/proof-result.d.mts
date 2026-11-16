export const proofProjects: Readonly<Record<string,string>>;
export function bindVerifiedKernel(project: string, verification: unknown, read?: (path: string) => Uint8Array): {
  kernelSha256: string; holoSha256: string; holoBinding: 'identical';
  buildId: string; attestationId: string; kernelBinding: 'identical';
};
