# Refactor BaseService: generic Prisma CRUD + audit phản ánh đúng data đầu vào

## Bối cảnh (Context) — cập nhật lần 2

Sau khi bản refactor generic đầu tiên (4 generic: `TDelegate, TCreateDto, TUpdateDto, TQuery`) đã chạy được, `REQUIEMNT_PROJECT_AI.md` được viết lại với một nguyên tắc khác, nghiêm ngặt hơn, mà bản đầu **chưa đáp ứng đúng**:

> **Service con quyết định data shape hoàn toàn. BaseService không được tự ý biến đổi, merge, thêm, hay loại bỏ business field trước khi persist — và audit log phải phản ánh CHÍNH XÁC data mà service con truyền vào, không phải row trả về từ Prisma.**

Vi phạm cụ thể trong bản hiện tại (`base.service.ts`):
- `create`/`update`/`createMany`/`updateMany` đang tự `{...dto, createdByUserId, updatedByUserId}` rồi mới emit event bằng **kết quả trả về từ Prisma** (row đầy đủ, có id/timestamp/audit column) — không phải data gốc service truyền vào.
- `update`/`delete` đang gọi `findOne()` trước để vừa check tồn tại vừa lấy snapshot — có 1 query không cần thiết.

Qua trao đổi, đã chốt thêm các quyết định sau (giữ nguyên phần "Phát hiện quan trọng" và "Thiết kế 4-generic" ở dưới — phần đó **vẫn đúng và không đổi**, vì nó là vấn đề suy luận kiểu Prisma, không phải vấn đề audit/data-integrity):

### Quyết định mới
0. **Phát hiện thêm khi viết pseudocode chi tiết: bỏ luôn `TCreateDto`/`TUpdateDto` khỏi generic của `BaseService`.** Vì giờ `create`/`update` nhận thẳng `data: CreateDataOf<TDelegate>`/`UpdateDataOf<TDelegate>` (suy ra từ `TDelegate`, không còn là 1 DTO type tự do nữa), 2 generic đó trở nên thừa. `BaseService` chỉ còn **2 generic**: `BaseService<TDelegate extends CrudDelegateShape, TQuery = unknown>`. `IBaseService`/`IEmployeeService` (tầng Controller-facing) hoàn toàn không đổi — TypeScript tự kiểm tra `CreateEmployeeDto` có gán được vào `CreateDataOf<PrismaService['employee']>` hay không ngay tại chỗ `EmployeeService implements IEmployeeService`; nếu một entity tương lai có DTO lệch hẳn Prisma input, entity đó sẽ tự nhiên cần viết 1 method riêng (tên khác `create`) để build `data` trước khi gọi `this.create(data, actorUserId)` — đúng tinh thần tài liệu.
1. **Audit payload = đúng object mà service con truyền vào `create`/`update`**, không phải row trả về từ Prisma. Việc merge `createdByUserId`/`updatedByUserId` (system field) để ghi Prisma phải xảy ra trên **một object riêng, tách biệt** khỏi object dùng để audit — không được sửa/merge ngay trên chính `data` gốc.
2. **`delete(id, actorUserId)`**: không query record trước khi xoá (bỏ hẳn `findOne()`), không cần snapshot, audit payload = `{}`. Not-found được phát hiện bằng cách bắt lỗi Prisma `PrismaClientKnownRequestError` code `P2025` ngay tại lệnh `delete()`/`update()`, thay vì query trước.
3. **`UpdateEmployeeDto.id`** (do `AttachRouteIdInterceptor` gắn vào chỉ để phục vụ `@IsEmployeeCodeUnique()`/`@IsEmployeeEmailUnique()` loại trừ chính nó) **không được để BaseService tự loại bỏ nữa** (vi phạm "không tự ý loại field"). Thay vào đó: **`EmployeeController.update()` tự strip `id` khỏi `dto` trước khi gọi service** — Controller quyết định data nào được truyền xuống, BaseService/EmployeeService nhận đúng data đó, không đứa nào đụng vào giữa chừng.
4. **`deleteMany(where)`**: không query trước (giữ đúng tinh thần "không query chỉ để phục vụ audit"), vì `deleteMany` thường (không phải `delete` đơn) không cho biết trước những row nào khớp. Ghi **1 event duy nhất cho cả batch** (không phải 1 event/row), dùng `entityId` sentinel (hằng số cố định, ví dụ `'BULK'`) vì không có 1 id cụ thể nào đại diện cho cả batch; payload = `{ where }` (điều kiện lọc), không phải business data snapshot.
5. **`createMany`/`updateMany` vẫn giữ per-row event** (khác `deleteMany`) — vì `createManyAndReturn`/`updateManyAndReturn` đã tự trả về đủ row trong CHÍNH lệnh ghi đó (không cần thêm query riêng), nên không vi phạm nguyên tắc "không query thêm". Payload mỗi event vẫn là input gốc (item tương ứng trong mảng `data[]` cho createMany; object `data` dùng chung cho cả batch trong updateMany), không phải row trả về.
6. **Đổi tên `EntityCrudEvent.entity` → `EntityCrudEvent.payload`** để phản ánh đúng ý nghĩa mới (không còn chắc chắn là "toàn bộ entity" nữa — có thể là input data, `{}`, hay `{where}`).

