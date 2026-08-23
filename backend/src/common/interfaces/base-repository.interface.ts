/**
 * Generic contract shared by every repository. Repositories only talk to
 * Prisma - no business logic - per AGENTS.md Backend Rules.
 */
export interface IBaseRepository<TEntity, TCreateInput, TUpdateInput> {
  create(input: TCreateInput): Promise<TEntity>;
  findById(id: string): Promise<TEntity | null>;
  update(id: string, input: TUpdateInput): Promise<TEntity>;
  delete(id: string): Promise<TEntity>;
}
