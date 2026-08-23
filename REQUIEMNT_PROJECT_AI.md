## Quy tắc truyền data giữa Service con và BaseService

Hãy thiết kế `BaseService` theo nguyên tắc:

> **Service con là nơi quyết định data shape. BaseService không được tự áp đặt DTO hoặc Prisma Input type cụ thể lên service con.**

Ví dụ service con:

```ts
await this.create({
  name: dto.name,
  email: dto.email,
  departmentId: dto.departmentId,
});
```

thì `BaseService.create()` phải nhận chính xác data mà service con truyền vào và persist data đó xuống Prisma.

BaseService không được tự ý:

* thay đổi field của data;
* loại bỏ field;
* thêm business field không được yêu cầu;
* map DTO sang một DTO khác;
* hard-code `EmployeeCreateInput`;
* hard-code `DepartmentCreateInput`;
* yêu cầu service con truyền `TCreateInput` hoặc `TUpdateInput` dưới dạng generic.

---

## Nguyên tắc cho create

BaseService phải cung cấp:

```ts
create(data, actorUserId?)
```

Service con quyết định data:

```ts
await this.create({
  name: dto.name,
  email: dto.email,
});
```

BaseService phải thực hiện tương đương:

```ts
await this.entity.create({
  data,
});
```

Tức là:

```text
Service con data
      ↓
BaseService.create(data)
      ↓
Prisma delegate.create({ data })
      ↓
Database
```

Không được tự transform data nếu không cần thiết.

---

## Nguyên tắc cho createMany

BaseService phải hỗ trợ:

```ts
createMany(data)
```

hoặc API tương đương phù hợp với Prisma.

Ví dụ service con:

```ts
await this.createMany([
  {
    name: 'Employee 1',
    email: 'employee1@example.com',
  },
  {
    name: 'Employee 2',
    email: 'employee2@example.com',
  },
]);
```

BaseService phải persist đúng các record mà service con truyền vào.

Không được ép service con phải khai báo:

```ts
Prisma.EmployeeCreateManyInput[]
```

trong generic của `BaseService`.

---

## Nguyên tắc cho update

BaseService phải cung cấp:

```ts
update(id, data, actorUserId?)
```

Service con quyết định data:

```ts
await this.update(
  employeeId,
  {
    name: dto.name,
    email: dto.email,
  },
);
```

BaseService phải thực hiện tương đương:

```ts
await this.entity.update({
  where: {
    id: employeeId,
  },
  data,
});
```

`id` dùng để xác định record phải được lấy từ parameter của `update()`.

Không được cho phép `id` trong data body quyết định record cần update.

---

## Nguyên tắc cho updateMany

BaseService phải hỗ trợ:

```ts
updateMany(...)
```

và cho phép service con truyền điều kiện + data phù hợp với nhu cầu của service con.

Ví dụ:

```ts
await this.updateMany({
  where: {
    departmentId,
  },
  data: {
    status: 'ACTIVE',
  },
});
```

BaseService phải forward đúng:

```ts
await this.entity.updateMany({
  where,
  data,
});
```

Không được hard-code shape của `where` hoặc `data` cho một entity cụ thể.

---

## Nguyên tắc cho delete

BaseService phải cung cấp:

```ts
delete(id, actorUserId?)
```

và BaseService chịu trách nhiệm:

```ts
await this.entity.delete({
  where: {
    id,
  },
});
```

Service con chỉ cần truyền `id`.

---

## Nguyên tắc cho deleteMany

BaseService phải hỗ trợ:

```ts
deleteMany(...)
```

Ví dụ service con:

```ts
await this.deleteMany({
  where: {
    departmentId,
  },
});
```

BaseService phải forward điều kiện này xuống Prisma mà không tự thay đổi business logic.

---

# Vai trò của BaseService

BaseService chỉ nên chịu trách nhiệm các concern dùng chung:

```text
                    BaseService
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      CRUD            Audit             Events
        │                │                │
    create           actorUserId      EntityCrudEvent
    createMany
    findOne
    findMany
    update
    updateMany
    delete
    deleteMany
```

Trong đó:

### Service con chịu trách nhiệm

* data nào cần tạo;
* data nào cần update;
* điều kiện query đặc thù;
* business logic;
* DTO → data mapping nếu cần;
* validation/business rules đặc thù entity.

### BaseService chịu trách nhiệm

* gọi Prisma delegate;
* common CRUD behavior;
* not-found behavior;
* audit information;
* emit CRUD events;
* các behavior infrastructure dùng chung.

---

# Quan trọng: không biến BaseService thành DTO mapper

Không thiết kế kiểu:

```ts
async create(dto: TCreateDto) {
  const data = {
    // BaseService tự đoán field
  };

  await this.entity.create({ data });
}
```

Thay vào đó:

```ts
async create(
  data: TCreateData,
  actorUserId?: string,
) {
  await this.entity.create({
    data,
  });
}
```

`TCreateData` phải được thiết kế sao cho service con có thể truyền data phù hợp với entity hiện tại mà không cần khai báo `TCreateInput` trong generic của BaseService.

---

# Type-safety

Mặc dù BaseService phải nhận data từ service con một cách linh hoạt, **không được giải quyết vấn đề bằng `any`**.

Không muốn implementation cuối cùng tồn tại kiểu:

```ts
create(args: any)
createMany(args: any)
update(args: any)
updateMany(args: any)
```

Hãy sử dụng TypeScript conditional types / infer / Prisma delegate type / type mapping hoặc Prisma `$extends` nếu phù hợp.

Mục tiêu:

```text
Service con
     │
     │ truyền data
     ▼
BaseService<TEntity>
     │
     │ giữ nguyên data
     ▼
Prisma delegate
     │
     ▼
Database
```

TypeScript phải đảm bảo data truyền vào phù hợp với Prisma model tương ứng, nhưng service con **không phải truyền `TCreateInput`, `TUpdateInput`, `TDelegate` dưới dạng generic**.

---

# Expected API

Mục tiêu cuối cùng:

```ts
export class EmployeeService extends BaseService<Employee> {

  async someBusinessMethod(dto: CreateEmployeeDto) {
    return this.create({
      name: dto.name,
      email: dto.email,
      departmentId: dto.departmentId,
    });
  }

  async someBulkMethod(data: EmployeeData[]) {
    return this.createMany(data);
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    return this.update(id, {
      name: dto.name,
      email: dto.email,
    });
  }

  async updateDepartmentEmployees(departmentId: string) {
    return this.updateMany({
      where: {
        departmentId,
      },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  async deleteEmployee(id: string) {
    return this.delete(id);
  }

  async deleteDepartmentEmployees(departmentId: string) {
    return this.deleteMany({
      where: {
        departmentId,
      },
    });
  }
}
```

Điểm quan trọng nhất cần giữ:

> **BaseService là generic CRUD infrastructure, không phải business-data mapper. Service con quyết định data; BaseService nhận data đó, giữ nguyên semantics của data và persist xuống Prisma delegate tương ứng.**

Nếu BaseService cần thêm `createdByUserId`, `updatedByUserId` hoặc các system/audit fields, hãy xử lý chúng ở một layer riêng và phải phân biệt rõ **system-managed fields** với **business data do service con truyền vào**. Không được âm thầm thay đổi business data của service con.