---

## Bối cảnh gốc (Context — bản đầu, vẫn còn hiệu lực cho phần generic)

`REQUIEMNT_PROJECT_AI.md` yêu cầu giảm số lượng generic mà một service con (như `EmployeeService`) phải khai báo khi `extends BaseService`, đồng thời:
- Vẫn giữ type-safe tuyệt đối cho Prisma `create`/`update`/`createMany`/`updateMany` input (không né bằng `any`/`unknown`).
- Thêm khả năng bulk (`createMany`/`updateMany`/`deleteMany`) ngay từ đầu, không phá kiến trúc sau này.
- Giữ nguyên hành vi hiện có: audit fields tự động, `id` không lấy từ DTO khi update, `EntityCrudEvent`/`AuditLogListener`, not-found exception.
- Không tự ý đổi `IBaseService` nếu không cần thiết; nếu đổi phải giải thích rõ.

Hiện trạng: `BaseService<TEntity, TDelegate, TCreateDto, TUpdateDto, TQuery>` (5 generic). `EmployeeService extends BaseService<Employee, PrismaService['employee'], CreateEmployeeDto, UpdateEmployeeDto, GetEmployeesQueryDto>`.

## Phát hiện quan trọng khi nghiên cứu (quyết định hướng đi)

Đã kiểm tra trực tiếp file Prisma Client generate ra (`node_modules/.prisma/client/index.d.ts`, Prisma 6.19.3):

1. **Không có cách nào suy ngược từ kiểu `Employee` (interface dữ liệu thuần) ra tên model `'Employee'` hay Prisma delegate tương ứng.** TypeScript dùng structural typing — hai type cùng hình dạng là không phân biệt được. Vậy `BaseService<Employee>` (chỉ truyền entity, đúng y hệt ví dụ trong yêu cầu) **không thể** tự suy ra delegate/CreateInput/UpdateInput nếu không có thêm 1 trong 2 thứ: (a) một "registry" tự viết tay ánh xạ entity → model name, hoặc (b) brand/tag gắn thêm vào entity type.
2. Prisma **có sẵn, chính thức export** 2 utility type cực kỳ phù hợp: `Prisma.Args<TDelegate, Operation>` và `Prisma.Result<TDelegate, Args, Operation>` — cả hai đều suy ra kiểu chính xác **chỉ từ chính Prisma delegate type** (không cần biết tên model dạng string, không cần registry tự viết). Đây chính là cơ chế nội bộ mà Prisma dùng cho `$extends`.
3. Delegate của mọi model đều có `createManyAndReturn`/`updateManyAndReturn` (Postgres hỗ trợ `RETURNING`) — trả về **đầy đủ row** thay vì chỉ `{count}`. Đây là chìa khóa để bulk operation vẫn emit được event đầy đủ dữ liệu như operation đơn lẻ.
4. **Giới hạn quan trọng nhất, ảnh hưởng trực tiếp tới thiết kế cuối:** DTO (`CreateEmployeeDto`) và Prisma Input là 2 trục hoàn toàn khác nhau (đúng yêu cầu tài liệu: "không mặc định DTO = Prisma Input"). Vì vậy **không thể xoá `TCreateDto`/`TUpdateDto`/`TQuery` khỏi generic** — chúng không suy ra được từ Prisma. Chỉ có thể xoá phần generic *liên quan tới Prisma* (`TEntity`, `TDelegate` tách rời, `CreateInput`/`UpdateInput`) bằng cách gộp tất cả suy luận Prisma vào **1 generic duy nhất: `TDelegate`**.

