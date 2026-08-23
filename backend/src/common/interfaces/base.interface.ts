/**
 * Generic contract shared by every entity service in the system.
 * Per AGENTS.md: "BaseService and BaseInterface contain shared behavior/
 * contracts only." Concrete services (e.g. IEmployeeService) extend this
 * with entity-specific methods where the CRUD shape below isn't enough.
 */
export interface PaginatedResult<TEntity> {
  items: TEntity[];
  total: number;
}

export interface IBaseService<TEntity, TCreateDto, TUpdateDto, TQuery = unknown> {
  create(dto: TCreateDto, actorUserId?: string): Promise<TEntity>;
  findOne(id: string): Promise<TEntity>;
  findMany(query?: TQuery): Promise<PaginatedResult<TEntity>>;
  update(id: string, dto: TUpdateDto, actorUserId?: string): Promise<TEntity>;
  delete(id: string, actorUserId?: string): Promise<void>;
}