→ Đã chọn phương án: **chấp nhận còn 4 generic** (`TDelegate, TCreateDto, TUpdateDto, TQuery`) ban đầu (sau đó rút gọn tiếp xuống 2 — xem quyết định #0 ở trên), đổi lại loại bỏ hoàn toàn mọi generic thô của Prisma (không còn `TEntity` tách riêng, không còn phải viết `Prisma.EmployeeUncheckedCreateInput`/`UpdateInput` ở bất kỳ đâu) và giữ type-safe bằng API chính thức của Prisma, không dùng mẹo suy luận không chính thức, không cần "brand" hay registry tự viết tay.

## Thiết kế cuối cùng

### 1. File mới: `backend/src/common/services/prisma-crud.types.ts`

Chứa toàn bộ "cầu nối" từ 1 Prisma delegate ra mọi kiểu cần thiết:

```ts
import { Prisma } from '@prisma/client';

/** Hình dạng tối thiểu BaseService cần từ 1 Prisma model delegate.
 * Method khai báo lỏng (args: any) để MỌI delegate thật của Prisma (vốn có
 * method generic-overload riêng từng call) đều thoả mãn bound này — Prisma
 * không cho phép diễn tả chữ ký generic-overload đó qua 1 free type param.
 * Kiểu chính xác từng operation được lấy lại riêng qua Prisma.Args/Result. */
export interface CrudDelegateShape {
  create(args: any): Promise<any>;
  createManyAndReturn(args: any): Promise<any>;
  findUnique(args: any): Promise<any>;
  findMany(args: any): Promise<any>;
  count(args: any): Promise<number>;
  update(args: any): Promise<any>;
  updateManyAndReturn(args: any): Promise<any>;
  delete(args: any): Promise<any>;
  deleteMany(args: any): Promise<any>;
}

export type EntityOf<D> = Prisma.Result<D, {}, 'create'>;
export type CreateDataOf<D> = Prisma.Args<D, 'create'>['data'];
export type UpdateDataOf<D> = Prisma.Args<D, 'update'>['data'];
export type CreateManyDataOf<D> = Prisma.Args<D, 'createManyAndReturn'>['data'];
export type UpdateManyWhereOf<D> = Prisma.Args<D, 'updateManyAndReturn'>['where'];
export type UpdateManyDataOf<D> = Prisma.Args<D, 'updateManyAndReturn'>['data'];
export type DeleteManyWhereOf<D> = Prisma.Args<D, 'deleteMany'>['where'];

/**
 * Cast được cô lập DUY NHẤT trong toàn bộ refactor này. Dùng đúng 1 lý do:
 * CrudDelegateShape phải khai method dạng lỏng (args: any) => Promise<any>
 * để mọi delegate Prisma thật đều thoả mãn bound (Prisma không cho diễn tả
 * chữ ký generic-overload riêng từng model qua 1 free type param) — nên kết
 * quả gọi `this.entity.*` bị nhìn thấy là `any` và cần ép lại đúng kiểu đã
 * suy ra qua Prisma.Result. KHÔNG dùng để "tin" data đầu vào khớp Prisma
 * input nữa (create/update nhận thẳng CreateDataOf<TDelegate>/
 * UpdateDataOf<TDelegate> làm parameter type, TypeScript tự kiểm tra ngay
 * tại nơi gọi — không cần cast cho input).
 * Không dùng any/unknown rải rác nơi khác - mọi chỗ cần "vượt rào" đều đi
 * qua đúng hàm này.
 */
export function unsafeCoerce<T>(value: unknown): T {
  return value as T;
}
```

### 2. Viết lại `backend/src/common/services/base.service.ts` (bản đã sửa audit + rút gọn còn 2 generic)

- Generic: `BaseService<TDelegate extends CrudDelegateShape, TQuery = unknown>` (bỏ `TCreateDto`/`TUpdateDto` — xem quyết định #0 ở trên).
- `implements IBaseService<EntityOf<TDelegate>, CreateDataOf<TDelegate>, UpdateDataOf<TDelegate>, TQuery>` — `IBaseService` (định nghĩa interface) **vẫn giữ nguyên 100%, không sửa 1 dòng nào**; chỉ có *đối số* truyền vào nó thay đổi (giờ tự suy từ `TDelegate` thay vì nhận qua 2 generic riêng).
- **Không còn pre-query cho not-found** ở `update`/`delete` — bắt lỗi Prisma trực tiếp. **Không còn cast cho input `data`** (loại bỏ hẳn việc DTO cần "vượt rào" — parameter type đã là `CreateDataOf<TDelegate>`/`UpdateDataOf<TDelegate>` ngay từ đầu, TypeScript tự kiểm tra tại nơi gọi). `unsafeCoerce` giờ chỉ còn dùng ở **đúng 1 loại chỗ**: đọc lại kết quả trả về từ `this.entity.*` (vì `CrudDelegateShape` buộc phải khai `any` cho return type).

```ts
function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

async findOne(id: string): Promise<EntityOf<TDelegate>> {
  const found = unsafeCoerce<EntityOf<TDelegate> | null>(await this.entity.findUnique({ where: { id } }));
  if (!found) throw this.notFoundException(id);
  return found;
}

async create(data: CreateDataOf<TDelegate>, actorUserId?: string): Promise<EntityOf<TDelegate>> {
  const prismaData = { ...data, createdByUserId: actorUserId, updatedByUserId: actorUserId }; // object RIÊNG, chỉ để ghi Prisma
  const created = unsafeCoerce<EntityOf<TDelegate>>(await this.entity.create({ data: prismaData }));
  this.emit(ENTITY_CREATED_EVENT, unsafeCoerce<{ id: string }>(created).id, data, actorUserId); // audit = data GỐC, chưa merge
  return created;
}

async update(id: string, data: UpdateDataOf<TDelegate>, actorUserId?: string): Promise<EntityOf<TDelegate>> {
  const prismaData = { ...data, updatedByUserId: actorUserId };
  try {
    const updated = unsafeCoerce<EntityOf<TDelegate>>(await this.entity.update({ where: { id }, data: prismaData }));
    this.emit(ENTITY_UPDATED_EVENT, id, data, actorUserId); // audit = data GỐC
    return updated;
  } catch (error) {
    if (isRecordNotFoundError(error)) throw this.notFoundException(id);
    throw error;
  }
}

async delete(id: string, actorUserId?: string): Promise<void> {
  try {
    await this.entity.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFoundError(error)) throw this.notFoundException(id);
    throw error;
  }
  this.emit(ENTITY_DELETED_EVENT, id, {}, actorUserId); // payload rỗng, đúng yêu cầu
}
```

- **`createMany(dataArray: CreateManyDataOf<TDelegate>, actorUserId?)`/`updateMany(args: { where: UpdateManyWhereOf<TDelegate>; data: UpdateManyDataOf<TDelegate> }, actorUserId?)`**: dùng `createManyAndReturn`/`updateManyAndReturn` như bản trước (không cần query thêm vì bản thân lệnh ghi đã trả về đủ row) — nhưng **payload audit đổi thành input gốc**, không phải row trả về:
  - `createMany`: emit 1 event/row, `payload = dataArray[i]` (item gốc theo đúng thứ tự — Postgres trả `RETURNING` đúng thứ tự insert cho 1 câu lệnh multi-row, đủ tin cậy ở quy mô hiện tại), `entityId = created[i].id`.
  - `updateMany`: emit 1 event/row bị ảnh hưởng, `payload = args.data` (object dùng chung cho cả batch, không phải row), `entityId = updated[i].id`.
- **`deleteMany(args: { where: DeleteManyWhereOf<TDelegate> }, actorUserId?)`**: **không query trước**, gọi thẳng `this.entity.deleteMany({where: args.where})`. Emit **1 event duy nhất cho cả batch** — không phải 1 event/row:
  ```ts
  async deleteMany(args: { where: DeleteManyWhereOf<TDelegate> }, actorUserId?: string) {
    await this.entity.deleteMany({ where: args.where });
    this.emit(ENTITY_DELETED_EVENT, BULK_ENTITY_ID_SENTINEL, { where: args.where }, actorUserId);
  }
  ```
  `BULK_ENTITY_ID_SENTINEL` = hằng số (vd `'BULK'`) export từ `entity-crud.event.ts`, dùng làm `entityId` khi không có 1 record cụ thể nào đại diện cho sự kiện — có comment giải thích rõ trong `AuditLogListener`/doc để người đọc audit log sau này không hiểu nhầm đó là 1 UUID thật.
- **Đổi `EntityCrudEvent.entity` → `EntityCrudEvent.payload`** (rename thuần, không đổi logic) để tên field phản ánh đúng: đây là "payload được ghi vào audit", không phải "toàn bộ entity" nữa.

### 3. `EmployeeService` (POC) — vẫn không khai báo lại CRUD nào, generic gọn hơn nữa

```ts
export class EmployeeService
  extends BaseService<PrismaService['employee'], GetEmployeesQueryDto>
  implements IEmployeeService
{
  constructor(prisma: PrismaService, eventEmitter: EventEmitter2) {
    super(prisma.employee, eventEmitter, AuditEntityType.EMPLOYEE, (id) => new EmployeeNotFoundException(id));
  }

  async findMany(...) { /* giữ nguyên y hệt hiện tại */ }
  // Không khai báo: create, createMany, findOne, update, updateMany, delete, deleteMany
}
```
Chỉ còn **2 generic** (`PrismaService['employee']`, `GetEmployeesQueryDto`) — không còn `CreateEmployeeDto`/`UpdateEmployeeDto` trong dòng `extends` nữa. `IEmployeeService.create(dto: CreateEmployeeDto)` vẫn hoạt động bình thường vì `CreateEmployeeDto` gán được vào `CreateDataOf<PrismaService['employee']>` (business field trùng khớp, `createdByUserId`/`updatedByUserId` vốn optional phía Prisma nên thiếu chúng không sao). Nếu sau này có entity mà DTO lệch hẳn với Prisma input, entity đó mới cần viết method riêng (tên khác `create`/`update`) để build `data` trước khi gọi `this.create(data, actorUserId)` — đúng tinh thần "service con quyết định data shape" của tài liệu.

### 4. `EmployeeController.update()` — strip field `id` (interceptor-only) trước khi gọi service

```ts
@Put(':id')
@UseInterceptors(AttachRouteIdInterceptor)
async update(@Param() params, @Body() dto: UpdateEmployeeDto, @CurrentUser() user) {
  const { id: _validatorOnly, ...data } = dto; // id chỉ phục vụ @IsEmployeeCodeUnique()/@IsEmployeeEmailUnique(), không phải business data
  const employee = await this.employeeService.update(params.id, data, user.id);
  ...
}
```
Controller là nơi duy nhất đụng vào `dto.id` này — cả `BaseService` lẫn `EmployeeService` đều nhận đúng data đã sạch, không đứa nào tự loại field nữa.

### Ảnh hưởng tới `IBaseService`

**Quyết định: KHÔNG sửa `IBaseService` trong lần refactor này.**

- Vì sao: `IBaseService`/`IEmployeeService`/`EmployeeController` chỉ quan tâm tầng DTO (Controller-facing), hoàn toàn tách khỏi cách `BaseService` suy luận kiểu Prisma nội bộ. `EntityOf<PrismaService['employee']>` sau khi suy ra sẽ khớp chính xác với `Employee` mà `IEmployeeService` đang khai báo → không có xung đột kiểu nào phát sinh.
- `createMany`/`updateMany`/`deleteMany` **chưa** được thêm vào `IBaseService`/`IEmployeeService` — chúng chỉ tồn tại như method concrete trên `BaseService`, sẵn sàng dùng khi cần, nhưng chưa lộ ra qua tầng Controller. Lý do: bulk "where" filter cần 1 kiểu hợp lý ở tầng Controller (khác hẳn `id: string` của single update) — thiết kế nó bây giờ là đoán mò khi chưa có route/tính năng thực tế cần dùng. Khi nào có nhu cầu (vd "import hàng loạt nhân viên"), sẽ mở rộng `IBaseService`/`IEmployeeService` đúng lúc đó với DTO/filter phù hợp cho chính tính năng đó.
- File bị ảnh hưởng nếu sau này cần đổi: chỉ `common/interfaces/base.interface.ts` (thêm 3 method signature — thay đổi thuần cộng thêm, không phá method cũ nào).

### Về mức độ "type-safe" thật sự (nói thẳng, không tô hồng)

- **Input (`data` truyền vào `create`/`update`) giờ an toàn hơn hẳn bản trước**: parameter type là `CreateDataOf<TDelegate>`/`UpdateDataOf<TDelegate>` ngay từ chữ ký method — TypeScript tự kiểm tra tại nơi gọi (Controller/Service), **không cần cast ở input nữa** (khác bản trước, vốn nhận `TCreateDto` tự do rồi phải `unsafeCoerce` để "tin" nó khớp Prisma input).
- Output (entity trả về): trước đây `TEntity` do người viết `EmployeeService` tự tay khai báo (`BaseService<Employee, ...>`) — TypeScript không hề kiểm tra `Employee` có thật sự khớp với `PrismaService['employee']` hay không, sai vẫn có thể compile. Sau khi refactor, `EntityOf<TDelegate>` **suy ra tự động** từ chính delegate — không còn khả năng viết nhầm entity type nữa.
- Cast còn lại (`unsafeCoerce`) giờ chỉ phục vụ đúng 1 lý do: **đọc lại kết quả `any` trả về từ `this.entity.*`** (vì `CrudDelegateShape` buộc phải khai method dạng `(args: any) => Promise<any>` để mọi delegate Prisma thật đều thoả mãn bound). Không còn lý do "DTO vs Prisma input" nữa — cast bị thu hẹp phạm vi hơn bản trước.
- Toàn bộ cast vẫn bị giới hạn trong đúng 1 hàm `unsafeCoerce` ở 1 file (`prisma-crud.types.ts`), có comment giải thích rõ — không rải `as any` khắp nơi.

### File khác bị ảnh hưởng bởi rename `entity` → `payload`

- `backend/src/common/events/entity-crud.event.ts`: rename field, thêm export `BULK_ENTITY_ID_SENTINEL`.
- `backend/src/modules/audit-log/listener/audit-log.listener.ts`: đổi `event.entity` → `event.payload` ở `writeAuditLog(...)`; thêm comment giải thích `BULK_ENTITY_ID_SENTINEL` khi gặp (không bắt buộc phải branch riêng — vẫn ghi `AuditLog.entityId = 'BULK'` bình thường, chỉ cần comment để người đọc log sau này hiểu).

### Docs API (`docs/06-api/employee/*.md`) cần cập nhật lại lần nữa

- `create-employee.md`/`update-employee.md`: sửa phần "Audit Log Behavior" — payload giờ là **data gốc do Controller/Service truyền vào `create`/`update`**, không phải "full row" như plan trước đã ghi nhầm.
- `update-employee.md`: thêm phần Controller strip `dto.id` trước khi gọi service (mục 4 ở trên); bỏ mô tả cũ "BaseService.update loads existing employee via findOne" — giờ không còn query đó nữa, thay bằng "bắt lỗi P2025 từ chính lệnh update".
- `delete-employee.md`: sửa "Audit Log Behavior" thành payload `{}`, bỏ mô tả "load existing row for the event payload" — không còn hành vi đó nữa.

## Việc sẽ làm khi bạn yêu cầu code (theo đúng thứ tự)

0. Lưu bản plan đã cập nhật này vào `docs/09-workflow/plans/base-service-generic-refactor.md` (ghi đè bản cũ).
1. Sửa `backend/src/common/events/entity-crud.event.ts`: rename `entity` → `payload`, thêm `BULK_ENTITY_ID_SENTINEL`.
2. Viết lại `backend/src/common/services/base.service.ts` theo đúng pseudocode ở mục "Thiết kế cuối cùng" #2 (bỏ pre-query not-found, tách `prismaData` khỏi `data` gốc, `deleteMany` = 1 event/batch).
3. Cập nhật `backend/src/modules/audit-log/listener/audit-log.listener.ts` (`event.entity` → `event.payload`).
4. Cập nhật `backend/src/modules/employee/controller/employee.controller.ts` (strip `dto.id` trước khi gọi `update`).
5. Cập nhật `backend/src/modules/employee/service/employee.service.ts`: đổi dòng `extends BaseService<...>` từ 4 generic xuống còn `BaseService<PrismaService['employee'], GetEmployeesQueryDto>`; bỏ import `CreateEmployeeDto`/`UpdateEmployeeDto` nếu không còn dùng chỗ nào khác trong file. Không khai báo lại CRUD nào (giữ nguyên như bản trước).
6. Chạy `npx tsc --noEmit` — 0 lỗi production code (loại trừ 2 file test cũ đã biết hỏng từ trước).
7. Cập nhật `AGENTS.md` Backend Rules theo hành vi audit mới.
8. Cập nhật `docs/06-api/employee/{create,update,delete}-employee.md` theo đúng mục "Docs API cần cập nhật lại lần nữa" ở trên.
9. Liệt kê đầy đủ file đã đổi + xác nhận không có regression ngoài phạm vi.

**Không đổi:** `IBaseService`, `IEmployeeService`, mọi DTO (trừ cách Controller dùng `UpdateEmployeeDto`, không đổi field), `ENTITY_CREATED_EVENT`/`ENTITY_UPDATED_EVENT`/`ENTITY_DELETED_EVENT` (tên topic giữ nguyên), `AuditEntityType`/`AuditAction`/`AuditLogRepository`.

**Nhắc lại Planning Rule:** kế hoạch này chỉ được thực thi khi bạn gửi yêu cầu code riêng, rõ ràng — việc duyệt plan (kể cả qua công cụ plan-mode) không tự động là lệnh bắt đầu code.
